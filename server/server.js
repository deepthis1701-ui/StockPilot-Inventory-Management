import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import { config } from './config.js';
import Product from './schemas/Product.js';
import Inventory from './schemas/Inventory.js';
import StockMovement from './schemas/StockMovement.js';
import SalesTransaction from './schemas/SalesTransaction.js';

const app = express();
const PORT = config.port;
const ML_API = config.mlApiUrl;
const origins = config.clientOrigin.split(',').map((value) => value.trim()).filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: '1mb' }));

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const finiteNumber = (value) => Number.isFinite(Number(value));
const positiveNumber = (value) => finiteNumber(value) && Number(value) > 0;
const nonNegativeNumber = (value) => finiteNumber(value) && Number(value) >= 0;

function riskForProduct(stock, demand, leadTime, coverage) {
  if (demand === null || demand <= 0) return 'Unknown';
  if (coverage <= leadTime) return 'High';
  if (coverage <= leadTime + 3) return 'Medium';
  return 'Low';
}

async function createInventorySnapshot() {
  const products = await Product.find({ isActive: true }).sort({ name: 1 }).lean();
  if (products.length === 0) {
    return {
      products: [],
      inventory: [],
      stats: { totalProducts: 0, critical: 0, attention: 0, healthy: 0, unknown: 0, recommendedUnits: 0, inventoryValue: 0 }
    };
  }

  const productIds = products.map((product) => String(product._id));
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() - 27);

  const [stockRows, salesRows] = await Promise.all([
    Inventory.find({ productId: { $in: productIds } }).lean(),
    SalesTransaction.aggregate([
      { $match: { productId: { $in: productIds }, transactionDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            productId: '$productId',
            day: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate', timezone: 'UTC' } }
          },
          quantity: { $sum: '$quantity' }
        }
      }
    ])
  ]);

  const stockByProduct = new Map(stockRows.map((row) => [row.productId, row]));
  const salesByProduct = new Map();
  for (const row of salesRows) {
    const id = row._id.productId;
    if (!salesByProduct.has(id)) salesByProduct.set(id, new Map());
    salesByProduct.get(id).set(row._id.day, Number(row.quantity));
  }

  const rows = products.map((product) => {
    const id = String(product._id);
    const stock = stockByProduct.get(id) || {};
    const dailyMap = salesByProduct.get(id) || new Map();
    const dailySeries = [];

    for (let day = 0; day < 28; day += 1) {
      const date = new Date(startDate);
      date.setUTCDate(date.getUTCDate() + day);
      dailySeries.push(dailyMap.get(date.toISOString().slice(0, 10)) || 0);
    }

    const totalUnits = dailySeries.reduce((sum, value) => sum + value, 0);
    const averageDailyDemand = totalUnits > 0 ? totalUnits / 28 : null;
    const variance = averageDailyDemand === null
      ? 0
      : dailySeries.reduce((sum, value) => sum + Math.pow(value - averageDailyDemand, 2), 0) / 28;
    const dailyStdDev = Math.sqrt(variance);

    const currentStock = Number(stock.currentStock || 0);
    const incomingStock = Number(stock.incomingStock || 0);
    const reservedStock = Number(stock.reservedStock || 0);
    const availableStock = Math.max(0, currentStock + incomingStock - reservedStock);
    const leadTime = Number(product.leadTimeDays ?? stock.leadTimeDays ?? 7);
    const safetyStock = averageDailyDemand === null
      ? null
      : Math.ceil(1.645 * dailyStdDev * Math.sqrt(Math.max(leadTime, 1)));
    const reorderPoint = averageDailyDemand === null
      ? null
      : Math.ceil(averageDailyDemand * leadTime + safetyStock);
    const rawOrderQty = reorderPoint === null ? 0 : Math.max(0, reorderPoint - availableStock);
    const minimumOrderQty = Math.max(1, Number(product.minimumOrderQty || 1));
    const recommendedQty = rawOrderQty > 0
      ? Math.ceil(rawOrderQty / minimumOrderQty) * minimumOrderQty
      : 0;
    const daysCoverage = averageDailyDemand && averageDailyDemand > 0
      ? Number((currentStock / averageDailyDemand).toFixed(1))
      : null;
    const stockoutRisk = riskForProduct(currentStock, averageDailyDemand, leadTime, daysCoverage ?? Infinity);
    const overstockRisk = averageDailyDemand === null
      ? 'Unknown'
      : daysCoverage >= 60
        ? 'High'
        : daysCoverage >= 45
          ? 'Medium'
          : 'Low';
    const overallRisk = stockoutRisk === 'High' || overstockRisk === 'High'
      ? 'High'
      : stockoutRisk === 'Medium' || overstockRisk === 'Medium'
        ? 'Medium'
        : averageDailyDemand === null
          ? 'Unknown'
          : 'Low';

    return {
      id,
      productId: id,
      sku: product.sku,
      name: product.name,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      sellingPrice: Number(product.sellingPrice || 0),
      costPrice: Number(product.costPrice || 0),
      supplier: product.supplierName || stock.supplier || '',
      currentStock,
      current_stock: currentStock,
      stock: currentStock,
      incomingStock,
      incoming_stock: incomingStock,
      reservedStock,
      reserved_stock: reservedStock,
      stockPosition: availableStock,
      averageDailyDemand,
      avg_daily_sales: averageDailyDemand,
      predictedDailyDemand: averageDailyDemand,
      predicted_daily_demand: averageDailyDemand,
      salesHistoryDays: 28,
      leadTime,
      lead_time_days: leadTime,
      safetyStock,
      safety_stock: safetyStock,
      reorderPoint,
      reorder_point: reorderPoint,
      recommendedQty,
      recommended_order_quantity: recommendedQty,
      daysCoverage,
      days_coverage: daysCoverage,
      stockoutRisk,
      stockout_risk: stockoutRisk,
      overstockRisk,
      overstock_risk: overstockRisk,
      overallRisk,
      overall_risk: overallRisk,
      risk: overallRisk,
      status: overallRisk === 'High' ? 'Critical' : overallRisk === 'Medium' ? 'Attention' : overallRisk === 'Unknown' ? 'No Sales History' : 'Healthy',
      forecast_status: averageDailyDemand === null ? 'insufficient_history' : 'baseline_from_actual_sales',
      forecast_source: averageDailyDemand === null ? null : '28_day_sales_baseline'
    };
  });

  const stats = {
    totalProducts: rows.length,
    critical: rows.filter((row) => row.overallRisk === 'High').length,
    attention: rows.filter((row) => row.overallRisk === 'Medium').length,
    healthy: rows.filter((row) => row.overallRisk === 'Low').length,
    unknown: rows.filter((row) => row.overallRisk === 'Unknown').length,
    recommendedUnits: rows.reduce((sum, row) => sum + row.recommendedQty, 0),
    inventoryValue: rows.reduce((sum, row) => sum + row.currentStock * row.costPrice, 0)
  };

  return { products: rows, inventory: rows, stats };
}

