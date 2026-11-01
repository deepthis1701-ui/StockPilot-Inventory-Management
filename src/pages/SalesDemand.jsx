import { useEffect, useMemo, useState } from 'react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

import {
  IndianRupee,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  ShoppingCart,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

import {
  getSales,
  getSalesDemandStats,
} from '../services/api.js';

import {
  categoryPerformance,
} from '../data/sampleData.js';


/* =========================================================
   STATIC BUSINESS DATA
========================================================= */

const topProducts = [
  {
    name: 'Fresh Milk 1L',
    category: 'Dairy',
    units: 1248,
    revenue: 49920,
    growth: 12.4,
  },
  {
    name: 'Farm Fresh Eggs',
    category: 'Dairy',
    units: 846,
    revenue: 42300,
    growth: 8.2,
  },
  {
    name: 'Basmati Rice 5kg',
    category: 'Grains',
    units: 782,
    revenue: 39100,
    growth: 6.4,
  },
  {
    name: 'Fresh Tomatoes',
    category: 'Vegetables',
    units: 731,
    revenue: 21930,
    growth: 15.1,
  },
  {
    name: 'Sunflower Oil 1L',
    category: 'Cooking',
    units: 694,
    revenue: 27760,
    growth: 4.8,
  },
];

const attentionProducts = [
  {
    name: 'Fresh Tomatoes',
    category: 'Vegetables',
    severity: 'critical',
    stock: 80,
    coverage: 3,
    demand: 28,
    action: 'Restock now',
  },
  {
    name: 'Fresh Milk 1L',
    category: 'Dairy',
    severity: 'warning',
    stock: 120,
    coverage: 6,
    demand: 18,
    action: 'Review order',
  },
  {
    name: 'Farm Fresh Eggs',
    category: 'Dairy',
    severity: 'monitor',
    stock: 250,
    coverage: 8,
    demand: 30,
    action: 'Monitor',
  },
];

const upcomingDemand = [
  {
    name: 'Fresh Milk 1L',
    current: 120,
    expected: 180,
    growth: 12,
    action: 'Restock',
  },
  {
    name: 'Farm Fresh Eggs',
    current: 250,
    expected: 210,
    growth: 8,
    action: 'Healthy',
  },
  {
    name: 'Basmati Rice 5kg',
    current: 320,
    expected: 275,
    growth: 6,
    action: 'Healthy',
  },
  {
    name: 'Fresh Tomatoes',
    current: 80,
    expected: 140,
    growth: 15,
    action: 'Restock',
  },
  {
    name: 'Sunflower Oil 1L',
    current: 190,
    expected: 165,
    growth: 4,
    action: 'Monitor',
  },
];

const fallbackSalesData = [
  { date: 'Mon', value: 19800 },
  { date: 'Tue', value: 22400 },
  { date: 'Wed', value: 21100 },
  { date: 'Thu', value: 24600 },
  { date: 'Fri', value: 26900 },
  { date: 'Sat', value: 29800 },
  { date: 'Sun', value: 28400 },
];

const fallbackCategoryData = [
  { category: 'Dairy', sales: 145000 },
  { category: 'Grains', sales: 118000 },
  { category: 'Vegetables', sales: 97000 },
  { category: 'Cooking', sales: 89000 },
  { category: 'Snacks', sales: 76000 },
  { category: 'Beverages', sales: 69000 },
];


/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function normalizeSalesData(response) {
  const raw =
    response?.data ||
    response?.sales ||
    response?.trend ||
    [];

  if (!Array.isArray(raw) || raw.length === 0) {
    return fallbackSalesData;
  }

  return raw.map((item, index) => ({
    date:
      item.date ||
      item.label ||
      item.day ||
      `Day ${index + 1}`,

    value: Number(
      item.value ??
      item.sales ??
      item.revenue ??
      item.amount ??
      0
    ),
  }));
}

function normalizeCategoryData(response) {
  const raw =
    response?.data ||
    response?.categories ||
    categoryPerformance ||
    [];

  if (!Array.isArray(raw) || raw.length === 0) {
    return fallbackCategoryData;
  }

  const result = raw
    .map((item) => ({
      category:
        item.category ||
        item.name ||
        item.label ||
        'Other',

      sales: Number(
        item.sales ??
        item.revenue ??
        item.value ??
        0
      ),
    }))
    .filter((item) => item.sales > 0);

  return result.length > 0 ? result : fallbackCategoryData;
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  trendLabel,
}) {
  return (
    <div className="sp-stat-card">
      <div className="sp-stat-top">
        <div className="sp-stat-icon">
          {icon}
        </div>

        {trend !== undefined && (
          <div className="sp-stat-trend">
            <ArrowUpRight size={15} />
            {trend}%
          </div>
        )}
      </div>

      <div className="sp-stat-title">
        {title}
      </div>

      <div className="sp-stat-value">
        {value}
      </div>

      <div className="sp-stat-subtitle">
        {subtitle}
      </div>

      {trendLabel && (
        <div className="sp-stat-trend-label">
          {trendLabel}
        </div>
      )}
    </div>
  );
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function SalesDemand() {
  const [salesData, setSalesData] = useState(
    fallbackSalesData
  );

  const [categoryData, setCategoryData] = useState(
    fallbackCategoryData
  );

  const [stats, setStats] = useState({
    totalSales: 697412,
    unitsSold: 8204,
    averageDailyDemand: 273,
    salesGrowth: 6.2,
  });

  const [range, setRange] = useState('daily');
  const [metric, setMetric] = useState('revenue');

  const [loading, setLoading] = useState(false);


  /* =====================================================
     LOAD SALES DATA
  ===================================================== */

  const loadSalesData = async () => {
    try {
      setLoading(true);

      const [salesResponse, statsResponse] =
        await Promise.all([
          getSales(range, metric),
          getSalesDemandStats(),
        ]);

      setSalesData(
        normalizeSalesData(salesResponse)
      );

      if (statsResponse) {
        setStats({
          totalSales:
            Number(
              statsResponse.totalSales ??
              statsResponse.total_sales ??
              statsResponse.revenue ??
              697412
            ),

          unitsSold:
            Number(
              statsResponse.unitsSold ??
              statsResponse.units_sold ??
              8204
            ),

          averageDailyDemand:
            Number(
              statsResponse.averageDailyDemand ??
              statsResponse.average_daily_demand ??
              273
            ),

          salesGrowth:
            Number(
              statsResponse.salesGrowth ??
              statsResponse.sales_growth ??
              6.2
            ),
        });
      }
    } catch (error) {
      console.error(
        'Unable to load sales data:',
        error
      );

      setSalesData(fallbackSalesData);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadSalesData();
  }, [range, metric]);


  /* =====================================================
     CATEGORY DATA
  ===================================================== */

  useEffect(() => {
    setCategoryData(
      normalizeCategoryData({
        data: categoryPerformance,
      })
    );
  }, []);


  /* =====================================================
     TOTAL CATEGORY SALES
  ===================================================== */

  const categoryTotal = useMemo(() => {
    return categoryData.reduce(
      (sum, item) => sum + Number(item.sales || 0),
      0
    );
  }, [categoryData]);


  /* =====================================================
     TOOLTIP
  ===================================================== */

  const SalesTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload ||
      payload.length === 0
    ) {
      return null;
    }

    return (
      <div className="sp-tooltip">
        <div className="sp-tooltip-label">
          {label}
        </div>

        <div className="sp-tooltip-value">
          {metric === 'revenue'
            ? formatCurrency(payload[0].value)
            : `${Number(
                payload[0].value || 0
              ).toLocaleString('en-IN')} units`}
        </div>
      </div>
    );
  };


  return (
    <div className="sp-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="sp-page-header">

        <div>
          <div className="sp-eyebrow">
            BUSINESS INTELLIGENCE
          </div>

          <h1>
            Sales & Demand
          </h1>

          <p>
            Understand what customers are buying,
            what needs attention, and what demand
            is coming next.
          </p>
        </div>

        <button
          className="sp-refresh-btn"
          onClick={loadSalesData}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? 'sp-spin'
                : ''
            }
          />

          {loading
            ? 'Refreshing...'
            : 'Refresh data'}
        </button>

      </div>


      {/* =================================================
          BUSINESS SUMMARY
      ================================================= */}

      <section className="sp-section">

        <div className="sp-section-heading">
          <div>
            <div className="sp-section-kicker">
              BUSINESS SUMMARY
            </div>

            <h2>
              How the store is performing
            </h2>
          </div>
        </div>


        <div className="sp-stats-grid">

          <StatCard
            icon={<IndianRupee size={20} />}
            title="Total Sales"
            value={formatCurrency(
              stats.totalSales
            )}
            subtitle="Revenue · Last 30 days"
            trend={stats.salesGrowth}
            trendLabel="Growing"
          />

          <StatCard
            icon={<ShoppingCart size={20} />}
            title="Units Sold"
            value={Number(
              stats.unitsSold || 0
            ).toLocaleString('en-IN')}
            subtitle="Units · Last 30 days"
          />

          <StatCard
            icon={<Package size={20} />}
            title="Average Daily Demand"
            value={Number(
              stats.averageDailyDemand || 0
            ).toLocaleString('en-IN')}
            subtitle="Units expected per day"
          />

          <StatCard
            icon={<TrendingUp size={20} />}
            title="Sales Growth"
            value={`+${Number(
              stats.salesGrowth || 0
            ).toFixed(1)}%`}
            subtitle="Compared with previous period"
            trend={stats.salesGrowth}
          />

        </div>

      </section>


      {/* =================================================
          SALES PERFORMANCE
      ================================================= */}

      <section className="sp-card sp-sales-card">

        <div className="sp-card-header">

          <div>
            <div className="sp-section-kicker">
              SALES PERFORMANCE
            </div>

            <h2>
              Sales trend
            </h2>

            <p>
              Track how sales are changing over time.
            </p>
          </div>


          <div className="sp-control-group">

            <div className="sp-toggle">
              {[
                ['daily', 'Daily'],
                ['weekly', 'Weekly'],
                ['monthly', 'Monthly'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={
                    range === value
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setRange(value)
                  }
                >
                  {label}
                </button>
              ))}
            </div>


            <div className="sp-toggle">
              <button
                className={
                  metric === 'revenue'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setMetric('revenue')
                }
              >
                Revenue
              </button>

              <button
                className={
                  metric === 'units'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setMetric('units')
                }
              >
                Units
              </button>
            </div>

          </div>

        </div>


        <div className="sp-chart-wrap">
          <ResponsiveContainer
            width="100%"
            height={330}
          >
            <LineChart
              data={salesData}
              margin={{
                top: 10,
                right: 15,
                left: 5,
                bottom: 5,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  metric === 'revenue'
                    ? `₹${Math.round(
                        value / 1000
                      )}k`
                    : value
                }
              />

              <Tooltip
                content={<SalesTooltip />}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="currentColor"
                strokeWidth={3}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 6,
                }}
              />

            </LineChart>
          </ResponsiveContainer>
        </div>

      </section>


      {/* =================================================
          TOP PRODUCTS
      ================================================= */}

      <section className="sp-card">

        <div className="sp-card-header">

          <div>
            <div className="sp-section-kicker">
              TOP-SELLING PRODUCTS
            </div>

            <h2>
              What customers are buying
            </h2>

            <p>
              Products generating the strongest
              sales volume and revenue.
            </p>
          </div>

          <div className="sp-header-badge">
            Last 30 days
          </div>

        </div>


        <div className="sp-product-list">

          {topProducts.map(
            (product, index) => (
              <div
                className="sp-product-row"
                key={product.name}
              >

                <div className="sp-rank">
                  {index + 1}
                </div>


                <div className="sp-product-main">

                  <div className="sp-product-name">
                    {product.name}
                  </div>

                  <div className="sp-product-category">
                    {product.category}
                  </div>

                </div>


                <div className="sp-product-metric">

                  <span>
                    Units sold
                  </span>

                  <strong>
                    {product.units.toLocaleString(
                      'en-IN'
                    )}
                  </strong>

                </div>


                <div className="sp-product-metric">

                  <span>
                    Revenue
                  </span>

                  <strong>
                    {formatCurrency(
                      product.revenue
                    )}
                  </strong>

                </div>


                <div className="sp-growth positive">
                  <ArrowUpRight size={15} />

                  {product.growth}%
                </div>

              </div>
            )
          )}

        </div>

      </section>


      {/* =================================================
          NEEDS ATTENTION
      ================================================= */}

      <section className="sp-card">

        <div className="sp-card-header">

          <div>
            <div className="sp-section-kicker warning-kicker">
              PRODUCTS NEEDING ATTENTION
            </div>

            <h2>
              Where action may be needed
            </h2>

            <p>
              Products where current stock may
              not comfortably cover upcoming demand.
            </p>
          </div>

          <div className="sp-attention-count">
            <AlertTriangle size={16} />
            {attentionProducts.length} items
          </div>

        </div>


        <div className="sp-attention-list">

          {attentionProducts.map(
            (product) => (

              <div
                className={`sp-attention-row ${product.severity}`}
                key={product.name}
              >

                <div className="sp-attention-icon">

                  {product.severity ===
                  'critical' ? (
                    <AlertTriangle size={20} />
                  ) : product.severity ===
                    'warning' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}

                </div>


                <div className="sp-attention-main">

                  <div className="sp-attention-name">
                    {product.name}
                  </div>

                  <div className="sp-attention-category">
                    {product.category}
                  </div>

                </div>


                <div className="sp-attention-stat">

                  <span>
                    Current stock
                  </span>

                  <strong>
                    {product.stock} units
                  </strong>

                </div>


                <div className="sp-attention-stat">

                  <span>
                    Daily demand
                  </span>

                  <strong>
                    {product.demand} units
                  </strong>

                </div>


                <div className="sp-attention-stat">

                  <span>
                    Coverage
                  </span>

                  <strong>
                    {product.coverage} days
                  </strong>

                </div>


                <div className="sp-attention-action">

                  <span>
                    {product.action}
                  </span>

                  <ChevronRight size={17} />

                </div>

              </div>

            )
          )}

        </div>

      </section>


      {/* =================================================
          CATEGORY + UPCOMING DEMAND
      ================================================= */}

      <div className="sp-two-column">

        {/* CATEGORY */}

        <section className="sp-card">

          <div className="sp-card-header">

            <div>
              <div className="sp-section-kicker">
                CATEGORY PERFORMANCE
              </div>

              <h2>
                Demand by category
              </h2>

              <p>
                Where most of the store's sales
                are coming from.
              </p>
            </div>

          </div>


          <div className="sp-chart-wrap">
            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 20,
                  left: 10,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `₹${Math.round(
                      value / 1000
                    )}k`
                  }
                />

                <YAxis
                  type="category"
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  width={85}
                />

                <Tooltip
                  formatter={(value) => [
                    formatCurrency(value),
                    'Sales',
                  ]}
                />

                <Bar
                  dataKey="sales"
                  radius={[
                    0,
                    6,
                    6,
                    0,
                  ]}
                  fill="currentColor"
                />

              </BarChart>
            </ResponsiveContainer>
          </div>


          <div className="sp-category-total">

            <span>
              Total category sales
            </span>

            <strong>
              {formatCurrency(
                categoryTotal
              )}
            </strong>

          </div>

        </section>


        {/* UPCOMING DEMAND */}

        <section className="sp-card">

          <div className="sp-card-header">

            <div>
              <div className="sp-section-kicker">
                UPCOMING DEMAND
              </div>

              <h2>
                What may be needed next
              </h2>

              <p>
                Compare current stock with
                expected demand.
              </p>
            </div>

          </div>


          <div className="sp-upcoming-list">

            {upcomingDemand.map(
              (item) => {

                const isRestock =
                  item.action === 'Restock';

                const stockGap =
                  item.expected -
                  item.current;

                return (
                  <div
                    className="sp-upcoming-row"
                    key={item.name}
                  >

                    <div className="sp-upcoming-icon">
                      {isRestock ? (
                        <ShoppingCart
                          size={18}
                        />
                      ) : (
                        <Package
                          size={18}
                        />
                      )}
                    </div>


                    <div className="sp-upcoming-main">

                      <div className="sp-upcoming-name">
                        {item.name}
                      </div>

                      <div className="sp-upcoming-bar">

                        <div
                          className="sp-upcoming-bar-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                15,
                                (item.current /
                                  Math.max(
                                    item.expected,
                                    1
                                  )) *
                                  100
                              )
                            )}%`,
                          }}
                        />

                      </div>

                    </div>


                    <div className="sp-upcoming-values">

                      <div>
                        <span>
                          Current
                        </span>

                        <strong>
                          {item.current}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Expected
                        </span>

                        <strong>
                          {item.expected}
                        </strong>
                      </div>

                    </div>


                    <div
                      className={`sp-upcoming-status ${
                        isRestock
                          ? 'restock'
                          : item.action ===
                            'Monitor'
                          ? 'monitor'
                          : 'healthy'
                      }`}
                    >
                      {isRestock ? (
                        <ShoppingCart
                          size={14}
                        />
                      ) : (
                        <CheckCircle2
                          size={14}
                        />
                      )}

                      {item.action}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>

      </div>


      {/* =================================================
          SEASONAL INSIGHTS
      ================================================= */}

      <section className="sp-card sp-seasonal-card">

        <div className="sp-seasonal-icon">
          <CalendarDays size={22} />
        </div>

        <div className="sp-seasonal-content">

          <div className="sp-section-kicker">
            SEASONAL INSIGHTS
          </div>

          <h2>
            Prepare inventory before demand changes
          </h2>

          <p>
            Dairy and fresh produce are showing
            stronger near-term demand. Fresh tomatoes
            are currently the most important item to
            review, while milk demand is also moving
            upward. Consider placing replenishment
            orders before the next demand cycle.
          </p>

        </div>


        <div className="sp-seasonal-highlight">

          <TrendingUp size={18} />

          <div>

            <span>
              Highest upcoming growth
            </span>

            <strong>
              Fresh Tomatoes · +15%
            </strong>

          </div>

        </div>

      </section>


      {/* =================================================
          PAGE FOOTER NOTE
      ================================================= */}

      <div className="sp-page-note">

        <span>
          StockPilot uses sales history, current
          inventory and expected demand to highlight
          business actions.
        </span>

        <span className="sp-page-note-right">
          Updated just now
        </span>

      </div>


      {/* =================================================
          CSS
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .sp-page {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          padding: 30px 32px 50px;
        }


        /* ===============================
           HEADER
        =============================== */

        .sp-page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 30px;
        }

        .sp-eyebrow,
        .sp-section-kicker {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #64748b;
        }

        .sp-page-header h1 {
          margin: 7px 0 8px;
          font-size: 32px;
          line-height: 1.15;
          font-weight: 750;
          color: #0f172a;
        }

        .sp-page-header p {
          margin: 0;
          max-width: 700px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .sp-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #dbe2ea;
          background: #ffffff;
          color: #334155;
          padding: 10px 15px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .sp-refresh-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .sp-refresh-btn:disabled {
          opacity: 0.65;
          cursor: default;
        }

        .sp-spin {
          animation: sp-spin 1s linear infinite;
        }

        @keyframes sp-spin {
          to {
            transform: rotate(360deg);
          }
        }


        /* ===============================
           SECTION
        =============================== */

        .sp-section {
          margin-bottom: 22px;
        }

        .sp-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .sp-section-heading h2,
        .sp-card-header h2 {
          margin: 5px 0 0;
          color: #0f172a;
          font-size: 18px;
          font-weight: 700;
        }

        .sp-card-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }


        /* ===============================
           STAT CARDS
        =============================== */

        .sp-stats-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .sp-stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          padding: 18px;
          min-height: 160px;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.03);
        }

        .sp-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 17px;
        }

        .sp-stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #334155;
        }

        .sp-stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          color: #15803d;
          font-size: 12px;
          font-weight: 700;
        }

        .sp-stat-title {
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .sp-stat-value {
          margin-top: 6px;
          color: #0f172a;
          font-size: 25px;
          font-weight: 750;
          letter-spacing: -0.02em;
        }

        .sp-stat-subtitle {
          margin-top: 5px;
          color: #94a3b8;
          font-size: 11px;
        }

        .sp-stat-trend-label {
          margin-top: 7px;
          color: #15803d;
          font-size: 11px;
          font-weight: 600;
        }


        /* ===============================
           CARD
        =============================== */

        .sp-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.03);
        }

        .sp-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .sp-header-badge {
          padding: 7px 10px;
          border-radius: 7px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }


        /* ===============================
           SALES CHART
        =============================== */

        .sp-sales-card {
          margin-top: 2px;
        }

        .sp-control-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .sp-toggle {
          display: inline-flex;
          padding: 3px;
          border-radius: 8px;
          background: #f1f5f9;
        }

        .sp-toggle button {
          border: none;
          background: transparent;
          color: #64748b;
          padding: 7px 11px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .sp-toggle button.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow:
            0 1px 3px rgba(15, 23, 42, 0.1);
        }

        .sp-chart-wrap {
          width: 100%;
        }

        .sp-tooltip {
          background: #0f172a;
          border-radius: 8px;
          padding: 9px 12px;
          color: #ffffff;
          box-shadow:
            0 8px 20px rgba(15, 23, 42, 0.18);
        }

        .sp-tooltip-label {
          font-size: 11px;
          color: #cbd5e1;
          margin-bottom: 3px;
        }

        .sp-tooltip-value {
          font-size: 13px;
          font-weight: 700;
        }


        /* ===============================
           TOP PRODUCTS
        =============================== */

        .sp-product-list {
          width: 100%;
        }

        .sp-product-row {
          display: grid;
          grid-template-columns:
            42px minmax(200px, 1fr)
            150px 150px 75px;
          align-items: center;
          gap: 18px;
          min-height: 72px;
          padding: 13px 4px;
          border-bottom: 1px solid #eef2f6;
        }

        .sp-product-row:last-child {
          border-bottom: none;
        }

        .sp-rank {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 750;
        }

        .sp-product-name {
          color: #0f172a;
          font-size: 13px;
          font-weight: 700;
        }

        .sp-product-category {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 11px;
        }

        .sp-product-metric {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .sp-product-metric span {
          color: #94a3b8;
          font-size: 10px;
        }

        .sp-product-metric strong {
          color: #334155;
          font-size: 12px;
        }

        .sp-growth {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 2px;
          font-size: 12px;
          font-weight: 700;
        }

        .sp-growth.positive {
          color: #15803d;
        }


        /* ===============================
           ATTENTION
        =============================== */

        .warning-kicker {
          color: #b45309;
        }

        .sp-attention-count {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 7px;
          background: #fff7ed;
          color: #c2410c;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .sp-attention-list {
          width: 100%;
        }

        .sp-attention-row {
          display: grid;
          grid-template-columns:
            42px minmax(190px, 1fr)
            130px 130px 110px 130px;
          align-items: center;
          gap: 18px;
          min-height: 78px;
          padding: 13px 4px;
          border-bottom: 1px solid #eef2f6;
        }

        .sp-attention-row:last-child {
          border-bottom: none;
        }

        .sp-attention-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sp-attention-row.critical
        .sp-attention-icon {
          background: #fef2f2;
          color: #dc2626;
        }

        .sp-attention-row.warning
        .sp-attention-icon {
          background: #fff7ed;
          color: #ea580c;
        }

        .sp-attention-row.monitor
        .sp-attention-icon {
          background: #f0fdf4;
          color: #16a34a;
        }

        .sp-attention-name {
          color: #0f172a;
          font-size: 13px;
          font-weight: 700;
        }

        .sp-attention-category {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 11px;
        }

        .sp-attention-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sp-attention-stat span {
          color: #94a3b8;
          font-size: 10px;
        }

        .sp-attention-stat strong {
          color: #334155;
          font-size: 12px;
        }

        .sp-attention-action {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
        }

        .sp-attention-row.critical
        .sp-attention-action {
          color: #dc2626;
        }

        .sp-attention-row.warning
        .sp-attention-action {
          color: #d97706;
        }


        /* ===============================
           TWO COLUMN
        =============================== */

        .sp-two-column {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        .sp-two-column .sp-card {
          height: 100%;
        }


        /* ===============================
           CATEGORY
        =============================== */

        .sp-category-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          padding-top: 15px;
          border-top: 1px solid #eef2f6;
        }

        .sp-category-total span {
          color: #64748b;
          font-size: 11px;
        }

        .sp-category-total strong {
          color: #0f172a;
          font-size: 15px;
        }


        /* ===============================
           UPCOMING DEMAND
        =============================== */

        .sp-upcoming-list {
          display: flex;
          flex-direction: column;
        }

        .sp-upcoming-row {
          display: grid;
          grid-template-columns:
            36px minmax(120px, 1fr)
            105px 82px;
          align-items: center;
          gap: 12px;
          padding: 13px 0;
          border-bottom: 1px solid #eef2f6;
        }

        .sp-upcoming-row:last-child {
          border-bottom: none;
        }

        .sp-upcoming-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #475569;
        }

        .sp-upcoming-name {
          color: #334155;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .sp-upcoming-bar {
          height: 5px;
          width: 100%;
          background: #f1f5f9;
          border-radius: 20px;
          overflow: hidden;
        }

        .sp-upcoming-bar-fill {
          height: 100%;
          border-radius: 20px;
          background: #64748b;
        }

        .sp-upcoming-values {
          display: flex;
          gap: 12px;
        }

        .sp-upcoming-values div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sp-upcoming-values span {
          color: #94a3b8;
          font-size: 9px;
        }

        .sp-upcoming-values strong {
          color: #334155;
          font-size: 11px;
        }

        .sp-upcoming-status {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
        }

        .sp-upcoming-status.restock {
          color: #dc2626;
        }

        .sp-upcoming-status.monitor {
          color: #d97706;
        }

        .sp-upcoming-status.healthy {
          color: #15803d;
        }


        /* ===============================
           SEASONAL
        =============================== */

        .sp-seasonal-card {
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr) 270px;
          align-items: center;
          gap: 18px;
          background: #fafbfc;
        }

        .sp-seasonal-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #f1f5f9;
          color: #475569;
        }

        .sp-seasonal-content h2 {
          margin: 5px 0 7px;
          color: #0f172a;
          font-size: 17px;
        }

        .sp-seasonal-content p {
          margin: 0;
          max-width: 780px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.65;
        }

        .sp-seasonal-highlight {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #ffffff;
          color: #334155;
        }

        .sp-seasonal-highlight > svg {
          flex-shrink: 0;
        }

        .sp-seasonal-highlight div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .sp-seasonal-highlight span {
          color: #94a3b8;
          font-size: 9px;
        }

        .sp-seasonal-highlight strong {
          color: #334155;
          font-size: 11px;
        }


        /* ===============================
           FOOTER NOTE
        =============================== */

        .sp-page-note {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 5px 3px;
          color: #94a3b8;
          font-size: 10px;
        }

        .sp-page-note-right {
          white-space: nowrap;
        }


        /* ===============================
           RESPONSIVE
        =============================== */

        @media (max-width: 1200px) {

          .sp-stats-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .sp-attention-row {
            grid-template-columns:
              42px minmax(180px, 1fr)
              110px 110px 90px 110px;
            gap: 12px;
          }

          .sp-product-row {
            grid-template-columns:
              42px minmax(160px, 1fr)
              125px 125px 65px;
            gap: 12px;
          }

          .sp-seasonal-card {
            grid-template-columns:
              48px 1fr;
          }

          .sp-seasonal-highlight {
            grid-column: 2;
          }
        }


        @media (max-width: 900px) {

          .sp-page {
            padding: 24px 20px 40px;
          }

          .sp-page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .sp-control-group {
            justify-content: flex-start;
          }

          .sp-two-column {
            grid-template-columns: 1fr;
          }

          .sp-attention-row {
            grid-template-columns:
              42px 1fr 100px;
          }

          .sp-attention-stat:nth-of-type(1),
          .sp-attention-stat:nth-of-type(2) {
            display: none;
          }

          .sp-attention-action {
            justify-content: flex-start;
          }

          .sp-product-row {
            grid-template-columns:
              42px 1fr 100px;
          }

          .sp-product-metric:nth-of-type(2) {
            display: none;
          }

          .sp-growth {
            justify-content: flex-start;
          }

          .sp-upcoming-row {
            grid-template-columns:
              36px 1fr 80px;
          }

          .sp-upcoming-values {
            display: none;
          }

          .sp-upcoming-status {
            justify-content: flex-start;
          }
        }


        @media (max-width: 640px) {

          .sp-page {
            padding: 20px 14px 32px;
          }

          .sp-page-header h1 {
            font-size: 27px;
          }

          .sp-stats-grid {
            grid-template-columns: 1fr;
          }

          .sp-card {
            padding: 17px;
            border-radius: 11px;
          }

          .sp-card-header {
            flex-direction: column;
            gap: 12px;
          }

          .sp-control-group {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .sp-toggle {
            width: 100%;
          }

          .sp-toggle button {
            flex: 1;
          }

          .sp-product-row {
            grid-template-columns:
              34px 1fr 55px;
            gap: 10px;
          }

          .sp-product-metric {
            display: none;
          }

          .sp-growth {
            justify-content: flex-end;
          }

          .sp-attention-row {
            grid-template-columns:
              36px 1fr;
            gap: 10px;
          }

          .sp-attention-stat,
          .sp-attention-action {
            display: none;
          }

          .sp-seasonal-card {
            grid-template-columns: 42px 1fr;
            gap: 12px;
          }

          .sp-seasonal-highlight {
            grid-column: 1 / -1;
          }

          .sp-page-note {
            flex-direction: column;
            gap: 5px;
          }

        }

      `}</style>

    </div>
  );
}