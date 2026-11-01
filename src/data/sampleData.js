// Centralized sample data for StockPilot.
// Clearly marked as demo data — real values will come from the Python ML service
// and MongoDB via the Express backend once connected.

export const STORE = {
  name: 'Kumar General Store',
  owner: 'Rajesh Kumar',
  role: 'Store Owner',
  phone: '+91 98765 43210',
  email: 'rajesh@kumargeneral.in',
  address: '12 MG Road, Jayanagar, Bengaluru, KA 560011',
};

export const CATEGORIES = ['Grains', 'Cooking', 'Dairy', 'Snacks', 'Beverages', 'Personal Care', 'Cleaning'];

// ---- Products ---------------------------------------------------------------
// avgDailySales, leadTimeDays, safetyStock, reorderPoint are inventory-management
// inputs, NOT ML outputs. Predicted demand / forecast arrays are sample data only.

export const PRODUCTS = [
  {
    id: 'P001', name: 'Rice 5kg', sku: 'RIC-5KG', category: 'Grains',
    price: 320, unit: 'pack',
    stock: 18, reorderPoint: 40, safetyStock: 20, leadTimeDays: 4,
    avgDailySales: 8, supplier: 'India Foods Pvt Ltd',
    salesHistory: [6, 7, 8, 9, 7, 8, 10, 9, 8, 7, 9, 10, 8, 9],
  },
  {
    id: 'P002', name: 'Cooking Oil 1L', sku: 'OIL-1L', category: 'Cooking',
    price: 145, unit: 'bottle',
    stock: 30, reorderPoint: 35, safetyStock: 15, leadTimeDays: 3,
    avgDailySales: 6, supplier: 'GoldDrop Oils',
    salesHistory: [5, 6, 7, 6, 5, 7, 6, 8, 7, 6, 5, 7, 6, 7],
  },
  {
    id: 'P003', name: 'Milk 1L', sku: 'MLK-1L', category: 'Dairy',
    price: 58, unit: 'packet',
    stock: 24, reorderPoint: 35, safetyStock: 12, leadTimeDays: 1,
    avgDailySales: 12, supplier: 'Heritage Dairy',
    salesHistory: [10, 12, 11, 13, 12, 14, 11, 12, 13, 12, 11, 13, 14, 12],
  },
  {
    id: 'P004', name: 'Biscuits', sku: 'BIS-200', category: 'Snacks',
    price: 35, unit: 'pack',
    stock: 120, reorderPoint: 60, safetyStock: 25, leadTimeDays: 5,
    avgDailySales: 5, supplier: 'Britannia Snacks',
    salesHistory: [4, 5, 6, 5, 4, 6, 5, 5, 4, 6, 5, 4, 5, 6],
  },
  {
    id: 'P005', name: 'Sugar 1kg', sku: 'SUG-1KG', category: 'Grains',
    price: 48, unit: 'pack',
    stock: 65, reorderPoint: 30, safetyStock: 15, leadTimeDays: 3,
    avgDailySales: 4, supplier: 'Madhur Sugar',
    salesHistory: [3, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5, 4, 3, 4],
  },
  {
    id: 'P006', name: 'Wheat Flour 5kg', sku: 'WHT-5KG', category: 'Grains',
    price: 240, unit: 'pack',
    stock: 42, reorderPoint: 25, safetyStock: 12, leadTimeDays: 4,
    avgDailySales: 5, supplier: 'Aashirvaad Mills',
    salesHistory: [4, 5, 6, 5, 4, 5, 6, 5, 4, 5, 6, 5, 4, 5],
  },
  {
    id: 'P007', name: 'Tea Powder 500g', sku: 'TEA-500', category: 'Beverages',
    price: 180, unit: 'pack',
    stock: 28, reorderPoint: 20, safetyStock: 10, leadTimeDays: 5,
    avgDailySales: 3, supplier: 'Tata Tea',
    salesHistory: [2, 3, 4, 3, 2, 3, 4, 3, 2, 3, 4, 3, 2, 3],
  },
  {
    id: 'P008', name: 'Coffee 200g', sku: 'COF-200', category: 'Beverages',
    price: 220, unit: 'jar',
    stock: 15, reorderPoint: 18, safetyStock: 8, leadTimeDays: 6,
    avgDailySales: 2, supplier: 'Nescafe',
    salesHistory: [1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2],
  },
  {
    id: 'P009', name: 'Soap', sku: 'SOP-100', category: 'Personal Care',
    price: 42, unit: 'bar',
    stock: 85, reorderPoint: 40, safetyStock: 20, leadTimeDays: 3,
    avgDailySales: 6, supplier: 'Lux Personal',
    salesHistory: [5, 6, 7, 6, 5, 6, 7, 6, 5, 6, 7, 6, 5, 6],
  },
  {
    id: 'P010', name: 'Detergent 1kg', sku: 'DET-1KG', category: 'Cleaning',
    price: 135, unit: 'pack',
    stock: 38, reorderPoint: 25, safetyStock: 12, leadTimeDays: 4,
    avgDailySales: 4, supplier: 'Surf Excel',
    salesHistory: [3, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5, 4, 3, 4],
  },
  {
    id: 'P011', name: 'Shampoo 340ml', sku: 'SHP-340', category: 'Personal Care',
    price: 195, unit: 'bottle',
    stock: 22, reorderPoint: 15, safetyStock: 8, leadTimeDays: 5,
    avgDailySales: 2, supplier: 'Head & Shoulders',
    salesHistory: [1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2],
  },
  {
    id: 'P012', name: 'Toothpaste 150g', sku: 'TTH-150', category: 'Personal Care',
    price: 68, unit: 'tube',
    stock: 54, reorderPoint: 30, safetyStock: 15, leadTimeDays: 3,
    avgDailySales: 4, supplier: 'Colgate',
    salesHistory: [3, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5, 4, 3, 4],
  },
];

