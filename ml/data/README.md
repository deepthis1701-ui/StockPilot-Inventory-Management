# Offline retail forecasting benchmark

StockPilot includes an offline benchmark script for the UCI **Online Retail**
dataset. The benchmark is deliberately separate from the live store:

- It reads a local copy of the public workbook.
- It creates product/day demand series from fulfilled positive-quantity rows.
- It trains and validates using dates before the final 14-day holdout.
- It compares StockPilot's selected model against the seven-day seasonal-naive baseline.
- It writes local CSV and JSON results into `ml/benchmark_results/`.
- It does **not** connect to MongoDB, call the live Node API, or import benchmark rows into the store.

## Dataset

Download **Online Retail.xlsx** from the UCI Machine Learning Repository:

https://archive.ics.uci.edu/dataset/352/online+retail

Place the workbook here:

`ml/data/Online Retail.xlsx`

UCI reports 541,909 transactions from 1 December 2010 to 9 December 2011 for a UK-based online retailer. The dataset is licensed under CC BY 4.0. Keep the source attribution with any report or public result:

> Chen, D. (2015). Online Retail [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5BW33.

The workbook is intentionally not committed to Git because it is a separate, large source dataset. The local path is ignored by `.gitignore`.

## Install the benchmark dependency

From the repository root in PowerShell:

```powershell
cd ml
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run the benchmark

From the `ml` directory:

```powershell
python scripts/benchmark_online_retail.py --file "data/Online Retail.xlsx"
```

Optional arguments:

```powershell
python scripts/benchmark_online_retail.py --file "data/Online Retail.xlsx" --horizon 14 --top-products 100
```

## Output

The script creates:

- `ml/benchmark_results/online_retail_summary.json` — date split, selected model, MAE, RMSE and WAPE.
- `ml/benchmark_results/online_retail_predictions.csv` — product/day actuals and predictions for inspection.

The benchmark chooses eligible SKUs using training-period data only. Its last 14 calendar days remain untouched until the independent final comparison.

## Interpretation and limitations

This is a reproducible historical benchmark on one UK online gift retailer, not proof of accuracy for another shop, country, product mix, or future period. The UCI data is from 2010–2011 and is not recent. Results should be reported with the dataset name, dates, forecast horizon, SKU count, and baseline comparison. Do not upload these public dataset rows into a retailer's live transaction history.
