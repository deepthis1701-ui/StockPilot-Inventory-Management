# StockPilot

**AI-powered demand forecasting and inventory decision support for retailers.**

StockPilot is a deployable full-stack inventory platform. Its core data flow starts with a persistent product catalogue, actual on-hand stock, auditable stock movements and recorded sales. Forecasts and replenishment recommendations are calculated from observed demand and supplier lead times.

## Architecture

- **Frontend:** React 18, Vite, React Router, Recharts
- **Application API:** Node.js, Express
- **Database:** MongoDB / Mongoose
- **Forecasting service:** Python, Flask, pandas, scikit-learn
- **Charts:** Recharts

## Local development

Prerequisites: Node.js 20+, Python 3.10+, and MongoDB.

1. Copy `.env.example` to `.env` and configure `MONGODB_URI`, `ML_API_URL`, and `CLIENT_ORIGIN`.
2. Install Node dependencies with `npm install`.
3. Start MongoDB.
4. Start the API using `npm run server`.
5. Start the frontend using `npm run dev`.
6. Start the ML service after completing its data preparation and model training steps.

## Initial API

- `GET /api/health` — API, database and forecasting service status
- `GET /api/products` — product catalogue
- `POST /api/products` — create a product and opening stock
- `GET /api/inventory` — real stock plus demand-based inventory indicators
- `PUT /api/inventory/:productId` — audited manual stock adjustment
- `POST /api/sales` — record a sale and deduct stock
- `POST /api/purchases/receive` — receive stock and record a purchase movement
- `GET /api/stock-movements` — movement ledger
- `GET /api/sales` — sales aggregated by day
- `GET /api/forecast` — model forecast (requires the ML service)

## Data integrity principles

- On-hand stock is stored in MongoDB and is never inferred from historical sales.
- Sales decrement stock and create sales and movement records.
- Purchase receipts increment stock and create movement records.
- Manual adjustments create an auditable movement with before/after balances.
- When there is no sales history, demand-dependent risk and reorder values are reported as unknown rather than fabricated.
- Current demand indicators are a transparent 28-day observed-sales baseline, not a trained ML forecast. Forecast accuracy claims will only be shown after chronological validation.

## Deployment

Deploy the Vite frontend, Node API, and Python forecasting service separately. Use managed MongoDB, HTTPS, restricted CORS origins, and environment-injected secrets. Set the Vite API proxy appropriately for local development and configure the production frontend API base URL before deployment.

This project is under active development. Features should be called production-ready only after automated tests, integration tests, data validation, and a live deployment smoke test pass.