async function mlRequest(path) {
  const response = await fetch(ML_API + path, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('ML API returned ' + response.status);
  return response.json();
}

// Product master data
app.get('/api/products', asyncRoute(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.search) {
    const value = String(req.query.search).trim();
    filter.$or = [
      { name: { $regex: value, $options: 'i' } },
      { sku: { $regex: value, $options: 'i' } },
      { category: { $regex: value, $options: 'i' } }
    ];
  }
  const products = await Product.find(filter).sort({ name: 1 }).lean();
  const ids = products.map((item) => String(item._id));
  const stocks = await Inventory.find({ productId: { $in: ids } }).lean();
  const stockMap = new Map(stocks.map((item) => [item.productId, item.currentStock]));
  res.json({
    count: products.length,
    products: products.map((item) => ({
      ...item,
      id: String(item._id),
      currentStock: Number(stockMap.get(String(item._id)) || 0)
    }))
  });
}));

app.post('/api/products', asyncRoute(async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const category = String(body.category || '').trim();
  const unit = String(body.unit || '').trim();
  if (!name || !category || !unit) {
    return res.status(400).json({ error: 'Product name, category and unit are required.' });
  }

  const sku = String(body.sku || ('SP-' + Date.now().toString(36))).trim().toUpperCase();
  const openingStock = Number(body.openingStock ?? 0);
  const sellingPrice = Number(body.sellingPrice ?? 0);
  const costPrice = Number(body.costPrice ?? 0);
  const leadTimeDays = Number(body.leadTimeDays ?? 7);
  const minimumOrderQty = Number(body.minimumOrderQty ?? 1);

  if (!nonNegativeNumber(openingStock) || !nonNegativeNumber(sellingPrice) ||
      !nonNegativeNumber(costPrice) || !nonNegativeNumber(leadTimeDays) ||
      !positiveNumber(minimumOrderQty)) {
    return res.status(400).json({ error: 'Stock, prices and lead time must be non-negative; minimum order quantity must be positive.' });
  }

  const product = await Product.create({
    sku, name, category, unit,
    description: body.description || '',
    barcode: body.barcode || '',
    sellingPrice, costPrice,
    supplierName: body.supplierName || '',
    leadTimeDays, minimumOrderQty
  });

  await Inventory.create({
    productId: String(product._id),
    currentStock: openingStock,
    leadTimeDays,
    supplier: body.supplierName || '',
    minimumOrderQty,
    unitCost: costPrice
  });

  if (openingStock > 0) {
    await StockMovement.create({
      productId: String(product._id),
      movementType: 'opening',
      quantityChange: openingStock,
      balanceBefore: 0,
      balanceAfter: openingStock,
      unitCost: costPrice,
      note: 'Opening stock'
    });
  }

  res.status(201).json({ product: { ...product.toObject(), id: String(product._id) } });
}));

