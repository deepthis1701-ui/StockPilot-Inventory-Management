import pandas as pd
import numpy as np
import joblib

from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


# --------------------------------------------------
# PATHS
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_FILE = BASE_DIR / "preprocessing" / "training_data.csv"
MODEL_FILE = BASE_DIR / "models" / "demand_model.joblib"


# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------

print("Loading training data...")

data = pd.read_csv(DATA_FILE)

data["date"] = pd.to_datetime(data["date"])

data = data.sort_values(
    ["id", "date"]
).reset_index(drop=True)

print("Dataset shape:", data.shape)


# --------------------------------------------------
# FEATURES
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


# Remove missing values
data = data.dropna(
    subset=features + [target]
)


# --------------------------------------------------
# TIME-BASED SPLIT
# --------------------------------------------------

unique_dates = sorted(
    data["date"].unique()
)

split_index = int(
    len(unique_dates) * 0.8
)

split_date = unique_dates[split_index]

print("Split date:", split_date)

train = data[
    data["date"] < split_date
]

test = data[
    data["date"] >= split_date
]


X_train = train[features]
y_train = train[target]

X_test = test[features]
y_test = test[target]

print("Training rows:", len(train))
print("Testing rows:", len(test))


# --------------------------------------------------
# BASELINE
# --------------------------------------------------

print("\nCalculating seasonal baseline...")

baseline_predictions = test["lag_7"]

baseline_mae = mean_absolute_error(
    y_test,
    baseline_predictions
)

baseline_rmse = np.sqrt(
    mean_squared_error(
        y_test,
        baseline_predictions
    )
)

non_zero = y_test != 0

baseline_mape = (
    np.mean(
        np.abs(
            (y_test[non_zero] -
             baseline_predictions[non_zero])
            / y_test[non_zero]
        )
    ) * 100
)

print("\nBASELINE RESULTS")
print("----------------")
print("MAE :", round(baseline_mae, 3))
print("RMSE:", round(baseline_rmse, 3))
print("MAPE:", round(baseline_mape, 2), "%")


# --------------------------------------------------
# RANDOM FOREST
# --------------------------------------------------

print("\nTraining Random Forest...")

model = RandomForestRegressor(
    n_estimators=100,
    max_depth=15,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

model.fit(
    X_train,
    y_train
)


# --------------------------------------------------
# PREDICTION
# --------------------------------------------------

print("Generating predictions...")

predictions = model.predict(
    X_test
)


# --------------------------------------------------
# METRICS
# --------------------------------------------------

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        predictions
    )
)

non_zero = y_test != 0

mape = (
    np.mean(
        np.abs(
            (y_test[non_zero] -
             predictions[non_zero])
            / y_test[non_zero]
        )
    ) * 100
)


print("\nRANDOM FOREST RESULTS")
print("---------------------")
print("MAE :", round(mae, 3))
print("RMSE:", round(rmse, 3))
print("MAPE:", round(mape, 2), "%")


# --------------------------------------------------
# MODEL COMPARISON
# --------------------------------------------------

print("\nMODEL COMPARISON")
print("----------------")

print(
    f"Baseline      → MAE: {baseline_mae:.3f}, "
    f"RMSE: {baseline_rmse:.3f}, "
    f"MAPE: {baseline_mape:.2f}%"
)

print(
    f"Random Forest → MAE: {mae:.3f}, "
    f"RMSE: {rmse:.3f}, "
    f"MAPE: {mape:.2f}%"
)


# --------------------------------------------------
# SAVE MODEL
# --------------------------------------------------

MODEL_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)

joblib.dump(
    model,
    MODEL_FILE
)

print("\n===================================")
print("MODEL TRAINING COMPLETE")
print("Model saved to:")
print(MODEL_FILE)
print("===================================")