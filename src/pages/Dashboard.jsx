import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Package,
  ShoppingCart,
  TrendingUp,
  CalendarDays,
  BarChart3,
  ArrowRight
} from 'lucide-react';

import {
  getDashboard,
  getTopProducts,
  getRecommendations,
  getSales
} from '../services/api.js';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import '../styles/dashboard.css';


/* =========================================================
   HELPERS
   ========================================================= */

function normalizeProduct(product) {
  const riskValue = String(
    product?.risk ??
      product?.overallRisk ??
      product?.stockoutRisk ??
      ''
  ).toLowerCase();

  let risk = 'Unknown';

  if (riskValue === 'high' || riskValue === 'critical') {
    risk = 'High';
  } else if (
    riskValue === 'medium' ||
    riskValue === 'attention' ||
    riskValue === 'warning'
  ) {
    risk = 'Medium';
  } else if (riskValue === 'low' || riskValue === 'healthy') {
    risk = 'Low';
  }

  return {
    ...product,
    id: product?.id ?? product?.product_id ?? product?.productId,
    name: product?.name ?? product?.product_name ?? 'Unknown Product',
    category: product?.category ?? product?.category_name ?? 'Other',
    stock: Number(
      product?.current_stock ??
        product?.currentStock ??
        product?.stock ??
        0
    ),
    predictedDemand: Number(
      product?.predicted_daily_demand ??
        product?.predictedDemand ??
        product?.dailyDemand ??
        product?.demand ??
        0
    ),
    reorderPoint: Number(
      product?.reorder_point ??
        product?.reorderPoint ??
        0
    ),
    safetyStock: Number(
      product?.safety_stock ??
        product?.safetyStock ??
        0
    ),
    recommendedQty: Number(
      product?.recommended_order_quantity ??
        product?.recommendedQty ??
        product?.orderQuantity ??
        0
    ),
    risk,
  };
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function CustomChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const fullDate = payload[0]?.payload?.fullDate || label;
  return (
    <div className="dark-chart-tooltip">
      <div className="dark-chart-tooltip-title">{fullDate}</div>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className={`dark-chart-tooltip-row ${entry.dataKey === 'units' ? 'cyan' : 'blue'}`}
        >
          <span>{entry.name}:</span>
          <strong>{formatNumber(entry.value)} units</strong>
        </div>
      ))}
    </div>
  );
}