app.get('/api/inventory', asyncRoute(async (req, res) => {
  const snapshot = await createInventorySnapshot();
  let rows = snapshot.products;
  if (req.query.product) rows = rows.filter((row) => row.productId === String(req.query.product) || row.sku === String(req.query.product));
  res.json({
    products: rows,
    inventory: rows,
    stats: {
      ...snapshot.stats,
      totalProducts: rows.length
    },
    _source: 'mongodb'
  });
}));

// Set an audited stock adjustment. Prefer sales and purchase routes for normal operations.
app.put('/api/inventory/:productId', asyncRoute(async (req, res) => {
  const { productId } = req.params;
  const newStock = Number(req.body?.currentStock);
  if (!nonNegativeNumber(newStock)) {
    return res.status(400).json({ error: 'currentStock must be a non-negative number.' });
  }

  const product = await Product.findById(productId).lean();
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  let stock = await Inventory.findOne({ productId });
  if (!stock) stock = await Inventory.create({ productId, currentStock: 0 });
  const before = Number(stock.currentStock || 0);
  stock.currentStock = newStock;
  await stock.save();

  await StockMovement.create({
    productId,
    movementType: 'adjustment',
    quantityChange: newStock - before,
    balanceBefore: before,
    balanceAfter: newStock,
    note: String(req.body?.note || 'Manual stock adjustment').slice(0, 500)
  });

  res.json({ message: 'Stock adjustment saved.', currentStock: newStock });
}));

app.post('/api/sales', asyncRoute(async (req, res) => {
  const body = req.body || {};
  const productId = String(body.productId || '');
  const quantity = Number(body.quantity);
  if (!productId || !positiveNumber(quantity)) {
    return res.status(400).json({ error: 'productId and a positive quantity are required.' });
  }

  const product = await Product.findById(productId).lean();
  if (!product || !product.isActive) return res.status(404).json({ error: 'Active product not found.' });

  const unitPrice = body.unitPrice === undefined ? Number(product.sellingPrice || 0) : Number(body.unitPrice);
  if (!nonNegativeNumber(unitPrice)) return res.status(400).json({ error: 'unitPrice must be non-negative.' });

  const stock = await Inventory.findOne({ productId });
  if (!stock || Number(stock.currentStock) < quantity) {
    return res.status(409).json({ error: 'Insufficient stock. Record a purchase or stock adjustment first.', availableStock: Number(stock?.currentStock || 0) });
  }

  const before = Number(stock.currentStock);
  stock.currentStock = before - quantity;
  await stock.save();

  try {
    const transactionDate = body.transactionDate ? new Date(body.transactionDate) : new Date();
    if (Number.isNaN(transactionDate.getTime())) throw new Error('Invalid transactionDate.');

    const [sale] = await SalesTransaction.create([{
      productId,
      sku: product.sku,
      productName: product.name,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      channel: body.channel || 'counter',
      reference: body.reference || '',
      transactionDate
    }]);

    await StockMovement.create({
      productId,
      movementType: 'sale',
      quantityChange: -quantity,
      balanceBefore: before,
      balanceAfter: before - quantity,
      unitCost: Number(product.costPrice || 0),
      reference: sale._id.toString(),
      note: 'Sale recorded'
    });

    res.status(201).json({ sale, currentStock: before - quantity });
  } catch (error) {
    stock.currentStock = before;
    await stock.save();
    throw error;
  }
}));