// ---- Derived inventory helpers ----------------------------------------------

export function daysRemaining(stock, avgDailySales) {
  if (!avgDailySales || avgDailySales <= 0) return Infinity;
  return Math.floor(stock / avgDailySales);
}

export function stockStatus(product) {
  if (product.stock === 0) return 'out';
  if (product.stock <= product.reorderPoint * 0.5) return 'critical';
  if (product.stock <= product.reorderPoint) return 'low';
  if (product.stock > product.reorderPoint * 2.2) return 'overstock';
  return 'healthy';
}

// Sample predicted 7-day demand per product (NOT ML output — demo data)
export const PREDICTED_DEMAND_7D = {
  P001: 65, P002: 45, P003: 84, P004: 38, P005: 30,
  P006: 37, P007: 22, P008: 15, P009: 44, P010: 30,
  P011: 16, P012: 30,
};

export function predictedDemand(productId, days = 7) {
  const base = PREDICTED_DEMAND_7D[productId] || 0;
  return Math.round((base / 7) * days);
}

// ---- Risk classification ----------------------------------------------------

export function riskLevel(product) {
  const demand = predictedDemand(product.id, 7);
  const coverage = product.stock / Math.max(demand, 1);
  if (coverage < 0.4) return { level: 'high', score: 85, reason: 'Current stock below reorder point' };
  if (coverage < 0.7) return { level: 'high', score: 72, reason: 'Demand increasing with low inventory' };
  if (coverage < 1.0) return { level: 'medium', score: 55, reason: 'Low inventory for expected demand' };
  if (coverage > 2.8) return { level: 'low', score: 18, reason: 'Excess inventory vs expected demand' };
  return { level: 'low', score: 25, reason: 'Sufficient stock for expected demand' };
}

// ---- Reorder recommendation ------------------------------------------------

export function reorderQuantity(product) {
  const demand = predictedDemand(product.id, 7);
  const needed = demand + product.safetyStock - product.stock;
  return Math.max(0, Math.ceil(needed));
}

export function allRecommendations() {
  return PRODUCTS.map((p) => {
    const risk = riskLevel(p);
    const qty = reorderQuantity(p);
    return {
      productId: p.id,
      productName: p.name,
      category: p.category,
      currentStock: p.stock,
      predictedDemand: predictedDemand(p.id, 7),
      safetyStock: p.safetyStock,
      reorderPoint: p.reorderPoint,
      risk: risk.level,
      reason: risk.reason,
      recommendedQty: qty,
      action: qty === 0 ? 'none' : risk.level === 'high' ? 'order' : 'review',
    };
  }).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.risk] - order[b.risk];
  });
}

// ---- Dashboard aggregates ---------------------------------------------------