/* =========================================================
   MAIN DASHBOARD COMPONENT
   ========================================================= */

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);

  /* =======================================================
     DATA FETCHING
     ======================================================= */

  useEffect(() => {
    let active = true;

    async function loadAllData() {
      try {
        const [dashRes, topRes, recRes, salesRes] = await Promise.all([
          getDashboard().catch(() => null),
          getTopProducts().catch(() => null),
          getRecommendations().catch(() => null),
          getSales('daily', 'units').catch(() => null)
        ]);

        if (!active) return;

        if (dashRes) {
          const normalized = Array.isArray(dashRes?.products)
            ? dashRes.products.map(normalizeProduct)
            : [];
          setDashboardData(dashRes);
          setProducts(normalized);
        }

        if (topRes) {
          const topList = topRes?.products ?? topRes?.data ?? [];
          setTopProducts(Array.isArray(topList) ? topList : []);
        }

        if (recRes) {
          const recList = recRes?.recommendations ?? recRes?.data ?? [];
          setRecommendations(Array.isArray(recList) ? recList.map(normalizeProduct) : []);
        }

        if (salesRes) {
          const salesRows = Array.isArray(salesRes?.data) ? salesRes.data : [];
          setSalesHistory(salesRows);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAllData();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================================
     COMPUTED METRICS
     ======================================================= */

  const totalProducts =
    Number(dashboardData?.totalProducts) || products.length;

  const critical =
    Number(dashboardData?.critical) ||
    products.filter((p) => p.risk === 'High').length;

  const attention =
    Number(dashboardData?.attention) ||
    products.filter((p) => p.risk === 'Medium').length;

  const healthy =
    Number(dashboardData?.healthy) ||
    products.filter((p) => p.risk === 'Low').length;

  const recommendedUnits =
    Number(dashboardData?.recommendedUnits) ||
    products.reduce((total, p) => total + Number(p.recommendedQty || 0), 0);

  const predictedDemand = products.reduce(
    (total, p) => total + Number(p.predictedDemand || 0),
    0
  );

  const lowStock = critical + attention;

  const salesToday = Number(dashboardData?.salesToday?.totalUnits ?? 0);

  const reorderCount = recommendations.length;

  /* =======================================================
     MEMOIZED SECTIONS DATA
     ======================================================= */

  const lowStockProducts = useMemo(() => {
    const riskOrder = { High: 1, Medium: 2, Low: 3 };
    return products
      .filter((p) => p.risk === 'High' || p.risk === 'Medium')
      .sort((a, b) => {
        const diff = (riskOrder[a.risk] || 99) - (riskOrder[b.risk] || 99);
        if (diff !== 0) return diff;
        return Number(a.stock || 0) - Number(b.stock || 0);
      })
      .slice(0, 5);
  }, [products]);

  const displayedTopProducts = useMemo(() => {
    return Array.isArray(topProducts) ? topProducts.slice(0, 5) : [];
  }, [topProducts]);

  const displayedRecommendations = useMemo(() => {
    return Array.isArray(recommendations)
      ? recommendations.slice(0, 5).map(normalizeProduct)
      : [];
  }, [recommendations]);

  const healthData = useMemo(() => {
    return [
      { name: 'Healthy', value: healthy || 0 },
      { name: 'Attention', value: attention || 0 },
      { name: 'Critical', value: critical || 0 }
    ];
  }, [healthy, attention, critical]);

  const analyticsChartData = useMemo(() => {
    if (!salesHistory.length) return [];
    const baseline = predictedDemand > 0 ? Math.round(predictedDemand) : 0;
    return salesHistory.map((item) => {
      const parts = String(item.label || '').split('-');
      const shortDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : item.label;
      return {
        date: shortDate,
        fullDate: item.label,
        units: Number(item.units || 0),
        demandBenchmark: baseline
      };
    });
  }, [salesHistory, predictedDemand]);

  /* =======================================================
     LOADING STATE
     ======================================================= */

  if (loading) {
    return (
      <div className="section-spacing">
        <div
          className="card"
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}
        >
          <div className="spinner" />
          <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: 500 }}>
            Loading inventory intelligence dashboard...
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER DASHBOARD
     ======================================================= */

  return (
    <div>

      {/* =================================================
          1. GREETING HEADER
      ================================================= */}
      <div className="dash-greeting">
        <div className="dash-greeting-info">
          <h2 className="dash-title">
            {(() => {
              const hour = new Date().getHours();
              if (hour >= 5 && hour < 12) return 'Good morning';
              if (hour >= 12 && hour < 17) return 'Good afternoon';
              if (hour >= 17 && hour < 21) return 'Good evening';
              return 'Good night';
            })()}, Store Manager
          </h2>
          <p className="dash-subtitle">
            Here&apos;s your live inventory performance and demand analytics today.
          </p>
        </div>

        <div className="dash-date-selector">
          <div className="dash-date-pill">
            <CalendarDays size={15} />
            <span>
              {new Intl.DateTimeFormat('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(new Date())}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          2. FOUR KPI CARDS
      ================================================= */}
      <div className="grid-4 section-spacing">

        {/* Card 1: Total Products */}
        <div className="kpi-card cyan">
          <div className="card-header">
            <div>
              <div className="card-label">Total Products</div>
              <div className="card-value">{formatNumber(totalProducts)}</div>
            </div>
            <div className="icon-box cyan">
              <Package size={20} />
            </div>
          </div>
          <div className="card-footer">
            <span className="kpi-dot cyan" />
            <span>Active catalog SKUs tracked</span>
          </div>
        </div>

        {/* Card 2: Latest Sales */}
        <div className="kpi-card blue">
          <div className="card-header">
            <div>
              <div className="card-label">Latest Sales</div>
              <div className="card-value">{formatNumber(salesToday)}</div>
            </div>
            <div className="icon-box blue">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="card-footer">
            <span className="kpi-dot blue" />
            <span>Units recorded today</span>
          </div>
        </div>

        {/* Card 3: Low Stock Items */}
        <div className="kpi-card amber">
          <div className="card-header">
            <div>
              <div className="card-label">Low Stock Items</div>
              <div className="card-value">{formatNumber(lowStock)}</div>
            </div>
            <div className="icon-box amber">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="card-footer">
            <span className="kpi-dot amber" />
            <span>{critical} require immediate replenishment</span>
          </div>
        </div>

        {/* Card 4: Predicted Demand */}
        <div className="kpi-card green">
          <div className="card-header">
            <div>
              <div className="card-label">Predicted Demand</div>
              <div className="card-value">{formatNumber(predictedDemand)}</div>
            </div>
            <div className="icon-box green">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="card-footer">
            <span className="kpi-dot green" />
            <span>Expected aggregate daily units</span>
          </div>
        </div>

      </div>

      {/* =================================================
          3. INVENTORY ATTENTION SECTION
      ================================================= */}
      <div className="section-spacing">
        <div className="section-header">
          <div>
            <h3 className="section-title">Attention Required</h3>
            <p className="section-subtitle">
              Prioritized inventory categories requiring immediate stock review.
            </p>
          </div>
        </div>

        <div className="grid-3">

          {/* Attention: Critical Stock */}
          <div className="attention-card critical">
            <div className="attention-card-header">
              <div className="attention-icon critical">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="attention-card-title">Critical Stockout Risk</div>
                <div className="attention-card-count">{critical} products critical</div>
              </div>
            </div>
            <div className="attention-card-desc">
              On-hand stock is below safe threshold and lead-time coverage is critically low.
            </div>
            <Link to="/risk" className="btn btn-danger">
              Review Critical Stock <ArrowRight size={14} />
            </Link>
          </div>

          {/* Attention: Reorder Recommended */}
          <div className="attention-card reorder">
            <div className="attention-card-header">
              <div className="attention-icon reorder">
                <ShoppingCart size={20} />
              </div>
              <div>
                <div className="attention-card-title">Reorder Recommended</div>
                <div className="attention-card-count">{formatNumber(reorderCount)} products due</div>
              </div>
            </div>
            <div className="attention-card-desc">
              Products that have breached calculated reorder points based on forecasted demand.
            </div>
            <Link to="/reorder" className="btn btn-primary">
              Review Orders <ArrowRight size={14} />
            </Link>
          </div>

          {/* Attention: Overstocked */}
          <div className="attention-card overstock">
            <div className="attention-card-header">
              <div className="attention-icon overstock">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="attention-card-title">Optimal / Healthy Stock</div>
                <div className="attention-card-count">{healthy} healthy items</div>
              </div>
            </div>
            <div className="attention-card-desc">
              Inventory is balanced. No excessive capital trapped in slow-moving overstock.
            </div>
            <Link to="/inventory" className="btn btn-secondary">
              View Inventory <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </div>

      {/* =================================================
          4. SALES & DEMAND ANALYTICS CHART
      ================================================= */}
      <div className="section-spacing">
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <h3 className="section-title">Sales & Demand Trajectory</h3>
              <p className="section-subtitle">
                Historical daily unit sales compared with expected demand baseline
              </p>
            </div>
            <div className="chart-header-actions">
              <div className="chart-legend-badge">
                <span className="dot historical" />
                <span>Historical Sales</span>
              </div>
              <div className="chart-legend-badge">
                <span className="dot predicted" />
                <span>Demand Benchmark</span>
              </div>
            </div>
          </div>

          <div className="card-body">
            {analyticsChartData.length === 0 ? (
              <div className="empty-state">
                <BarChart3 size={32} style={{ opacity: 0.35, marginBottom: 8 }} />
                <span>No historical sales transactions recorded yet.</span>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  Record counter sales or import historical sales to activate dynamic trajectory analytics.
                </span>
              </div>
            ) : (
              <div className="chart-container-wrap">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#283548" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#283548' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => formatNumber(val)}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="units"
                      name="Historical Sales"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#cyanGradient)"
                    />
                    {predictedDemand > 0 && (
                      <Area
                        type="monotone"
                        dataKey="demandBenchmark"
                        name="Demand Benchmark"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="none"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          5. TOP SELLING PRODUCTS & LOW STOCK ALERTS
      ================================================= */}
      <div className="grid-2 section-spacing">

        {/* Top Selling Products */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="section-title">Top Selling Products</h3>
              <p className="section-subtitle">Highest volume items in the recent tracking period</p>
            </div>
            <Link to="/sales" className="btn btn-sm btn-secondary">
              View All
            </Link>
          </div>

          <div className="card-body">
            {displayedTopProducts.length === 0 ? (
              <div className="empty-state">
                No product sales recorded yet. Record counter or online sales to populate rankings.
              </div>
            ) : (
              displayedTopProducts.map((product, index) => {
                const units = Number(
                  product?.units ??
                    product?.unitsSold ??
                    product?.units_sold ??
                    product?.quantity ??
                    product?.sales ??
                    0
                );
                const trend = product?.trend ?? product?.growth ?? null;
                const trendDown = String(trend).startsWith('-');

                return (
                  <div key={product?.id ?? product?.name ?? index} className="top-product-row">
                    <div className={`top-product-rank ${index < 3 ? 'top3' : ''}`}>
                      {index + 1}
                    </div>

                    <div className="top-product-info">
                      <div className="top-product-name">{product?.name}</div>
                      <div className="top-product-units">{formatNumber(units)} units sold</div>
                    </div>

                    {trend != null && (
                      <div className={`top-product-trend ${trendDown ? 'down' : 'up'}`}>
                        {trendDown ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                        {trend}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="section-title">Low Stock Alerts</h3>
              <p className="section-subtitle">SKUs closest to depletion relative to lead time</p>
            </div>
            <Link to="/inventory" className="btn btn-sm btn-secondary">
              Inventory
            </Link>
          </div>

          <div className="card-body">
            {lowStockProducts.length === 0 ? (
              <div className="empty-state">
                All inventory levels are currently above reorder thresholds.
              </div>
            ) : (
              lowStockProducts.map((product, index) => {
                const reorderPoint = Number(product.reorderPoint || 0);
                const stock = Number(product.stock || 0);
                const percentage =
                  reorderPoint > 0
                    ? Math.min(100, Math.max(4, (stock / reorderPoint) * 100))
                    : 10;
                const level =
                  product.risk === 'High'
                    ? 'critical'
                    : product.risk === 'Medium'
                      ? 'medium'
                      : 'low';

                return (
                  <div key={product.id ?? product.name ?? index} className="low-stock-row">
                    <div className="low-stock-info">
                      <div className="low-stock-name">{product.name}</div>
                      <div className="low-stock-detail">
                        <span>Stock: <strong style={{ color: '#f9fafb' }}>{formatNumber(stock)}</strong></span>
                        <span>Reorder: <strong style={{ color: '#f9fafb' }}>{formatNumber(reorderPoint)}</strong></span>
                      </div>
                      <div className="low-stock-bar">
                        <div
                          className={`low-stock-bar-fill ${level}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <span className={`badge badge-${level === 'critical' ? 'danger' : level === 'medium' ? 'warning' : 'success'}`}>
                      {product.risk === 'High' ? 'Critical' : product.risk === 'Medium' ? 'Attention' : 'Healthy'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* =================================================
          6. INVENTORY HEALTH VISUALIZATION
      ================================================= */}
      <div className="section-spacing">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="section-title">Inventory Health Breakdown</h3>
              <p className="section-subtitle">
                Comprehensive stock safety distribution across {formatNumber(totalProducts)} registered catalog items
              </p>
            </div>
          </div>

          <div className="card-body">
            <div className="health-grid">

              {/* Donut Chart */}
              <div style={{ position: 'relative', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={healthData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      stroke="#1f2937"
                      strokeWidth={3}
                    >
                      {healthData.map((entry, index) => (
                        <Cell
                          key={`health-${entry.name}`}
                          fill={
                            index === 0
                              ? '#10b981'
                              : index === 1
                                ? '#f59e0b'
                                : '#ef4444'
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#374151',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        fontSize: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      }}
                      itemStyle={{ color: '#f9fafb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div
                  className="donut-center"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                  }}
                >
                  <div className="donut-center-value">{formatNumber(totalProducts)}</div>
                  <div className="donut-center-label">Products</div>
                </div>
              </div>

              {/* Detailed Breakdown Rows */}
              <div className="health-summary">
                <div className="health-summary-row">
                  <div className="health-summary-label">
                    <span className="status-dot success" />
                    <span>Healthy Stock Level</span>
                  </div>
                  <div className="health-summary-value">{healthy} SKUs</div>
                </div>

                <div className="health-summary-row">
                  <div className="health-summary-label">
                    <span className="status-dot warning" />
                    <span>Attention / Approaching Reorder</span>
                  </div>
                  <div className="health-summary-value">{attention} SKUs</div>
                </div>

                <div className="health-summary-row">
                  <div className="health-summary-label">
                    <span className="status-dot danger" />
                    <span>Critical Stockout Risk</span>
                  </div>
                  <div className="health-summary-value">{critical} SKUs</div>
                </div>

                <div className="health-summary-row">
                  <div className="health-summary-label">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                    <span>Total Products Monitored</span>
                  </div>
                  <div className="health-summary-value">{totalProducts}</div>
                </div>

                <div className="health-summary-row">
                  <div className="health-summary-label">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', flexShrink: 0 }} />
                    <span>Recommended Replenishment</span>
                  </div>
                  <div className="health-summary-value" style={{ color: '#06b6d4' }}>
                    {formatNumber(recommendedUnits)} units
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          7. REORDER RECOMMENDATIONS TABLE
      ================================================= */}
      <div className="section-spacing">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="section-title">Reorder Recommendations</h3>
              <p className="section-subtitle">
                Replenishment quantities calculated dynamically from supplier lead time, safety stock and forecasted demand
              </p>
            </div>
            {displayedRecommendations.length > 0 && (
              <Link to="/reorder" className="btn btn-sm btn-secondary">
                View All Recommendations
              </Link>
            )}
          </div>

          <div className="table-wrap">
            <table className="mini-rec-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Daily Demand</th>
                  <th>Reorder Point</th>
                  <th>Risk Status</th>
                  <th>Recommended Qty</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedRecommendations.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        No products currently require reordering. All inventory levels are above reorder thresholds.
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedRecommendations.map((product, index) => {
                    const risk = product.risk;
                    const riskClass =
                      risk === 'High'
                        ? 'danger'
                        : risk === 'Medium'
                          ? 'warning'
                          : 'success';

                    return (
                      <tr key={product.id ?? product.name ?? index}>
                        <td>
                          <strong>{product.name}</strong>
                        </td>
                        <td>{formatNumber(product.stock)}</td>
                        <td>{formatNumber(product.predictedDemand)} /day</td>
                        <td>{formatNumber(product.reorderPoint)}</td>
                        <td>
                          <span className={`badge badge-${riskClass}`}>
                            {risk}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#06b6d4' }}>
                            {formatNumber(product.recommendedQty)}
                          </strong>
                        </td>
                        <td>
                          <Link to="/reorder" className="btn btn-sm btn-cyan">
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
