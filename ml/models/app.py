from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from pathlib import Path

# --------------------------------------------------
# App setup
# --------------------------------------------------

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent

FORECAST_PATH = BASE_DIR / "models" / "demand_forecasts.csv"
INVENTORY_PATH = BASE_DIR / "models" / "inventory_recommendations.csv"

# --------------------------------------------------
# Load ML outputs
# --------------------------------------------------

print("Loading forecast data...")
forecasts = pd.read_csv(FORECAST_PATH)

print("Loading inventory recommendations...")
inventory = pd.read_csv(INVENTORY_PATH)

print("ML API data loaded successfully.")


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "service": "StockPilot ML API"
    })


# --------------------------------------------------
# Forecast endpoint
# --------------------------------------------------

@app.route("/api/forecast", methods=["GET"])
def get_forecast():

    product_id = request.args.get("product")
    days = request.args.get("days", default=30, type=int)

    result = forecasts[
        forecasts["forecast_days"] == days
    ].copy()

    if product_id:
        result = result[
            result["id"] == product_id
        ]

    return jsonify({
        "count": len(result),
        "forecasts": result.to_dict(orient="records")
    })


# --------------------------------------------------
# Inventory endpoint
# --------------------------------------------------

@app.route("/api/inventory", methods=["GET"])
def get_inventory():

    product_id = request.args.get("product")

    result = inventory.copy()

    if product_id:
        result = result[
            result["id"] == product_id
        ]

    return jsonify({
        "count": len(result),
        "inventory": result.to_dict(orient="records")
    })


# --------------------------------------------------
# Recommendations endpoint
# --------------------------------------------------

@app.route("/api/recommendations", methods=["GET"])
def get_recommendations():

    result = inventory[
        inventory["recommended_order_quantity"] > 0
    ].copy()

    # Highest risk first
    risk_order = {
        "High": 0,
        "Medium": 1,
        "Low": 2
    }

    result["risk_order"] = (
        result["overall_risk"]
        .map(risk_order)
        .fillna(3)
    )

    result = result.sort_values(
        ["risk_order", "recommended_order_quantity"],
        ascending=[True, False]
    )

    result = result.drop(columns=["risk_order"])

    return jsonify({
        "count": len(result),
        "recommendations": result.to_dict(
            orient="records"
        )
    })


# --------------------------------------------------
# Risk endpoint
# --------------------------------------------------

@app.route("/api/risk", methods=["GET"])
def get_risk():

    risk_counts = (
        inventory["overall_risk"]
        .value_counts()
        .to_dict()
    )

    stockout_counts = (
        inventory["stockout_risk"]
        .value_counts()
        .to_dict()
    )

    overstock_counts = (
        inventory["overstock_risk"]
        .value_counts()
        .to_dict()
    )

    return jsonify({
        "overall": risk_counts,
        "stockout": stockout_counts,
        "overstock": overstock_counts
    })


# --------------------------------------------------
# Run server
# --------------------------------------------------

if __name__ == "__main__":

    print("\n===================================")
    print("StockPilot ML API")
    print("===================================")
    print("Running on http://localhost:8000")
    print("===================================\n")

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=False
    )