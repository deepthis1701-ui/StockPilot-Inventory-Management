import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "preprocessing"

SALES_FILE = DATA_DIR / "sales_train_validation.csv"
CALENDAR_FILE = DATA_DIR / "calendar.csv"

print("Loading sales data...")

sales = pd.read_csv(SALES_FILE)

print("Sales loaded:", sales.shape)

# Keep product/store information
id_columns = [
    "id",
    "item_id",
    "dept_id",
    "cat_id",
    "store_id",
    "state_id"
]

# Daily sales columns
day_columns = [
    col for col in sales.columns
    if col.startswith("d_")
]

print("Number of sales days:", len(day_columns))

# Convert wide format to long format
print("Converting sales data to long format...")

sales_long = sales.melt(
    id_vars=id_columns,
    value_vars=day_columns,
    var_name="d",
    value_name="sales"
)

print("Long format:", sales_long.shape)

# Load calendar
print("Loading calendar...")

calendar = pd.read_csv(CALENDAR_FILE)

calendar["date"] = pd.to_datetime(calendar["date"])

# Merge sales with calendar
print("Merging calendar data...")

data = sales_long.merge(
    calendar,
    on="d",
    how="left"
)

# Sort chronologically
data = data.sort_values(
    ["store_id", "item_id", "date"]
)

# Basic calendar features
data["day_of_week"] = data["date"].dt.dayofweek
data["day_of_month"] = data["date"].dt.day
data["month_num"] = data["date"].dt.month
data["year_num"] = data["date"].dt.year

# Lag features
print("Creating lag features...")

data["lag_7"] = data.groupby(
    ["store_id", "item_id"]
)["sales"].shift(7)

data["lag_28"] = data.groupby(
    ["store_id", "item_id"]
)["sales"].shift(28)

# Rolling demand features
print("Creating rolling features...")

data["rolling_mean_7"] = data.groupby(
    ["store_id", "item_id"]
)["sales"].transform(
    lambda x: x.shift(1).rolling(7).mean()
)

data["rolling_mean_28"] = data.groupby(
    ["store_id", "item_id"]
)["sales"].transform(
    lambda x: x.shift(1).rolling(28).mean()
)

# Remove rows where lag/rolling values are unavailable
data = data.dropna(
    subset=[
        "lag_7",
        "lag_28",
        "rolling_mean_7",
        "rolling_mean_28"
    ]
)

# Save processed data
OUTPUT_FILE = OUTPUT_DIR / "processed_sales.csv"

print("Saving processed data...")

data.to_csv(
    OUTPUT_FILE,
    index=False
)

print("===================================")
print("PREPROCESSING COMPLETE")
print("Rows:", len(data))
print("Columns:", len(data.columns))
print("Saved to:", OUTPUT_FILE)
print("===================================")