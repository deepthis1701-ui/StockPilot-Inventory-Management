"""Unit tests for the StockPilot demand forecasting engine.

Run from the ml directory:
    python -m unittest discover -s tests -v

The fixtures here are synthetic test inputs only. They are never sent to or
stored in the retailer's MongoDB sales history.
"""

import unittest
from datetime import date

import numpy as np

from models.forecasting import (
    VALIDATION_DAYS,
    _build_full_training_data,
    _build_validation_data,
    _recursive_forecast,
    generate_forecasts,
)


class IncrementLastValuePredictor:
    """Tiny deterministic predictor used only to test recursive feedback."""

    def predict(self, features):
        return np.asarray([features[0][0] + 1.0])


class ForecastingTests(unittest.TestCase):
    def test_seasonal_baseline_repeats_last_week_pattern(self):
        history = [float((index % 7) + 1) for index in range(56)]

        predictions = _recursive_forecast(
            history=history,
            start_date=date(2026, 11, 9),
            horizon=14,
        )

        self.assertEqual(predictions, history[-7:] * 2)

    def test_ml_forecast_uses_its_own_prior_predictions(self):
        history = [float((index % 7) + 1) for index in range(56)]

        predictions = _recursive_forecast(
            history=history,
            start_date=date(2026, 11, 9),
            horizon=4,
            predictor=IncrementLastValuePredictor(),
        )

        self.assertEqual(predictions, [8.0, 9.0, 10.0, 11.0])

    def test_validation_uses_full_fourteen_day_holdout(self):
        values = [float((index % 7) + 1) for index in range(70)]
        series = [{
            "id": "product-1",
            "name": "Test product",
            "sku": "TEST-001",
            "values": values,
            "last_date": date(2026, 11, 8),
            "history_days": len(values),
            "sales_days": len(values),
        }]

        train_x, train_y, contexts = _build_validation_data(series)

        self.assertEqual(len(contexts), 1)
        self.assertEqual(len(contexts[0]["history"]), 70 - VALIDATION_DAYS)
        self.assertEqual(len(contexts[0]["actual"]), VALIDATION_DAYS)
        self.assertEqual(contexts[0]["history"], values[:-VALIDATION_DAYS])
        self.assertEqual(contexts[0]["actual"], values[-VALIDATION_DAYS:])
        self.assertEqual(train_x.shape[1], 13)
        self.assertEqual(len(train_x), len(train_y))

    def test_final_training_data_includes_validation_window_targets(self):
        values = [float((index % 7) + 1) for index in range(70)]
        series = [{
            "id": "product-1",
            "name": "Test product",
            "sku": "TEST-001",
            "values": values,
            "last_date": date(2026, 11, 8),
            "history_days": len(values),
            "sales_days": len(values),
        }]

        train_x, train_y = _build_full_training_data(series)

        # 70 observations produce targets at indices 28 through 69.
        self.assertEqual(len(train_y), 70 - 28)
        self.assertEqual(train_x.shape, (70 - 28, 13))
        self.assertEqual(train_y[-1], values[-1])

    def test_insufficient_history_does_not_create_a_forecast(self):
        result = generate_forecasts(
            products=[{
                "id": "product-1",
                "name": "New product",
                "sku": "NEW-001",
                "last_date": "2026-11-08",
                "daily_sales": [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            }],
            forecast_days=14,
        )

        self.assertEqual(result["status"], "insufficient_history")
        self.assertEqual(result["available_count"], 0)
        self.assertIsNone(result["forecasts"][0]["predicted_daily_demand"])
        self.assertEqual(result["forecasts"][0]["forecast_status"], "insufficient_history")

    def test_eligible_single_product_uses_transparent_baseline(self):
        values = [float((index % 7) + 1) for index in range(56)]
        result = generate_forecasts(
            products=[{
                "id": "product-1",
                "name": "Established product",
                "sku": "EST-001",
                "last_date": "2026-11-08",
                "daily_sales": values,
            }],
            forecast_days=14,
        )

        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["available_count"], 1)
        self.assertEqual(result["forecasts"][0]["model_used"], "seasonal_naive_7")
        self.assertEqual(result["model"]["validation_method"], "recursive_14_day_holdout")
        self.assertIsNotNone(result["model"]["baseline_metrics"])


if __name__ == "__main__":
    unittest.main()
