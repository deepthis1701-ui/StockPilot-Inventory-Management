import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import Inventory from './schemas/Inventory.js';

const app = express();

const PORT = 5000;
const ML_API = 'http://localhost:8000';

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());


/* --------------------------------------------------
   Helper: Call Python ML API
-------------------------------------------------- */

async function mlRequest(endpoint) {
  const response = await fetch(`${ML_API}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `ML API returned ${response.status} for ${endpoint}`
    );
  }

  return response.json();
}


/* --------------------------------------------------
   Dashboard
-------------------------------------------------- */

app.get('/api/dashboard', async (req, res) => {
  try {
    const [inventoryData, riskData, recommendationData] =
      await Promise.all([
        mlRequest('/api/inventory'),
        mlRequest('/api/risk'),
        mlRequest('/api/recommendations')
      ]);

    const inventory = inventoryData.inventory || [];

    const totalProducts = inventory.length;

    const totalDemand = inventory.reduce(
      (sum, item) =>
        sum + Number(item.predicted_daily_demand || 0),
      0
    );

    const totalStock = inventory.reduce(
      (sum, item) =>
        sum + Number(item.estimated_current_stock || 0),
      0
    );

    const lowStock = inventory.filter(
      item =>
        item.stockout_risk === 'High' ||
        item.stockout_risk === 'Medium'
    ).length;

    res.json({
      totalProducts,
      totalStock: Number(totalStock.toFixed(2)),
      totalDemand: Number(totalDemand.toFixed(2)),
      lowStock,
      inventoryValue: null,
      products: inventory,
      risk: riskData,
      recommendations:
        recommendationData.recommendations || []
    });

  } catch (error) {
    console.error(
      'Dashboard ML API error:',
      error.message
    );

    res.status(500).json({
      error: 'Unable to load ML dashboard data'
    });
  }
});


/* --------------------------------------------------
   Historical Sales
-------------------------------------------------- */

app.get('/api/sales', async (req, res) => {
  try {
    const range =
      req.query.range || 'daily';

    const metric =
      req.query.metric || 'units';

    const endpoint =
      `/api/sales?range=${encodeURIComponent(range)}` +
      `&metric=${encodeURIComponent(metric)}`;

    const data =
      await mlRequest(endpoint);

    res.json(data);

  } catch (error) {
    console.error(
      'Sales ML API error:',
      error.message
    );

    res.status(500).json({
      error: 'Unable to load historical sales data'
    });
  }
});


/* --------------------------------------------------
   Forecast
-------------------------------------------------- */

app.get('/api/forecast', async (req, res) => {
  try {
    const product =
      req.query.product;

    const days =
      Number(req.query.days) || 30;

    let endpoint =
      `/api/forecast?days=${days}`;

    if (
      product &&
      product !== 'All Products'
    ) {
      endpoint +=
        `&product=${encodeURIComponent(product)}`;
    }

    const data =
      await mlRequest(endpoint);

    res.json(data);

  } catch (error) {
    console.error(
      'Forecast ML API error:',
      error.message
    );

    res.status(500).json({
      error: 'Unable to load demand forecast'
    });
  }
});


/* --------------------------------------------------
   Save Current Inventory Stock
-------------------------------------------------- */

app.put('/api/inventory/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { currentStock } = req.body;

    if (currentStock === undefined) {
      return res.status(400).json({
        error: 'currentStock is required'
      });
    }

    const stock = Number(currentStock);

    if (!Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({
        error: 'currentStock must be a non-negative number'
      });
    }

    const inventory = await Inventory.findOneAndUpdate(
      { productId },
      {
        productId,
        currentStock: stock
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      message: 'Inventory stock updated successfully',
      inventory
    });

  } catch (error) {
    console.error(
      'Inventory update error:',
      error.message
    );

    res.status(500).json({
      error: 'Unable to update inventory stock'
    });
  }
});

/* --------------------------------------------------
   Inventory
-------------------------------------------------- */

app.get('/api/inventory', async (req, res) => {
  try {
    const product = req.query.product;

    let endpoint = '/api/inventory';

    if (product) {
      endpoint +=
        `?product=${encodeURIComponent(product)}`;
    }

    /*
     * Get inventory calculations from
     * the Python ML API.
     */
    const data = await mlRequest(endpoint);

    /*
     * Get actual current stock from MongoDB.
     */
    const savedInventory =
      await Inventory.find({}).lean();

    /*
     * Create lookup:
     * productId -> inventory record
     */
    const inventoryMap = new Map();

    savedInventory.forEach((item) => {
      inventoryMap.set(
        item.productId,
        item
      );
    });

    /*
     * Merge MongoDB stock with ML calculations.
     *
     * Risk and reorder values are recalculated
     * using the actual current stock.
     */
    if (
      data &&
      Array.isArray(data.inventory)
    ) {
      data.inventory =
        data.inventory.map((item) => {
          const productId =
            item.id ||
            item.productId;

          const savedInventoryItem =
            inventoryMap.get(productId);

          /*
           * If MongoDB has real stock,
           * use it.
           *
           * Otherwise keep the ML fallback stock.
           */
          const currentStock =
            savedInventoryItem
              ? Number(
                  savedInventoryItem.currentStock
                )
              : Number(
                  item.estimated_current_stock || 0
                );

          /*
           * Existing ML values.
           */
          const predictedDailyDemand =
            Number(
              item.predicted_daily_demand || 0
            );

          const reorderPoint =
            Number(
              item.reorder_point || 0
            );

          const safetyStock =
            Number(
              item.safety_stock || 0
            );

          /*
           * Recalculate recommended order
           * using actual current stock.
           */
          const recommendedOrderQuantity =
            Math.max(
              reorderPoint - currentStock,
              0
            );

          /*
           * Stockout risk.
           */
          let stockoutRisk = 'Low';

          if (
            currentStock <
            reorderPoint * 0.5
          ) {
            stockoutRisk = 'High';
          } else if (
            currentStock < reorderPoint
          ) {
            stockoutRisk = 'Medium';
          }

          /*
           * Overstock risk.
           */
          let overstockRisk = 'Low';

          if (
            currentStock >
            predictedDailyDemand * 30
          ) {
            overstockRisk = 'High';
          } else if (
            currentStock >
            predictedDailyDemand * 21
          ) {
            overstockRisk = 'Medium';
          }

          /*
           * Overall risk.
           */
          let overallRisk = 'Low';

          if (
            stockoutRisk === 'High' ||
            overstockRisk === 'High'
          ) {
            overallRisk = 'High';
          } else if (
            stockoutRisk === 'Medium' ||
            overstockRisk === 'Medium'
          ) {
            overallRisk = 'Medium';
          }

          /*
           * Recommendation.
           */
          let recommendation =
            'Stock level acceptable';

          if (stockoutRisk === 'High') {
            recommendation =
              `Urgent reorder: ${recommendedOrderQuantity.toFixed(0)} units`;
          } else if (
            stockoutRisk === 'Medium'
          ) {
            recommendation =
              `Reorder soon: ${recommendedOrderQuantity.toFixed(0)} units`;
          } else if (
            overstockRisk === 'High'
          ) {
            recommendation =
              'Avoid additional stock';
          }

          /*
           * Return ML data + live inventory
           * calculations.
           */
          return {
            ...item,

            /*
             * Actual stock from MongoDB.
             */
            current_stock:
              currentStock,

            /*
             * Keep this field because the
             * frontend currently reads it.
             */
            estimated_current_stock:
              currentStock,

            /*
             * Recalculated values.
             */
            safety_stock:
              safetyStock,

            reorder_point:
              reorderPoint,

            recommended_order_quantity:
              recommendedOrderQuantity,

            stockout_risk:
              stockoutRisk,

            overstock_risk:
              overstockRisk,

            overall_risk:
              overallRisk,

            recommendation:
              recommendation,
          };
        });
    }

    res.json(data);

  } catch (error) {
    console.error(
      'Inventory API error:',
      error.message
    );

    res.status(500).json({
      error:
        'Unable to load inventory data'
    });
  }
});
/* --------------------------------------------------
   Recommendations
-------------------------------------------------- */

app.get('/api/recommendations', async (req, res) => {
  try {
    const data =
      await mlRequest(
        '/api/recommendations'
      );

    res.json(data);

  } catch (error) {
    console.error(
      'Recommendations ML API error:',
      error.message
    );

    res.status(500).json({
      error: 'Unable to load recommendations'
    });
  }
});


/* --------------------------------------------------
   Risk
-------------------------------------------------- */

app.get('/api/risk', async (req, res) => {
  try {
    const data =
      await mlRequest('/api/risk');

    res.json(data);

  } catch (error) {
    console.error(
      'Risk ML API error:',
      error.message
    );

    res.status(500).json({
      error: 'Unable to load risk analysis'
    });
  }
});


/* --------------------------------------------------
   Health Check
-------------------------------------------------- */

app.get('/api/health', async (req, res) => {
  try {
    const mlHealth =
      await mlRequest('/health');

    res.json({
      status: 'OK',
      node: 'StockPilot backend is running',
      mlApi: mlHealth
    });

  } catch (error) {
    console.error(
      'Health check error:',
      error.message
    );

    res.status(503).json({
      status: 'ERROR',
      node: 'StockPilot backend is running',
      mlApi: 'Unavailable'
    });
  }
});


/* --------------------------------------------------
   Start Server
-------------------------------------------------- */

app.listen(PORT, () => {
  console.log(
    `StockPilot backend running on http://localhost:${PORT}`
  );
});