import { PRODUCT_CATALOG } from '../data/productCatalog.js';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = payload && typeof payload === 'object'
      ? payload.error || payload.message
      : payload;
    throw new Error(message || `Request failed (${response.status})`);
  }

  return payload;
}

const query = (params) => {
  const values = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      values.set(key, String(value));
    }
  });
  const suffix = values.toString();
  return suffix ? `?${suffix}` : '';
};

function normalizeProduct(row = {}) {
  const stock = Number(row.currentStock ?? row.current_stock ?? row.stock ?? 0);
  const demandValue = row.predictedDailyDemand ?? row.predicted_daily_demand ?? row.averageDailyDemand ?? row.average_daily_demand;
  const demand = demandValue === null || demandValue === undefined ? null : Number(demandValue);
  const safetyValue = row.safetyStock ?? row.safety_stock;
  const reorderValue = row.reorderPoint ?? row.reorder_point;
  const recommendedValue = row.recommendedQty ?? row.recommended_order_quantity;

  return {
    ...row,
    id: String(row.id ?? row.productId ?? row._id ?? ''),
    productId: String(row.productId ?? row.id ?? row._id ?? ''),
    name: row.name ?? row.productName ?? row.product_name ?? 'Unnamed product',
    productName: row.productName ?? row.name ?? row.product_name ?? 'Unnamed product',
    category: row.category ?? 'Other',
    unit: row.unit ?? 'units',
    currentStock: stock,
    current_stock: stock,
    stock,
    incomingStock: Number(row.incomingStock ?? row.incoming_stock ?? 0),
    reservedStock: Number(row.reservedStock ?? row.reserved_stock ?? 0),
    predictedDailyDemand: Number.isFinite(demand) ? demand : null,
    predictedDemand: Number.isFinite(demand) ? demand : null,
    avgDailySales: Number.isFinite(demand) ? demand : null,
    safetyStock: safetyValue == null ? null : Number(safetyValue),
    reorderPoint: reorderValue == null ? null : Number(reorderValue),
    recommendedQty: Number(recommendedValue ?? 0),
    daysCoverage: row.daysCoverage == null && row.days_coverage == null
      ? null
      : Number(row.daysCoverage ?? row.days_coverage),
    risk: row.risk ?? row.overallRisk ?? row.overall_risk ?? 'Unknown',
    status: row.status ?? 'Unknown',
    leadTime: Number(row.leadTime ?? row.lead_time_days ?? 7)
  };
}

function normalizeInventory(payload = {}) {
  const rows = Array.isArray(payload.products)
    ? payload.products
    : Array.isArray(payload.inventory)
      ? payload.inventory
      : [];
  const products = rows.map(normalizeProduct);

  const stats = payload.stats || {
    totalProducts: products.length,
    critical: products.filter((item) => item.risk === 'High').length,
    attention: products.filter((item) => item.risk === 'Medium').length,
    healthy: products.filter((item) => item.risk === 'Low').length,
    unknown: products.filter((item) => item.risk === 'Unknown').length,
    recommendedUnits: products.reduce((sum, item) => sum + item.recommendedQty, 0),
    inventoryValue: products.reduce((sum, item) => sum + item.currentStock * Number(item.costPrice || 0), 0)
  };

  return { ...payload, products, stats, _source: payload._source || 'api' };
}

export async function getInventory() {
  return normalizeInventory(await request('/api/inventory'));
}

export async function getProduct(productId) {
  const inventory = await getInventory();
  return inventory.products.find((item) => item.id === String(productId)) || null;
}

export async function createProduct(product) {
  return request('/api/products', {
    method: 'POST',
    body: JSON.stringify(product)
  });
}

