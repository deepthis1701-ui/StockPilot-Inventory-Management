# StockPilot

**AI-powered demand forecasting and inventory decision support for retailers.**

StockPilot is being developed as a deployable full-stack product, not a static dashboard. Its target workflow is to maintain a trustworthy inventory ledger, learn demand patterns from sales history, and turn forecasts into explainable replenishment decisions.

## Current architecture

- **Frontend:** React 18, Vite, React Router, Recharts
- **Application API:** Node.js, Express
- **Database:** MongoDB / Mongoose
- **Forecasting service:** Python, Flask, pandas, scikit-learn
- **Charts:** Recharts

## Local development

### Prerequisites
- Node.js 20 LTS or later
- Python 3.10+
- MongoDB 7+ (local or managed)

### Configure the backend
1. Copy `.env.example` to `.env` in the project root.
2. Set `MONGODB_URI`, `ML_API_URL`, and `CLIENT_ORIGIN`.
3. Install Node dependencies with `npm install`.
4. Start the API with `npm run server`.

### Start the frontend
1. Run `npm install`.
2. Run `npm run dev`.
3. Open the Vite URL shown in the terminal.

### Start the ML service
1. Create and activate a Python virtual environment.
2. Install `ml/requirements.txt`.
3. Prepare the source sales data and run the documented preprocessing and training scripts before starting the Flask service.
4. Start the service with `python ml/app.py`.

> The ML service currently expects generated forecast and recommendation artifacts. A clean setup must generate those artifacts before the service starts. This is an active engineering task; do not treat sample CSV output as live business data.

## Product principles

1. Inventory on hand comes from persisted stock records and stock movements, never from sales-derived estimates.
2. Sales and purchase receipts are auditable transactions.
3. Forecasts are evaluated with chronological holdout data and compared with a simple baseline.
4. Replenishment uses forecast demand, supplier lead time, service level, safety stock, and actual on-hand / on-order quantities.
5. Every screen must consume the same documented API contract. No hidden hardcoded product-risk lists or fake forecast values.

## Deployment

The application is being prepared for separate frontend, API, database, and ML-service deployment. Use managed MongoDB, HTTPS, environment-injected secrets, restricted CORS origins, health checks, and persistent logs. Never put database credentials or signing secrets in frontend variables.

## Engineering status

This repository is under active development. Features should be described as production-ready only after automated tests, integration tests, data validation, and a live deployment smoke test pass.
