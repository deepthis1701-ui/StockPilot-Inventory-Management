import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Package,
  ShoppingCart,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';

import {
  getDashboard,
  getTopProducts,
  getRecommendations,
} from '../services/api.js';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
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

  if (
    riskValue === 'high' ||
    riskValue === 'critical'
  ) {
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

    id:
      product?.id ??
      product?.product_id ??
      product?.productId,

    name:
      product?.name ??
      product?.product_name ??
      'Unknown Product',

    category:
      product?.category ??
      product?.category_name ??
      'Other',

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


/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] =
    useState(null);

  const [products, setProducts] =
    useState([]);

  const [topProducts, setTopProducts] =
    useState([]);

  const [recommendations, setRecommendations] =
    useState([]);


  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await getDashboard();

        if (!active) return;

        const normalized =
          Array.isArray(response?.products)
            ? response.products.map(normalizeProduct)
            : [];

        setDashboardData(response);
        setProducts(normalized);
      } catch (error) {
        console.error(
          'Dashboard error:',
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);


  /* =======================================================
     LOAD TOP PRODUCTS
  ======================================================= */

  useEffect(() => {
    let active = true;

    async function loadTopProducts() {
      try {
        const response =
          await getTopProducts();

        if (!active) return;

        const data =
          response?.products ??
          response?.data ??
          [];

        setTopProducts(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          'Top products error:',
          error
        );
      }
    }

    loadTopProducts();

    return () => {
      active = false;
    };
  }, []);


  /* =======================================================
     LOAD RECOMMENDATIONS
  ======================================================= */

  useEffect(() => {
    let active = true;

    async function loadRecommendations() {
      try {
        const response =
          await getRecommendations();

        if (!active) return;

        const data =
          response?.recommendations ??
          response?.data ??
          [];

        setRecommendations(
          Array.isArray(data)
            ? data.map(normalizeProduct)
            : []
        );
      } catch (error) {
        console.error(
          'Recommendations error:',
          error
        );
      }
    }

    loadRecommendations();

    return () => {
      active = false;
    };
  }, []);


  /* =======================================================
     SUMMARY
  ======================================================= */

  const totalProducts =
    Number(
      dashboardData?.totalProducts
    ) || products.length;

  const critical =
    Number(
      dashboardData?.critical
    ) ||
    products.filter(
      (product) =>
        product.risk === 'High'
    ).length;

  const attention =
    Number(
      dashboardData?.attention
    ) ||
    products.filter(
      (product) =>
        product.risk === 'Medium'
    ).length;

  const healthy =
    Number(
      dashboardData?.healthy
    ) ||
    products.filter(
      (product) =>
        product.risk === 'Low'
    ).length;

  const recommendedUnits =
    Number(
      dashboardData?.recommendedUnits
    ) ||
    products.reduce(
      (total, product) =>
        total +
        Number(
          product.recommendedQty || 0
        ),
      0
    );

  const predictedDemand =
    products.reduce(
      (total, product) =>
        total +
        Number(
          product.predictedDemand || 0
        ),
      0
    );

  const lowStock =
    critical + attention;

  const salesToday = Number(
    dashboardData?.salesToday?.totalUnits ?? 0
  );

  const reorderCount = recommendations.length;


  /* =======================================================
     LOW STOCK PRODUCTS
  ======================================================= */

  const lowStockProducts =
    useMemo(() => {
      const riskOrder = {
        High: 1,
        Medium: 2,
        Low: 3,
      };

      return products
        .filter(
          (product) =>
            product.risk === 'High' ||
            product.risk === 'Medium'
        )
        .sort((a, b) => {
          const riskDifference =
            (riskOrder[a.risk] || 99) -
            (riskOrder[b.risk] || 99);

          if (riskDifference !== 0) {
            return riskDifference;
          }

          return (
            Number(a.stock || 0) -
            Number(b.stock || 0)
          );
        })
        .slice(0, 5);
    }, [products]);


  /* =======================================================
     TOP PRODUCTS
  ======================================================= */

  const displayedTopProducts =
    useMemo(() => {
      return Array.isArray(topProducts)
        ? topProducts.slice(0, 5)
        : [];
    }, [topProducts]);


  /* =======================================================
     RECOMMENDATIONS
  ======================================================= */

  const displayedRecommendations =
    useMemo(() => {
      return Array.isArray(recommendations)
        ? recommendations
            .slice(0, 5)
            .map(normalizeProduct)
        : [];
    }, [recommendations]);


  /* =======================================================
     INVENTORY HEALTH
  ======================================================= */

  const healthData = [
    {
      name: 'Healthy',
      value: healthy,
    },
    {
      name: 'Attention',
      value: attention,
    },
    {
      name: 'Critical',
      value: critical,
    },
  ];


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="section-spacing">
        <div className="card">
          Loading inventory overview...
        </div>
      </div>
    );
  }


  /* =======================================================
     UI
  ======================================================= */

  return (
    <div>

      {/* =================================================
          GREETING
      ================================================= */}

      <div className="dash-greeting">

        <div>
          <h2 className="dash-greeting">
  {(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    }

    if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    }

    if (hour >= 17 && hour < 21) {
      return 'Good evening';
    }

    return 'Good night';
  })()}