app.post('/api/purchases/receive', asyncRoute(async (req, res) => {
  const body = req.body || {};
  const productId = String(body.productId || '');
  const quantity = Number(body.quantity);
  const unitCost = Number(body.unitCost ?? 0);
  if (!productId || !positiveNumber(quantity) || !nonNegativeNumber(unitCost)) {
    return res.status(400).json({ error: 'productId, positive quantity and non-negative unitCost are required.' });
  }

  const product = await Product.findById(productId).lean();
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  let stock = await Inventory.findOne({ productId });
  if (!stock) stock = await Inventory.create({ productId, currentStock: 0 });
  const before = Number(stock.currentStock || 0);
  stock.currentStock = before + quantity;
  stock.unitCost = unitCost;
  await stock.save();

  await StockMovement.create({
    productId,
    movementType: 'purchase',
    quantityChange: quantity,
    balanceBefore: before,
    balanceAfter: before + quantity,
    unitCost,
    reference: String(body.reference || ''),
    note: 'Purchase receipt'
  });

  res.status(201).json({ message: 'Purchase received.', currentStock: before + quantity });
}));

app.get('/api/stock-movements', asyncRoute(async (req, res) => {
  const filter = {};
  if (req.query.productId) filter.productId = String(req.query.productId);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const movements = await StockMovement.find(filter).sort({ occurredAt: -1 }).limit(limit).lean();
  res.json({ count: movements.length, movements });
}));

app.get('/api/sales', asyncRoute(async (req, res) => {
  const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  const rows = await SalesTransaction.aggregate([
    { $match: { transactionDate: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' } },
        units: { $sum: '$quantity' },
        revenue: { $sum: '$totalAmount' },
        transactions: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  const metric = req.query.metric === 'revenue' ? 'revenue' : 'units';
  res.json({
    range: req.query.range || 'daily',
    metric,
    data: rows.map((row) => ({ label: row._id, units: row.units, revenue: row.revenue, value: row[metric] }))
  });
}));

app.get('/api/sales/summary', asyncRoute(async (req, res) => {
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const rows = await SalesTransaction.aggregate([
    { $match: { transactionDate: { $gte: start } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalUnits: { $sum: '$quantity' },
        transactionCount: { $sum: 1 },
        activeDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' } } }
      }
    }
  ]);
  const summary = rows[0] || { totalRevenue: 0, totalUnits: 0, transactionCount: 0, activeDays: [] };
  res.json({
    totalRevenue: Number(summary.totalRevenue || 0),
    totalUnits: Number(summary.totalUnits || 0),
    transactionCount: Number(summary.transactionCount || 0),
    averageDailyUnits: Number((Number(summary.totalUnits || 0) / 30).toFixed(2)),
    periodDays: 30
  });
}));

app.get('/api/top-products', asyncRoute(async (req, res) => {
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const rows = await SalesTransaction.aggregate([
    { $match: { transactionDate: { $gte: start } } },
    {
      $group: {
        _id: '$productId',
        name: { $first: '$productName' },
        sku: { $first: '$sku' },
        units: { $sum: '$quantity' },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { units: -1 } },
    { $limit: 10 }
  ]);
  res.json({
    count: rows.length,
    products: rows.map((row) => ({
      id: row._id,
      productId: row._id,
      name: row.name,
      sku: row.sku,
      units: Number(row.units || 0),
      revenue: Number(row.revenue || 0)
    }))
  });
}));

app.get('/api/dashboard', asyncRoute(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [snapshot, sales, salesTodayRows] = await Promise.all([
    createInventorySnapshot(),
    SalesTransaction.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalUnits: { $sum: '$quantity' }, transactionCount: { $sum: 1 } } }
    ]),
    SalesTransaction.aggregate([
      { $match: { transactionDate: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalUnits: { $sum: '$quantity' },
          transactionCount: { $sum: 1 }
        }
      }
    ])
  ]);
  const salesSummary = sales[0] || { totalRevenue: 0, totalUnits: 0, transactionCount: 0 };
  const salesToday = salesTodayRows[0] || { totalRevenue: 0, totalUnits: 0, transactionCount: 0 };
  res.json({
    products: snapshot.products,
    inventory: snapshot.stats,
    totalProducts: snapshot.stats.totalProducts,
    totalStock: snapshot.products.reduce((sum, item) => sum + item.currentStock, 0),
    inventoryValue: snapshot.stats.inventoryValue,
    lowStock: snapshot.stats.critical + snapshot.stats.attention,
    risk: {
      overall: {
        High: snapshot.stats.critical,
        Medium: snapshot.stats.attention,
        Low: snapshot.stats.healthy,
        Unknown: snapshot.stats.unknown
      }
    },
    sales: salesSummary,
    salesToday,
    recommendations: snapshot.products.filter((item) => item.recommendedQty > 0)
  });
}));