export function dashboardStats() {
  const totalProducts = PRODUCTS.length;
  const recommendations = allRecommendations();
  const critical = recommendations.filter((r) => r.risk === 'high' && r.currentStock <= r.reorderPoint).length;
  const reorderCount = recommendations.filter((r) => r.action === 'order' || r.action === 'review').length;
  const overstock = PRODUCTS.filter((p) => stockStatus(p) === 'overstock').length;
  const lowStock = PRODUCTS.filter((p) => ['low', 'critical'].includes(stockStatus(p))).length;
  const outOfStock = PRODUCTS.filter((p) => p.stock === 0).length;
  const inStock = totalProducts - outOfStock;
  const totalPredicted7d = Object.values(PREDICTED_DEMAND_7D).reduce((a, b) => a + b, 0);

  // Inventory health distribution
  const health = { healthy: 0, low: 0, overstock: 0, critical: 0, out: 0 };
  PRODUCTS.forEach((p) => {
    const s = stockStatus(p);
    health[s] = (health[s] || 0) + 1;
  });

  return {
    totalProducts,
    todaysSales: 24580,
    todaysSalesChange: 12.4,
    lowStock,
    criticalCount: critical,
    reorderCount,
    overstockCount: overstock,
    predictedDemand7d: totalPredicted7d,
    inStock,
    outOfStock,
    health,
  };
}

// ---- Sales trend data (demo) ------------------------------------------------

export function salesTrendData(range = 'daily', metric = 'revenue') {
  // 30 data points
  const labels = [];
  const today = new Date('2026-10-24');
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    labels.push(d);
  }

  if (range === 'daily') {
    return labels.map((d, i) => {
      const base = 21000 + Math.sin(i / 3) * 1800 + (i / 29) * 2200;
      const noise = ((i * 37) % 7) * 280;
      const revenue = Math.round(base + noise);
      const units = Math.round(revenue / 85);
      return {
        label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue,
        units,
      };
    });
  }
  if (range === 'weekly') {
    const weeks = [];
    for (let w = 0; w < 12; w++) {
      const base = 140000 + w * 4200 + Math.sin(w) * 6000;
      const revenue = Math.round(base);
      const units = Math.round(revenue / 85);
      weeks.push({
        label: `W${w + 1}`,
        revenue,
        units,
      });
    }
    return weeks;
  }
  // monthly
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  return months.map((m, i) => {
    const base = 580000 + i * 18000 + Math.sin(i) * 22000;
    const revenue = Math.round(base);
    return { label: m, revenue, units: Math.round(revenue / 85) };
  });
}

// ---- Forecast chart data (demo — NOT ML output) -----------------------------

export function forecastChartData(productName, days = 7) {
  const product = PRODUCTS.find((p) => p.name === productName) || null;
  const hist = product ? product.salesHistory : PRODUCTS.flatMap((p) => p.salesHistory);
  const avg = product ? product.avgDailySales : Math.round(hist.reduce((a, b) => a + b, 0) / hist.length);

  const points = [];
  const today = new Date('2026-10-24');
  const histLen = Math.min(days, 14);

  for (let i = histLen; i > 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const val = product ? hist[hist.length - i] || avg : Math.round(avg + ((i * 11) % 5) - 2);
    points.push({
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      historical: val,
      forecast: null,
    });
  }

  // Forecast points (demo data — will be replaced by Python ML service output)
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const trend = avg + Math.round(i * 0.3);
    const lower = Math.max(0, trend - Math.round(trend * 0.18));
    const upper = trend + Math.round(trend * 0.18);
    points.push({
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      historical: null,
      forecast: trend,
      forecastLower: lower,
      forecastUpper: upper,
    });
  }
  return points;
}

// ---- Top selling products ---------------------------------------------------

export function topSellingProducts(limit = 5) {
  return PRODUCTS.map((p) => {
    const units = p.salesHistory.reduce((a, b) => a + b, 0);
    const revenue = units * p.price;
    const recent = p.salesHistory.slice(-4).reduce((a, b) => a + b, 0);
    const earlier = p.salesHistory.slice(-8, -4).reduce((a, b) => a + b, 0);
    const trendPct = earlier > 0 ? Math.round(((recent - earlier) / earlier) * 100) : 0;
    return { ...p, units, revenue, trendPct };
  })
    .sort((a, b) => b.units - a.units)
    .slice(0, limit);
}

// ---- Category performance ---------------------------------------------------

