import pandas as pd
import numpy as np
import joblib

from pathlib import Path
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "preprocessing" / "training_data.csv"
MODEL_PATH = BASE_DIR / "models" / "gradient_boosting_model.joblib"

# --------------------------------------------------
# Load data
# --------------------------------------------------

print("Loading training data...")

data = pd.read_csv(DATA_PATH)

data["date"] = pd.to_datetime(data["date"])

data = data.sort_values(["id", "date"])

print("Dataset shape:", data.shape)

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

target = "sales"

data = data.dropna(subset=features + [target])

# --------------------------------------------------
# Time-based train/test split
# --------------------------------------------------

unique_dates = sorted(data["date"].unique())

split_index = int(len(unique_dates) * 0.8)
split_date = unique_dates[split_index]

train = data[data["date"] < split_date]
test = data[data["date"] >= split_date]

print("Split date:", split_date)
print("Training rows:", len(train))
print("Testing rows:", len(test))

X_train = train[features]
y_train = train[target]

X_test = test[features]
y_test = test[target]

# --------------------------------------------------
# Train model
# --------------------------------------------------

print("\nTraining HistGradientBoosting model...")

model = HistGradientBoostingRegressor(
    learning_rate=0.08,
    max_iter=200,
    max_leaf_nodes=31,
    l2_regularization=1.0,
    random_state=42
)

model.fit(X_train, y_train)

# --------------------------------------------------
# Predictions
# --------------------------------------------------

print("Generating predictions...")

predictions = model.predict(X_test)

# Sales cannot be negative
predictions = np.maximum(predictions, 0)

# --------------------------------------------------
# Metrics
# --------------------------------------------------

mae = mean_absolute_error(y_test, predictions)

rmse = np.sqrt(
    mean_squared_error(y_test, predictions)
)

# MAPE only for actual sales > 0
non_zero = y_test != 0

mape = np.mean(
    np.abs(
        (y_test[non_zero] - predictions[non_zero])
        / y_test[non_zero]
    )
) * 100

# WAPE
wape = (
    np.sum(np.abs(y_test - predictions))
    / np.sum(np.abs(y_test))
) * 100

print("\nHIST GRADIENT BOOSTING RESULTS")
print("--------------------------------")
print(f"MAE : {mae:.3f}")
print(f"RMSE: {rmse:.3f}")
print(f"MAPE: {mape:.2f} %")
print(f"WAPE: {wape:.2f} %")

# --------------------------------------------------
# Existing Random Forest results
# --------------------------------------------------

print("\nCURRENT RANDOM FOREST RESULTS")
print("--------------------------------")
print("MAE : 1.225")
print("RMSE: 2.216")
print("MAPE: 57.59 %")

# --------------------------------------------------
# Save model
# --------------------------------------------------

joblib.dump(model, MODEL_PATH)

print("\n===================================")
print("GRADIENT BOOSTING TRAINING COMPLETE")
print("Model saved to:")
print(MODEL_PATH)
print("===================================")