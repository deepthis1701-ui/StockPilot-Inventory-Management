"""Data-driven demand forecasting for StockPilot.

The service trains a pooled model only when the retailer has enough historical
observations across several products. Otherwise it uses a transparent seasonal
naive baseline. Forecasts are withheld when an individual SKU has too little
history; this avoids inventing demand for new or rarely sold products.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


MIN_HISTORY_DAYS = 56
MIN_NONZERO_SALES_DAYS = 7
VALIDATION_DAYS = 14
MIN_GLOBAL_TRAIN_ROWS = 300
MIN_GLOBAL_SERIES = 3
FEATURE_NAMES = [
    "lag_1",
    "lag_7",
    "lag_14",
    "lag_28",
    "mean_7",
    "mean_28",
    "std_28",
    "same_weekday_mean",
    "trend_7_vs_28",
    "weekday_sin",
    "weekday_cos",
    "month_sin",
    "month_cos",
]


def _parse_date(value: Any, fallback: date) -> date:
    if not value:
        return fallback
    try:
        return date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return fallback


def _make_features(history: list[float], target_date: date) -> list[float]:
    values = np.asarray(history, dtype=float)
    last_7 = values[-7:]
    last_28 = values[-28:]
    same_weekday = values[-7:: -7][:4] if len(values) >= 7 else values

    mean_7 = float(np.mean(last_7))
    mean_28 = float(np.mean(last_28))
    weekday_angle = 2.0 * np.pi * target_date.weekday() / 7.0
    month_angle = 2.0 * np.pi * (target_date.month - 1) / 12.0

    return [
        float(values[-1]),
        float(values[-7]),
        float(values[-14]),
        float(values[-28]),
        mean_7,
        mean_28,
        float(np.std(last_28)),
        float(np.mean(same_weekday)) if len(same_weekday) else mean_28,
        mean_7 - mean_28,
        float(np.sin(weekday_angle)),
        float(np.cos(weekday_angle)),
        float(np.sin(month_angle)),
        float(np.cos(month_angle)),
    ]


def _metrics(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float | None]:
    if len(actual) == 0:
        return {"mae": None, "rmse": None, "wape": None}
    errors = np.abs(actual - predicted)
    denominator = float(np.sum(np.abs(actual)))
    wape = float(np.sum(errors) / denominator * 100.0) if denominator > 0 else None
    return {
        "mae": round(float(mean_absolute_error(actual, predicted)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(actual, predicted))), 4),
        "wape": round(wape, 2) if wape is not None else None,
    }


def _normalise_products(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalised = []
    today = date.today()

    for raw in products:
        if not isinstance(raw, dict):
            continue
        raw_values = raw.get("daily_sales", [])
        if not isinstance(raw_values, list):
            continue

        values = []
        for item in raw_values:
            try:
                quantity = float(item)
            except (TypeError, ValueError):
                quantity = 0.0
            if not np.isfinite(quantity) or quantity < 0:
                quantity = 0.0
            values.append(quantity)

        # A daily series must be contiguous and end on last_date. The API layer
        # constructs the calendar and inserts zero-sale days.
        last_date = _parse_date(raw.get("last_date"), today)
        if len(values) > 730:
            values = values[-730:]

        normalised.append({
            "id": str(raw.get("id") or raw.get("product_id") or ""),
            "name": str(raw.get("name") or "Unnamed product"),
            "sku": str(raw.get("sku") or ""),
            "values": values,
            "last_date": last_date,
            "history_days": len(values),
            "sales_days": sum(1 for value in values if value > 0),
        })

    return [item for item in normalised if item["id"]]


def _build_validation_data(series: list[dict[str, Any]]):
    train_x, train_y = [], []
    test_x, test_y, baseline_y, test_ids = [], [], [], []

    for item in series:
        values = item["values"]
        count = len(values)
        validation_start = count - VALIDATION_DAYS
        if validation_start <= 28:
            continue

        for index in range(28, count):
            target_day = item["last_date"] - timedelta(days=count - 1 - index)
            features = _make_features(values[:index], target_day)
            actual = float(values[index])
            baseline = float(values[index - 7])

            if index < validation_start:
                train_x.append(features)
                train_y.append(actual)
            else:
                test_x.append(features)
                test_y.append(actual)
                baseline_y.append(baseline)
                test_ids.append(item["id"])

    return (
        np.asarray(train_x, dtype=float),
        np.asarray(train_y, dtype=float),
        np.asarray(test_x, dtype=float),
        np.asarray(test_y, dtype=float),
        np.asarray(baseline_y, dtype=float),
        test_ids,
    )


def generate_forecasts(
    products: list[dict[str, Any]],
    forecast_days: int = 30,
    target_product_id: str | None = None,
) -> dict[str, Any]:
    """Build forecasts from daily sales arrays supplied by the inventory API."""

    if not isinstance(forecast_days, int) or forecast_days < 1 or forecast_days > 90:
        raise ValueError("forecast_days must be an integer between 1 and 90.")

    series = _normalise_products(products)
    eligible = [
        item for item in series
        if item["history_days"] >= MIN_HISTORY_DAYS
        and item["sales_days"] >= MIN_NONZERO_SALES_DAYS
    ]

    model = None
    model_metrics = None
    baseline_metrics = None
    selected_model = "seasonal_naive_7"
    selection_reason = "Insufficient cross-product history to validate a machine-learning model; using a transparent seasonal baseline."

    train_x, train_y, test_x, test_y, baseline_y, test_ids = _build_validation_data(eligible)

    if len(test_y):
        baseline_metrics = _metrics(test_y, baseline_y)

    # Train a pooled model only when multiple products provide enough rows.
    # The last 14 days of every eligible series are held out chronologically.
    if (
        len(eligible) >= MIN_GLOBAL_SERIES
        and len(train_y) >= MIN_GLOBAL_TRAIN_ROWS
        and len(test_y) >= 30
    ):
        candidate = HistGradientBoostingRegressor(
            learning_rate=0.06,
            max_iter=160,
            max_leaf_nodes=15,
            l2_regularization=1.5,
            min_samples_leaf=12,
            random_state=42,
        )
        candidate.fit(train_x, train_y)
        candidate_predictions = np.maximum(candidate.predict(test_x), 0.0)
        model_metrics = _metrics(test_y, candidate_predictions)

        ml_wape = model_metrics["wape"]
        baseline_wape = baseline_metrics["wape"] if baseline_metrics else None

        # The ML candidate must beat the seasonal-naive baseline on a
        # chronological holdout. Otherwise the simpler baseline is retained.
        if (
            ml_wape is not None
            and baseline_wape is not None
            and ml_wape < baseline_wape * 0.98
        ):
            model = candidate
            selected_model = "hist_gradient_boosting"
            selection_reason = "The pooled ML model achieved lower WAPE than the seasonal-naive baseline on the chronological validation window."
        else:
            selection_reason = "The ML candidate did not beat the seasonal-naive baseline on the chronological validation window; the baseline was retained."
    elif len(eligible) > 0:
        selection_reason = (
            "There is enough per-product history for a seasonal baseline, "
            "but not enough cross-product validation data to trust a pooled ML model."
        )

    rows = []
    target_id = str(target_product_id) if target_product_id else None
    selected_series = [item for item in series if not target_id or item["id"] == target_id]

    for item in selected_series:
        values = item["values"]
        history_days = item["history_days"]
        sales_days = item["sales_days"]

        if history_days < MIN_HISTORY_DAYS or sales_days < MIN_NONZERO_SALES_DAYS:
            rows.append({
                "id": item["id"],
                "product_id": item["id"],
                "name": item["name"],
                "sku": item["sku"],
                "forecast_days": forecast_days,
                "forecast_status": "insufficient_history",
                "predicted_daily_demand": None,
                "total_predicted_demand": None,
                "history_days": history_days,
                "sales_days": sales_days,
                "minimum_history_days": MIN_HISTORY_DAYS,
                "minimum_sales_days": MIN_NONZERO_SALES_DAYS,
                "message": (
                    f"Need at least {MIN_HISTORY_DAYS} tracked days and "
                    f"{MIN_NONZERO_SALES_DAYS} days with sales. This product has "
                    f"{history_days} tracked days and {sales_days} sales days."
                ),
                "model_used": None,
            })
            continue

        future_values = list(values)
        forecast_series = []
        future_date = item["last_date"] + timedelta(days=1)

        for step in range(forecast_days):
            target_date = future_date + timedelta(days=step)
            if model is not None:
                features = np.asarray([_make_features(future_values, target_date)], dtype=float)
                prediction = float(max(0.0, model.predict(features)[0]))
            else:
                # Repeat the most recent weekday pattern. This is an explicit
                # baseline, not presented as a trained ML forecast.
                prediction = float(max(0.0, future_values[-7]))

            prediction = round(prediction, 4)
            future_values.append(prediction)
            forecast_series.append({
                "date": target_date.isoformat(),
                "predicted_demand": prediction,
            })

        total = float(sum(day["predicted_demand"] for day in forecast_series))
        rows.append({
            "id": item["id"],
            "product_id": item["id"],
            "name": item["name"],
            "sku": item["sku"],
            "forecast_days": forecast_days,
            "forecast_status": "forecast_available",
            "predicted_daily_demand": round(total / forecast_days, 4),
            "total_predicted_demand": round(total, 4),
            "history_days": history_days,
            "sales_days": sales_days,
            "model_used": selected_model,
            "forecast_series": forecast_series,
        })

    available_count = sum(1 for row in rows if row["forecast_status"] == "forecast_available")
    status = "ok" if available_count else ("no_products" if not selected_series else "insufficient_history")

    return {
        "status": status,
        "forecast_days": forecast_days,
        "count": len(rows),
        "available_count": available_count,
        "model": {
            "selected": selected_model if available_count else None,
            "selection_reason": selection_reason,
            "training_series": len(eligible),
            "training_rows": int(len(train_y)),
            "validation_days_per_series": VALIDATION_DAYS,
            "baseline_metrics": baseline_metrics,
            "ml_candidate_metrics": model_metrics,
        },
        "forecasts": rows,
    }
