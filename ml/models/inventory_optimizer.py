import pandas as pd
import numpy as np
import math

from pathlib import Path

# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

FORECAST_PATH = BASE_DIR / "models" / "demand_forecasts.csv"
DATA_PATH = BASE_DIR / "preprocessing" / "training_data.csv"
OUTPUT_PATH = BASE_DIR / "models" / "inventory_recommendations.csv"

# --------------------------------------------------
# Load data
# --------------------------------------------------

print("Loading forecast data...")

forecast = pd.read_csv(FORECAST_PATH)

print("Loading historical sales data...")

sales = pd.read_csv(DATA_PATH)

sales["date"] = pd.to_datetime(sales["date"])

# --------------------------------------------------
# Calculate current inventory proxy
# --------------------------------------------------
# M5 sales data does not contain current inventory levels.
# For the first optimization version, we create a
# conservative inventory proxy from recent demand.
#
# This will later be replaced by real inventory data
# stored in MongoDB.

recent_sales = (
    sales.sort_values("date")
    .groupby("id")
    .tail(28)
)

inventory_stats = (
    recent_sales
    .groupby("id")
    .agg(
        avg_daily_sales=("sales", "mean"),
        sales_std=("sales", "std"),
        max_recent_sales=("sales", "max")
    )
    .reset_index()
)

# Missing standard deviation means demand was constant
inventory_stats["sales_std"] = (
    inventory_stats["sales_std"]
    .fillna(0)
)

# --------------------------------------------------
# Merge forecast with demand statistics
# --------------------------------------------------

result = forecast.merge(
    inventory_stats,
    on="id",
    how="left"
)

# --------------------------------------------------
# Select 30-day forecast
# --------------------------------------------------

result = result[
    result["forecast_days"] == 30
].copy()

# --------------------------------------------------
# Inventory parameters
# --------------------------------------------------

LEAD_TIME_DAYS = 3
SERVICE_FACTOR = 1.28

# --------------------------------------------------
# Safety Stock
# --------------------------------------------------

result["safety_stock"] = (
    result["sales_std"]
    * SERVICE_FACTOR
    * np.sqrt(LEAD_TIME_DAYS)
)

# --------------------------------------------------
# Reorder Point
# --------------------------------------------------

result["reorder_point"] = (
    result["predicted_daily_demand"]
    * LEAD_TIME_DAYS
    + result["safety_stock"]
)

# --------------------------------------------------
# Estimated current stock
# --------------------------------------------------
# Temporary proxy based on recent demand.
# Later this will come from MongoDB.

result["estimated_current_stock"] = (
    result["avg_daily_sales"] * 7
)

# --------------------------------------------------
# Recommended order quantity
# --------------------------------------------------

result["recommended_order_quantity"] = (
    result["reorder_point"]
    - result["estimated_current_stock"]
)

result["recommended_order_quantity"] = (
    result["recommended_order_quantity"]
    .clip(lower=0)
)

# --------------------------------------------------
# Stockout risk
# --------------------------------------------------

result["stockout_risk"] = np.where(
    result["estimated_current_stock"]
    < result["reorder_point"] * 0.5,
    "High",
    np.where(
        result["estimated_current_stock"]
        < result["reorder_point"],
        "Medium",
        "Low"
    )
)

# --------------------------------------------------
# Overstock risk
# --------------------------------------------------

result["overstock_risk"] = np.where(
    result["estimated_current_stock"]
    > result["predicted_daily_demand"] * 30,
    "High",
    np.where(
        result["estimated_current_stock"]
        > result["predicted_daily_demand"] * 21,
        "Medium",
        "Low"
    )
)

# --------------------------------------------------
# Overall risk
# --------------------------------------------------

def calculate_overall_risk(row):

    if (
        row["stockout_risk"] == "High"
        or row["overstock_risk"] == "High"
    ):
        return "High"

    if (
        row["stockout_risk"] == "Medium"
        or row["overstock_risk"] == "Medium"
    ):
        return "Medium"

    return "Low"


result["overall_risk"] = result.apply(
    calculate_overall_risk,
    axis=1
)

# --------------------------------------------------
# Recommendation
# --------------------------------------------------

# --------------------------------------------------
# Recommendation
# --------------------------------------------------

def recommendation(row):

    quantity = math.ceil(
        row["recommended_order_quantity"]
    )

    if row["stockout_risk"] == "High":
        return f"Urgent reorder: {quantity} units"

    if row["stockout_risk"] == "Medium":
        return f"Reorder soon: {quantity} units"

    if row["overstock_risk"] == "High":
        return "Avoid additional stock"

    return "Stock level acceptable"


result["recommendation"] = result.apply(
    recommendation,
    axis=1
)


# --------------------------------------------------
# Select useful columns
# --------------------------------------------------

output_columns = [
    "id",
    "predicted_daily_demand",
    "total_predicted_demand",
    "avg_daily_sales",
    "sales_std",
    "safety_stock",
    "reorder_point",
    "estimated_current_stock",
    "recommended_order_quantity",
    "stockout_risk",
    "overstock_risk",
    "overall_risk",
    "recommendation"
]

result = result[output_columns]

# --------------------------------------------------
# Save results
# --------------------------------------------------

result.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\nINVENTORY OPTIMIZATION COMPLETE")
print("--------------------------------")
print("Products analyzed:", len(result))

print("\nRisk distribution:")
print(
    result["overall_risk"]
    .value_counts()
)

print("\nSample recommendations:")
print(
    result.head(10).to_string(index=False)
)

print("\nSaved to:")
print(OUTPUT_PATH)