</h2>

          <p>
            Here&apos;s what&apos;s happening
            with your store inventory today.
          </p>
        </div>

        <div className="dash-date-selector">
          <div className="dash-date-pill">
            <CalendarDays size={15} />

            <span>
              {new Intl.DateTimeFormat('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date())}
            </span>
          </div>
        </div>

      </div>


      {/* =================================================
          KPI / SUMMARY
      ================================================= */}

      <div className="grid-4 section-spacing">

        <div className="card">

          <div className="card-header">

            <div>
              <div className="card-label">
                Total Products
              </div>

              <div className="card-value">
                {formatNumber(totalProducts)}
              </div>
            </div>

            <div className="icon-box blue">
              <Package size={19} />
            </div>

          </div>

          <div className="card-footer">
            Products tracked
          </div>

        </div>


        <div className="card">

          <div className="card-header">

            <div>
              <div className="card-label">
                Latest Sales
              </div>

              <div className="card-value">
                {formatNumber(salesToday)}
              </div>
            </div>

            <div className="icon-box purple">
              <TrendingUp size={19} />
            </div>

          </div>

          <div className="card-footer">
            Units sold today
          </div>

        </div>


        <div className="card">

          <div className="card-header">

            <div>
              <div className="card-label">
                Low Stock Items
              </div>

              <div className="card-value">
                {formatNumber(lowStock)}
              </div>
            </div>

            <div className="icon-box orange">
              <AlertTriangle size={19} />
            </div>

          </div>

          <div className="card-footer">
            {critical} require immediate action
          </div>

        </div>


        <div className="card">

          <div className="card-header">

            <div>
              <div className="card-label">
                Predicted Demand
              </div>

              <div className="card-value">
                {formatNumber(predictedDemand)}
              </div>
            </div>

            <div className="icon-box green">
              <TrendingUp size={19} />
            </div>

          </div>

          <div className="card-footer">
            Expected daily demand
          </div>

        </div>

      </div>


      {/* =================================================
          ATTENTION
      ================================================= */}

      <div className="section-spacing">

        <div className="section-title">
          Attention
        </div>

        <div className="section-subtitle">
          Inventory areas that need your attention.
        </div>

        <div className="grid-3">

          <div className="attention-card">

            <div className="attention-card-header">

              <div className="attention-icon critical">
                <AlertTriangle size={19} />
              </div>

              <div>

                <div className="attention-card-title">
                  Critical Stock
                </div>

                <div className="attention-card-count">
                  {critical} products
                </div>

              </div>

            </div>

            <div className="attention-card-desc">
              These products are at high risk
              of running out of stock.
            </div>

            <button
              type="button"
              className="btn btn-danger"
            >
              Review Critical Stock
            </button>

          </div>


          <div className="attention-card">

            <div className="attention-card-header">

              <div className="attention-icon reorder">
                <ShoppingCart size={19} />
              </div>

              <div>

                <div className="attention-card-title">
                  Reorder Recommended
                </div>

                <div className="attention-card-count">
                  {formatNumber(reorderCount)} products
                </div>

              </div>

            </div>

            <div className="attention-card-desc">
              Products that may need
              replenishment based on demand.
            </div>

            <button
              type="button"
              className="btn btn-primary"
            >
              Review Orders
            </button>

          </div>


          <div className="attention-card">

            <div className="attention-card-header">

              <div className="attention-icon overstock">
                <CheckCircle2 size={19} />
              </div>

              <div>

                <div className="attention-card-title">
                  Overstocked
                </div>

                <div className="attention-card-count">
                  0 products
                </div>

              </div>

            </div>

            <div className="attention-card-desc">
              No products are currently
              identified as overstocked.
            </div>

            <button
              type="button"
              className="btn"
            >
              View Inventory
            </button>

          </div>

        </div>

      </div>


      {/* =================================================
          TOP SELLING + LOW STOCK
      ================================================= */}

      <div className="grid-2 section-spacing">

        {/* TOP SELLING */}

        <div className="card">

          <div className="card-header">

            <div>

              <div className="section-title">
                Top Selling Products
              </div>

              <div className="section-subtitle">
                Best performing products recently.
              </div>

            </div>

          </div>

          <div>

            {displayedTopProducts.length === 0 ? (
              <div className="empty-state">
                No sales recorded yet. Record a sale to see your top-selling products.
              </div>
            ) : displayedTopProducts.map(
              (product, index) => {

                const units =
                  Number(
                    product?.units ??
                      product?.unitsSold ??
                      product?.units_sold ??
                      product?.quantity ??
                      product?.sales ??
                      0
                  );

                const trend =
                  product?.trend ??
                  product?.growth ??
                  null;

                const trendDown =
                  String(trend).startsWith('-');

                return (
                  <div
                    key={
                      product?.id ??
                      product?.name ??
                      index
                    }
                    className="top-product-row"
                  >

                    <div
                      className={`top-product-rank ${
                        index < 3 ? 'top3' : ''
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="top-product-info">

                      <div className="top-product-name">
                        {product?.name}
                      </div>

                      <div className="top-product-units">
                        {formatNumber(units)} units sold
                      </div>

                    </div>

                    {trend != null && (
                      <div
                        className={`top-product-trend ${
                          trendDown ? 'down' : 'up'
                        }`}
                      >
                        {trendDown ? (
                          <ArrowDownRight size={13} />
                        ) : (
                          <ArrowUpRight size={13} />
                        )}
                        {trend}
                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>

        </div>


        {/* LOW STOCK */}

        <div className="card">

          <div className="card-header">

            <div>

              <div className="section-title">
                Low Stock Alerts
              </div>

              <div className="section-subtitle">
                Products requiring attention.
              </div>

            </div>

          </div>

          <div>

            {lowStockProducts.length === 0 ? (
              <div className="empty-state">
                No low-stock alerts. Stock risk will be calculated after products and sales history are added.
              </div>
            ) : lowStockProducts.map(
              (product, index) => {

                const reorderPoint =
                  Number(
                    product.reorderPoint || 0
                  );

                const stock =
                  Number(
                    product.stock || 0
                  );

                const percentage =
                  reorderPoint > 0
                    ? Math.min(
                        100,
                        Math.max(
                          4,
                          (stock / reorderPoint) * 100
                        )
                      )
                    : 10;

                const level =
                  product.risk === 'High'
                    ? 'critical'
                    : product.risk === 'Medium'
                      ? 'medium'
                      : 'low';

                return (
                  <div
                    key={
                      product.id ??
                      product.name ??
                      index
                    }
                    className="low-stock-row"
                  >

                    <div className="low-stock-info">

                      <div className="low-stock-name">
                        {product.name}
                      </div>

                      <div className="low-stock-detail">

                        <span>
                          Stock: {formatNumber(stock)}
                        </span>

                        <span>
                          Reorder: {formatNumber(reorderPoint)}
                        </span>

                      </div>

                      <div className="low-stock-bar">

                        <div
                          className={`low-stock-bar-fill ${level}`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>

                    <span
                      className={`badge badge-${
                        level === 'critical'
                          ? 'danger'
                          : level === 'medium'
                            ? 'warning'
                            : 'success'
                      }`}
                    >
                      {product.risk === 'High'
                        ? 'Critical'
                        : product.risk === 'Medium'
                          ? 'Attention'
                          : 'Healthy'}
                    </span>

                  </div>
                );
              }
            )}

          </div>

        </div>

      </div>


      {/* =================================================
          INVENTORY HEALTH
      ================================================= */}

      <div className="section-spacing">

        <div className="section-title">
          Inventory Health
        </div>

        <div className="section-subtitle">
          Current stock distribution across{' '}
          {formatNumber(totalProducts)} products.
        </div>

        <div className="card">

          <div className="grid-2">

            <div
              style={{
                position: 'relative',
                minHeight: 280,
              }}
            >

              <ResponsiveContainer
                width="100%"
                height={280}
              >

                <PieChart>

                  <Pie
                    data={healthData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={4}
                  >

                    {healthData.map(
                      (entry, index) => (
                        <Cell
                          key={`health-${index}`}
                          fill={
                            index === 0
                              ? '#16a34a'
                              : index === 1
                                ? '#f59e0b'
                                : '#dc2626'
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip />

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

                <div className="donut-center-value">
                  {formatNumber(totalProducts)}
                </div>

                <div className="donut-center-label">
                  Products
                </div>

              </div>

            </div>


            <div className="health-summary">

              <div className="health-summary-row">

                <div className="health-summary-label">

                  <span className="status-dot success" />

                  Healthy Stock

                </div>

                <div className="health-summary-value">
                  {healthy}
                </div>

              </div>


              <div className="health-summary-row">

                <div className="health-summary-label">

                  <span className="status-dot warning" />

                  Attention

                </div>

                <div className="health-summary-value">
                  {attention}
                </div>

              </div>


              <div className="health-summary-row">

                <div className="health-summary-label">

                  <span className="status-dot danger" />

                  Critical

                </div>

                <div className="health-summary-value">
                  {critical}
                </div>

              </div>


              <div className="health-summary-row">

                <div className="health-summary-label">
                  Total Products
                </div>

                <div className="health-summary-value">
                  {totalProducts}
                </div>

              </div>


              <div className="health-summary-row">

                <div className="health-summary-label">
                  Low Stock
                </div>

                <div className="health-summary-value">
                  {lowStock}
                </div>

              </div>


              <div className="health-summary-row">

                <div className="health-summary-label">
                  Recommended Units
                </div>

                <div className="health-summary-value">
                  {formatNumber(recommendedUnits)}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          REORDER RECOMMENDATIONS
      ================================================= */}

      <div className="section-spacing">

        <div className="section-title">
          Reorder Recommendations
        </div>

        <div className="section-subtitle">
          Products that may need replenishment
          based on expected demand and stock levels.
        </div>

        <div className="card">

          <div className="table-wrap">

            <table className="mini-rec-table">

              <thead>

                <tr>

                  <th>Product</th>
                  <th>Stock</th>
                  <th>Daily Demand</th>
                  <th>Reorder Point</th>
                  <th>Risk</th>
                  <th>Recommended</th>
                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {displayedRecommendations.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      No reorder recommendations yet. Add products and record sales to calculate replenishment needs.
                    </td>
                  </tr>
                ) : displayedRecommendations.map(
                  (product, index) => {

                    const risk =
                      product.risk;

                    const riskClass =
                      risk === 'High'
                        ? 'danger'
                        : risk === 'Medium'
                          ? 'warning'
                          : 'success';

                    return (
                      <tr
                        key={
                          product.id ??
                          product.name ??
                          index
                        }
                      >

                        <td>
                          <strong>
                            {product.name}
                          </strong>
                        </td>

                        <td>
                          {formatNumber(product.stock)}
                        </td>

                        <td>
                          {formatNumber(
                            product.predictedDemand
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            product.reorderPoint
                          )}
                        </td>

                        <td>

                          <span
                            className={`badge badge-${riskClass}`}
                          >
                            {risk}
                          </span>

                        </td>

                        <td>
                          <strong>
                            {formatNumber(
                              product.recommendedQty
                            )}
                          </strong>
                        </td>

                        <td>

                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                          >
                            Review
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}