app.get('/api/forecast', asyncRoute(async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
    const product = req.query.product ? '?product=' + encodeURIComponent(req.query.product) + '&days=' + days : '?days=' + days;
    const data = await mlRequest('/api/forecast' + product);
    return res.json(data);
  } catch (error) {
    res.status(503).json({
      error: 'The forecasting service is not available yet. Inventory and transaction features remain operational.',
      detail: error.message
    });
  }
}));

app.get('/api/recommendations', asyncRoute(async (req, res) => {
  const snapshot = await createInventorySnapshot();
  const recommendations = snapshot.products
    .filter((item) => item.recommendedQty > 0)
    .sort((a, b) => {
      const rank = { High: 0, Medium: 1, Low: 2, Unknown: 3 };
      return (rank[a.overallRisk] ?? 4) - (rank[b.overallRisk] ?? 4) || b.recommendedQty - a.recommendedQty;
    });
  res.json({ count: recommendations.length, recommendations });
}));

app.get('/api/risk', asyncRoute(async (req, res) => {
  const snapshot = await createInventorySnapshot();
  res.json({
    overall: {
      High: snapshot.stats.critical,
      Medium: snapshot.stats.attention,
      Low: snapshot.stats.healthy,
      Unknown: snapshot.stats.unknown
    },
    stockout: {
      High: snapshot.products.filter((item) => item.stockoutRisk === 'High').length,
      Medium: snapshot.products.filter((item) => item.stockoutRisk === 'Medium').length,
      Low: snapshot.products.filter((item) => item.stockoutRisk === 'Low').length,
      Unknown: snapshot.products.filter((item) => item.stockoutRisk === 'Unknown').length
    },
    overstock: {
      High: snapshot.products.filter((item) => item.overstockRisk === 'High').length,
      Medium: snapshot.products.filter((item) => item.overstockRisk === 'Medium').length,
      Low: snapshot.products.filter((item) => item.overstockRisk === 'Low').length,
      Unknown: snapshot.products.filter((item) => item.overstockRisk === 'Unknown').length
    }
  });
}));

app.get('/api/health', asyncRoute(async (req, res) => {
  let mlStatus = 'unavailable';
  try {
    await mlRequest('/health');
    mlStatus = 'available';
  } catch {
    // Core product, sales and stock features work independently from ML.
  }
  res.json({
    status: 'ok',
    api: 'available',
    database: (await import('mongoose')).default.connection.readyState === 1 ? 'connected' : 'disconnected',
    forecastingService: mlStatus
  });
}));

app.use((error, req, res, next) => {
  console.error(error);
  if (error?.code === 11000) return res.status(409).json({ error: 'A product with this SKU already exists.' });
  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    return res.status(400).json({ error: error.message });
  }
  res.status(500).json({ error: 'Internal server error.' });
});

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log('StockPilot API listening on port ' + PORT));
  })
  .catch((error) => {
    console.error('StockPilot startup failed:', error.message);
    process.exit(1);
  });