export function categoryPerformance() {
  const map = {};
  PRODUCTS.forEach((p) => {
    const units = p.salesHistory.reduce((a, b) => a + b, 0);
    const revenue = units * p.price;
    if (!map[p.category]) map[p.category] = { category: p.category, units: 0, revenue: 0, products: 0 };
    map[p.category].units += units;
    map[p.category].revenue += revenue;
    map[p.category].products += 1;
  });
  return Object.values(map).sort((a, b) => b.revenue - a.revenue);
}

// ---- Notifications ----------------------------------------------------------

export const NOTIFICATIONS = [
  { id: 1, type: 'danger', title: 'Rice 5kg stock below reorder point', time: '2h ago', icon: 'alert' },
  { id: 2, type: 'warning', title: 'Milk demand increasing', time: '5h ago', icon: 'trending-up' },
  { id: 3, type: 'success', title: 'Biscuit inventory healthy', time: '8h ago', icon: 'check' },
  { id: 4, type: 'danger', title: 'Cooking Oil approaching reorder point', time: '1d ago', icon: 'alert' },
];

// ---- Sales & Demand page aggregates ----------------------------------------

export function salesDemandStats() {
  const daily = salesTrendData('daily');
  const totalSales = daily.reduce((a, d) => a + d.revenue, 0);
  const totalUnits = daily.reduce((a, d) => a + d.units, 0);
  const avgDailyDemand = Math.round(totalUnits / daily.length);
  const lastWeek = daily.slice(-7).reduce((a, d) => a + d.revenue, 0);
  const prevWeek = daily.slice(-14, -7).reduce((a, d) => a + d.revenue, 0);
  const salesGrowth = prevWeek > 0 ? (((lastWeek - prevWeek) / prevWeek) * 100).toFixed(1) : 0;
  return { totalSales, totalUnits, avgDailyDemand, salesGrowth: Number(salesGrowth) };
}

// ---- Reports ----------------------------------------------------------------

export const REPORTS = [
  {
    id: 'daily-sales',
    title: 'Daily Sales Report',
    description: 'Day-by-day revenue and units sold across all products.',
    date: 'Oct 24, 2026',
    type: 'Sales',
  },
  {
    id: 'demand-forecast',
    title: 'Demand Forecast Report',
    description: 'Predicted demand per product for the next 7, 30, or 90 days.',
    date: 'Oct 24, 2026',
    type: 'Forecast',
  },
  {
    id: 'inventory-health',
    title: 'Inventory Health Report',
    description: 'Current stock levels, status breakdown, and health distribution.',
    date: 'Oct 24, 2026',
    type: 'Inventory',
  },
  {
    id: 'reorder-recommendation',
    title: 'Reorder Recommendation Report',
    description: 'Products recommended for replenishment with suggested quantities.',
    date: 'Oct 24, 2026',
    type: 'Reorder',
  },
  {
    id: 'risk-analysis',
    title: 'Risk Analysis Report',
    description: 'Stockout and overstock risk classification across all products.',
    date: 'Oct 24, 2026',
    type: 'Risk',
  },
];

export function reportPreview(reportId) {
  const recs = allRecommendations();
  switch (reportId) {
    case 'daily-sales':
      return salesTrendData('daily').map((d) => ({
        Date: d.label, 'Revenue (₹)': d.revenue, 'Units Sold': d.units,
      }));
    case 'demand-forecast':
      return PRODUCTS.map((p) => ({
        Product: p.name, 'Current Stock': p.stock, 'Predicted 7d Demand': predictedDemand(p.id, 7),
      }));
    case 'inventory-health':
      return PRODUCTS.map((p) => ({
        Product: p.name, SKU: p.sku, 'Current Stock': p.stock, 'Reorder Point': p.reorderPoint,
        Status: stockStatus(p),
      }));
    case 'reorder-recommendation':
      return recs.map((r) => ({
        Product: r.productName, 'Current Stock': r.currentStock,
        'Predicted Demand': r.predictedDemand, Risk: r.risk, 'Recommended Qty': r.recommendedQty,
      }));
    case 'risk-analysis':
      return PRODUCTS.map((p) => {
        const risk = riskLevel(p);
        return {
          Product: p.name, 'Current Stock': p.stock, Risk: risk.level, Reason: risk.reason,
        };
      });
    default:
      return [];
  }
}