export async function updateInventory(productId, newStock, note = 'Manual stock adjustment') {
  return request(`/api/inventory/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    body: JSON.stringify({ currentStock: Number(newStock), note })
  });
}

export async function recordSale({ productId, quantity, unitPrice, channel = 'counter', reference = '' }) {
  return request('/api/sales', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity: Number(quantity), unitPrice, channel, reference })
  });
}

export async function receivePurchase({ productId, quantity, unitCost = 0, reference = '' }) {
  return request('/api/purchases/receive', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity: Number(quantity), unitCost: Number(unitCost), reference })
  });
}

export async function getStockMovements({ productId, limit = 50 } = {}) {
  return request('/api/stock-movements' + query({ productId, limit }));
}

export async function getDashboard() {
  const payload = await request('/api/dashboard');
  return {
    ...payload,
    products: (payload.products || []).map(normalizeProduct),
    inventory: payload.inventory || {},
    totalProducts: Number(payload.totalProducts || 0),
    totalStock: Number(payload.totalStock || 0),
    inventoryValue: Number(payload.inventoryValue || 0),
    critical: Number(payload.inventory?.critical || 0),
    attention: Number(payload.inventory?.attention || 0),
    healthy: Number(payload.inventory?.healthy || 0),
    _source: 'api'
  };
}

export async function getTopProducts() {
  const payload = await request('/api/top-products');
  return { ...payload, data: payload.products || payload.data || [], products: payload.products || payload.data || [] };
}

export async function getRecommendations() {
  const payload = await request('/api/recommendations');
  const recommendations = (payload.recommendations || []).map(normalizeProduct);
  return { ...payload, recommendations, data: recommendations, _source: 'api' };
}

export async function getRiskAnalysis() {
  const [inventory, risk] = await Promise.all([
    getInventory(),
    request('/api/risk')
  ]);
  return {
    products: inventory.products,
    summary: {
      critical: inventory.stats.critical || 0,
      attention: inventory.stats.attention || 0,
      healthy: inventory.stats.healthy || 0,
      unknown: inventory.stats.unknown || 0,
      recommendedUnits: inventory.stats.recommendedUnits || 0,
      inventoryValue: inventory.stats.inventoryValue || 0
    },
    risk,
    _source: 'api'
  };
}

export async function getForecast(productId = 'All Products', options = 30) {
  const days = typeof options === 'number' ? options : Number(options?.days || 30);
  const payload = await request('/api/forecast' + query({
    product: productId && productId !== 'All Products' ? productId : undefined,
    days: Math.min(90, Math.max(1, days))
  }));
  return { ...payload, forecasts: payload.forecasts || [], data: payload.forecasts || [], _source: 'ml-api' };
}

export async function runWhatIf({
  productId,
  demandChange = 0,
  demandChangePct,
  leadTime,
  safetyStock,
  reserveStock
} = {}) {
  const product = await getProduct(productId);
  if (!product) throw new Error('Product not found');

  const baseDemand = Number(product.predictedDailyDemand || 0);
  if (!(baseDemand > 0)) {
    throw new Error('This product has no recorded sales history yet. Record sales before running a demand scenario.');
  }

  const change = Number(demandChangePct ?? demandChange);
  const lead = Math.max(0, Number(leadTime ?? product.leadTime ?? 7));
  const reserve = Math.max(0, Number(reserveStock ?? safetyStock ?? product.safetyStock ?? 0));
  const projectedDemand = baseDemand * (1 + change / 100);
  const requiredStock = Math.ceil(projectedDemand * lead + reserve);
  const currentStock = Number(product.currentStock || 0);
  const daysUntilStockout = projectedDemand > 0 ? currentStock / projectedDemand : null;

  return {
    productId: product.id,
    productName: product.name,
    currentStock,
    currentDemand: baseDemand,
    projectedDemand: Number(projectedDemand.toFixed(2)),
    demandChange: change,
    leadTime: lead,
    safetyStock: reserve,
    requiredStock,
    projectedReorderPoint: requiredStock,
    recommendedOrderQuantity: Math.max(0, requiredStock - currentStock),
    orderQuantity: Math.max(0, requiredStock - currentStock),
    daysUntilStockout,
    stockDuration: daysUntilStockout,
    risk: daysUntilStockout !== null && daysUntilStockout <= lead ? 'High' : daysUntilStockout !== null && daysUntilStockout <= lead + 3 ? 'Medium' : 'Low',
    _source: 'calculated-from-live-inventory'
  };
}

export async function importHistoricalSales(rows) {
  return request('/api/sales/import', { method: 'POST', body: JSON.stringify({ rows }) });
}

export async function getSales(range = 'daily', metric = 'revenue') {
  const days = range === 'weekly' || range === 'week' ? 7
    : range === 'monthly' || range === 'month' ? 30
      : range === 'quarterly' || range === 'quarter' ? 90 : 30;
  return request('/api/sales' + query({ range, metric, days }));
}

export async function getSalesDemandStats() {
  const payload = await request('/api/sales/summary');
  return {
    totalSales: Number(payload.totalRevenue || 0),
    unitsSold: Number(payload.totalUnits || 0),
    averageDailyDemand: Number(payload.averageDailyUnits || 0),
    salesGrowth: Number(payload.salesGrowth || 0),
    transactionCount: Number(payload.transactionCount || 0),
    _source: 'api'
  };
}

export async function getSalesDemandData() {
  const [stats, sales, top] = await Promise.all([
    getSalesDemandStats(),
    getSales('monthly', 'revenue'),
    getTopProducts()
  ]);
  return {
    summary: stats,
    salesPerformance: sales.data || [],
    topProducts: top.products || [],
    attentionProducts: [],
    categoryDemand: [],
    upcomingDemand: [],
    seasonalInsights: [],
    _source: 'api'
  };
}

export async function getSalesStats() {
  const stats = await getSalesDemandStats();
  return {
    totalRevenue: stats.totalSales,
    totalUnits: stats.unitsSold,
    averageOrderValue: stats.unitsSold > 0 ? stats.totalSales / stats.unitsSold : 0,
    averageDailyDemand: stats.averageDailyDemand,
    _source: 'api'
  };
}

export async function getDashboardSummary() {
  return getDashboard();
}

export async function getAssistantResponse(message = '') {
  const [inventory, recommendations] = await Promise.all([getInventory(), getRecommendations()]);
  const critical = inventory.products.filter((item) => item.risk === 'High');
  const text = String(message).toLowerCase();
  let response;
  if (text.includes('reorder') || text.includes('buy') || text.includes('purchase')) {
    response = recommendations.recommendations.length
      ? `There are ${recommendations.recommendations.length} products below their calculated reorder point. Review supplier lead time and the recommended quantities before placing a purchase order.`
      : 'No products are currently below their calculated reorder point.';
  } else if (text.includes('risk') || text.includes('stockout')) {
    response = `${critical.length} products currently have high stockout or overstock risk based on recorded sales and available stock.`;
  } else {
    response = `Your inventory contains ${inventory.products.length} active products. ${inventory.stats.critical || 0} are high risk, ${inventory.stats.attention || 0} need attention, and ${inventory.stats.healthy || 0} are healthy. Forecasts require sufficient recorded sales history.`;
  }
  return { response, products: critical, _source: 'live-inventory-rules' };
}

export async function getReports() {
  const [dashboard, sales, recommendations] = await Promise.all([
    getDashboard(),
    getSalesDemandStats(),
    getRecommendations()
  ]);
  return {
    dashboard,
    sales,
    recommendations: recommendations.recommendations,
    generatedAt: new Date().toISOString(),
    _source: 'api'
  };
}

export function resetInventoryCache() {
  // API-backed data is fetched fresh; there is no browser-side inventory cache.
}

export { PRODUCT_CATALOG };
