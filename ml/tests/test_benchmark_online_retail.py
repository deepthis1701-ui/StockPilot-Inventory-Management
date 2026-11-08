"""Tests for the offline retail benchmark helpers."""

import unittest

import pandas as pd

from scripts.benchmark_online_retail import accuracy_metrics, build_training_products


class BenchmarkHelperTests(unittest.TestCase):
    def test_accuracy_metrics_calculate_mae_rmse_and_wape(self):
        metrics = accuracy_metrics([10, 0], [8, 2])

        self.assertEqual(metrics["mae"], 2.0)
        self.assertEqual(metrics["rmse"], 2.0)
        self.assertEqual(metrics["wape"], 40.0)

    def test_training_products_are_selected_from_training_rows_only(self):
        dates = pd.date_range("2026-01-01", periods=60, freq="D")
        rows = []

        for day_index, day in enumerate(dates):
            if day_index != 20:
                rows.append({"sku": "SKU-A", "date": day, "quantity": 1.0})
            rows.append({"sku": "SKU-B", "date": day, "quantity": 2.0})
            if day_index >= 55:
                rows.append({"sku": "SKU-C", "date": day, "quantity": 100.0})

        frame = pd.DataFrame(rows)
        train_end = dates[-1]
        products, histories = build_training_products(frame, train_end, top_products=2)

        self.assertEqual([item["sku"] for item in products], ["SKU-B", "SKU-A"])
        self.assertNotIn("SKU-C", histories)
        self.assertEqual(len(histories["SKU-A"]), 60)
        self.assertEqual(histories["SKU-A"][20], 0.0)
        self.assertEqual(histories["SKU-B"][20], 2.0)


if __name__ == "__main__":
    unittest.main()
