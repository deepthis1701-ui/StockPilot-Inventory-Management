import pandas as pd
import numpy as np
import joblib

from pathlib import Path

# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = BASE_DIR / "preprocessing" / "training_data.csv"
MODEL_PATH = BASE_DIR / "models" / "gradient_boosting_model.joblib"
OUTPUT_PATH = BASE_DIR / "models" / "demand_forecasts.csv"

# --------------------------------------------------
# Load model and data
# --------------------------------------------------

print("Loading trained model...")

model = joblib.load(MODEL_PATH)

print("Loading training data...")

data = pd.read_csv(DATA_PATH)
data["date"] = pd.to_datetime(data["date"])

data = data.sort_values(["id", "date"])

# --------------------------------------------------
# Features
# --------------------------------------------------

features = [
    "lag_7",
    "lag_28",
    "rolling_mean_7",
    "rolling_mean_28",
    "day_of_week",
    "day_of_month",
    "month_num",
    "year_num",
    "snap_CA",
    "snap_TX",
    "snap_WI"
]

# --------------------------------------------------
# Get latest record for every product/store series
# --------------------------------------------------

latest = (
    data.sort_values("date")
    .groupby("id")
    .tail(1)
    .copy()
)

print("Number of series:", len(latest))

# --------------------------------------------------
# Generate future forecasts
# --------------------------------------------------

forecast_results = []

forecast_horizons = [7, 30, 90]

for _, row in latest.iterrows():

    series_id = row["id"]
    last_date = row["date"]

    # Current feature values
    current_features = row[features].copy()

    # Use current model prediction as the base forecast.
    # For the first version, we create a demand estimate
    # for each requested horizon.

    prediction = model.predict(
        pd.DataFrame([current_features])
    )[0]

    prediction = max(0, prediction)

    for horizon in forecast_horizons:

        forecast_results.append({
            "id": series_id,
            "last_date": last_date,
            "forecast_days": horizon,
            "predicted_daily_demand": prediction,
            "total_predicted_demand": prediction * horizon
        })

# --------------------------------------------------
# Create forecast dataframe
# --------------------------------------------------

forecast_df = pd.DataFrame(forecast_results)

# --------------------------------------------------
# Save results
# --------------------------------------------------

forecast_df.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\nFORECAST GENERATION COMPLETE")
print("--------------------------------")
print("Forecast rows:", len(forecast_df))
print("Forecast horizons:", forecast_horizons)

print("\nSample forecasts:")
print(
    forecast_df.head(10).to_string(index=False)
)

print("\nSaved to:")
print(OUTPUT_PATH)