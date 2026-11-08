"""Offline benchmark for StockPilot using the UCI Online Retail dataset.

This tool does not connect to MongoDB and never imports benchmark rows into the
retailer's live store. It uses a final chronological holdout to measure how
StockPilot's selected 14-day forecasting method performs on unseen days.

Run from the ml directory:
    python scripts/benchmark_online_retail.py --file data/Online Retail.xlsx

Outputs are written locally to benchmark_results/.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

ML_ROOT = Path(__file__).resolve().parents[1]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from models.forecasting import (  # noqa: E402
    MIN_HISTORY_DAYS,
    MIN_NONZERO_SALES_DAYS,
    generate_forecasts,
)


def accuracy_metrics(actual: list[float], predicted: list[float]) -> dict[str, float | None]:
    """Calculate MAE, RMSE and WAPE for aligned actual/predicted values."""
    y_true = np.asarray(actual, dtype=float)
    y_pred = np.asarray(predicted, dtype=float)

    if len(y_true) == 0 or len(y_true) != len(y_pred):
        return {"mae": None, "rmse": None, "wape": None}

    errors = np.abs(y_true - y_pred)
    denominator = float(np.sum(np.abs(y_true)))
    return {
        "mae": round(float(np.mean(errors)), 4),
        "rmse": round(float(np.sqrt(np.mean(np.square(y_true - y_pred)))), 4),
        "wape": round(float(np.sum(errors) / denominator * 100.0), 2)
        if denominator > 0 else None,
    }


def load_retail_workbook(path: Path) -> pd.DataFrame:
    """Load fulfilled positive sales from the public UCI workbook."""
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset file not found: {path}. Download the UCI Online Retail "
            "workbook and place Online Retail.xlsx in ml/data."
        )

    frame = pd.read_excel(path, engine="openpyxl")
    required = {"InvoiceNo", "StockCode", "Quantity", "InvoiceDate"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(
            "Dataset is missing required columns: " + ", ".join(sorted(missing))
        )

    frame = frame.copy()
    frame["invoice_text"] = frame["InvoiceNo"].fillna("").astype(str).str.strip()
    frame["sku"] = (
        frame["StockCode"].fillna("").astype(str).str.strip()
        .str.replace(r"\.0$", "", regex=True)
    )
    frame["quantity"] = pd.to_numeric(frame["Quantity"], errors="coerce")
    frame["date"] = pd.to_datetime(frame["InvoiceDate"], errors="coerce").dt.normalize()

    # UCI marks cancellations with invoice numbers beginning with C. Exclude
    # cancellations and non-positive quantities; this benchmark measures gross
    # fulfilled demand and does not net returns against sales.
    frame = frame[
        (~frame["invoice_text"].str.upper().str.startswith("C"))
        & frame["quantity"].gt(0)
        & frame["date"].notna()
        & frame["sku"].ne("")
        & frame["sku"].str.lower().ne("nan")
    ]

    if frame.empty:
        raise ValueError("No valid positive sales rows remain after cleaning.")

    return frame[["sku", "date", "quantity"]]


def build_training_products(
    sales: pd.DataFrame,
    train_end: pd.Timestamp,
    top_products: int,
) -> tuple[list[dict[str, Any]], dict[str, list[float]]]:
    """Create contiguous daily histories using training data only."""
    train = sales[sales["date"] <= train_end]
    daily = train.groupby(["sku", "date"], as_index=False)["quantity"].sum()

    candidates = []
    for sku, group in daily.groupby("sku"):
        first_day = group["date"].min()
        history_days = int((train_end - first_day).days) + 1
        sales_days = int(group.loc[group["quantity"] > 0, "date"].nunique())

        if history_days < MIN_HISTORY_DAYS or sales_days < MIN_NONZERO_SALES_DAYS:
            continue

        candidates.append({
            "sku": str(sku),
            "units": float(group["quantity"].sum()),
            "first_day": first_day,
            "group": group,
        })

    # Select the busiest eligible SKUs using training data only. The final
    # holdout is never used to select products or train the forecast model.
    candidates.sort(key=lambda row: row["units"], reverse=True)
    candidates = candidates[:top_products]

    products = []
    histories: dict[str, list[float]] = {}

    for item in candidates:
        sku = item["sku"]
        date_index = pd.date_range(item["first_day"], train_end, freq="D")
        values = (
            item["group"].set_index("date")["quantity"]
            .reindex(date_index, fill_value=0)
            .astype(float)
            .tolist()
        )

        histories[sku] = values
        products.append({
            "id": sku,
            "name": sku,
            "sku": sku,
            "last_date": train_end.date().isoformat(),
            "daily_sales": values,
        })

    return products, histories


def run_benchmark(
    workbook: Path,
    horizon: int = 14,
    top_products: int = 100,
    output_dir: Path | None = None,
) -> dict[str, Any]:
    if horizon < 1 or horizon > 90:
        raise ValueError("Horizon must be between 1 and 90 days.")
    if top_products < 3:
        raise ValueError("Use at least 3 products so pooled ML validation is possible.")

    sales = load_retail_workbook(workbook)
    dataset_start = sales["date"].min().normalize()
    dataset_end = sales["date"].max().normalize()
    test_start = dataset_end - pd.Timedelta(days=horizon - 1)
    train_end = test_start - pd.Timedelta(days=1)

    products, histories = build_training_products(sales, train_end, top_products)
    if not products:
        raise ValueError(
            "No products met StockPilot's minimum history rules. "
            "Check the dataset file and date coverage."
        )

    engine_result = generate_forecasts(products, forecast_days=horizon)
    forecast_by_sku = {
        str(item["sku"]): item
        for item in engine_result.get("forecasts", [])
        if item.get("forecast_status") == "forecast_available"
    }

    holdout = sales[
        (sales["date"] >= test_start)
        & (sales["date"] <= dataset_end)
    ]
    actual_by_sku_day = (
        holdout.groupby(["sku", "date"])["quantity"].sum().to_dict()
    )

    prediction_rows = []
    evaluated_skus = []

    for product in products:
        sku = product["sku"]
        forecast = forecast_by_sku.get(sku)
        if not forecast:
            continue

        history = histories[sku]
        forecast_series = forecast.get("forecast_series", [])
        if len(forecast_series) != horizon or len(history) < 7:
            continue

        evaluated_skus.append(sku)
        for step, forecast_day in enumerate(forecast_series):
            forecast_date = pd.Timestamp(forecast_day["date"]).normalize()
            actual = float(actual_by_sku_day.get((sku, forecast_date), 0.0))
            baseline = float(history[-7 + (step % 7)])
            prediction_rows.append({
                "sku": sku,
                "date": forecast_date.date().isoformat(),
                "actual_units": actual,
                "stockpilot_forecast_units": float(forecast_day["predicted_demand"]),
                "seasonal_naive_units": baseline,
                "model_used": forecast.get("model_used"),
            })

    if not prediction_rows:
        raise ValueError("No products produced forecasts for the outer holdout window.")

    predictions = pd.DataFrame(prediction_rows)
    actual_values = predictions["actual_units"].tolist()
    selected_values = predictions["stockpilot_forecast_units"].tolist()
    baseline_values = predictions["seasonal_naive_units"].tolist()

    selected_metrics = accuracy_metrics(actual_values, selected_values)
    baseline_metrics = accuracy_metrics(actual_values, baseline_values)
    selected_wape = selected_metrics["wape"]
    baseline_wape = baseline_metrics["wape"]

    if selected_wape is None or baseline_wape is None:
        comparison = "WAPE unavailable because the holdout has zero total actual demand."
    elif selected_wape < baseline_wape:
        comparison = (
            "StockPilot's selected model beat the seasonal-naive baseline "
            "on the independent final holdout."
        )
    elif selected_wape > baseline_wape:
        comparison = (
            "The seasonal-naive baseline beat StockPilot's selected model "
            "on the independent final holdout."
        )
    else:
        comparison = (
            "StockPilot's selected model matched the seasonal-naive baseline "
            "on the independent final holdout."
        )

    summary = {
        "dataset": "UCI Online Retail",
        "dataset_doi": "10.24432/C5BW33",
        "dataset_start": dataset_start.date().isoformat(),
        "dataset_end": dataset_end.date().isoformat(),
        "training_end": train_end.date().isoformat(),
        "holdout_start": test_start.date().isoformat(),
        "holdout_end": dataset_end.date().isoformat(),
        "forecast_horizon_days": horizon,
        "clean_positive_transaction_rows": int(len(sales)),
        "unique_skus_in_clean_data": int(sales["sku"].nunique()),
        "eligible_products_selected_from_training": int(len(products)),
        "products_scored": int(len(evaluated_skus)),
        "forecast_rows_scored": int(len(predictions)),
        "stockpilot_model_selected_on_internal_validation": engine_result["model"]["selected"],
        "internal_validation_method": engine_result["model"].get("validation_method"),
        "internal_validation_baseline_metrics": engine_result["model"]["baseline_metrics"],
        "internal_validation_ml_candidate_metrics": engine_result["model"]["ml_candidate_metrics"],
        "independent_holdout_stockpilot_metrics": selected_metrics,
        "independent_holdout_seasonal_naive_metrics": baseline_metrics,
        "comparison": comparison,
        "warning": (
            "This is a historical benchmark on one UK online gift retailer. "
            "It does not establish accuracy for another retailer, category, "
            "country, or future period."
        ),
    }

    target_dir = output_dir or (ML_ROOT / "benchmark_results")
    target_dir.mkdir(parents=True, exist_ok=True)
    predictions_path = target_dir / "online_retail_predictions.csv"
    summary_path = target_dir / "online_retail_summary.json"
    predictions.to_csv(predictions_path, index=False)
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    summary["output_files"] = {
        "predictions_csv": str(predictions_path),
        "summary_json": str(summary_path),
    }
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Benchmark StockPilot on UCI Online Retail.")
    parser.add_argument(
        "--file",
        type=Path,
        default=ML_ROOT / "data" / "Online Retail.xlsx",
        help="Path to the UCI Online Retail Excel workbook.",
    )
    parser.add_argument("--horizon", type=int, default=14, help="Chronological holdout horizon in days.")
    parser.add_argument("--top-products", type=int, default=100, help="Maximum eligible SKUs selected from training data.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=ML_ROOT / "benchmark_results",
        help="Local folder for benchmark result files.",
    )
    args = parser.parse_args()

    try:
        summary = run_benchmark(
            workbook=args.file,
            horizon=args.horizon,
            top_products=args.top_products,
            output_dir=args.output_dir,
        )
    except (FileNotFoundError, ValueError, ImportError) as error:
        print(f"Benchmark could not run: {error}", file=sys.stderr)
        return 2

    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
