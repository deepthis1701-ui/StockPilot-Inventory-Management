"""StockPilot forecasting API.

Forecast requests are built from live MongoDB sales history by the Node API.
This service deliberately does not load static forecast CSV files at startup.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS

from models.forecasting import generate_forecasts

app = Flask(__name__)
CORS(app)


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "StockPilot ML Forecasting API",
        "engine": "data-driven-demand-forecasting",
    })


@app.post("/api/forecast")
def forecast():
    payload = request.get_json(silent=True) or {}
    products = payload.get("products")

    if not isinstance(products, list):
        return jsonify({"error": "Request body must contain a products array."}), 400

    try:
        raw_days = payload.get("forecast_days", 30)
        days = int(raw_days)
        result = generate_forecasts(
            products=products,
            forecast_days=days,
            target_product_id=payload.get("target_product_id"),
        )
        return jsonify(result)
    except (TypeError, ValueError) as error:
        return jsonify({"error": str(error)}), 400
    except Exception:
        app.logger.exception("Forecast generation failed")
        return jsonify({"error": "Forecast generation failed. Check the ML service logs."}), 500


if __name__ == "__main__":
    print("StockPilot ML Forecasting API")
    print("Running on http://127.0.0.1:8000")
    app.run(host="0.0.0.0", port=8000, debug=False)
