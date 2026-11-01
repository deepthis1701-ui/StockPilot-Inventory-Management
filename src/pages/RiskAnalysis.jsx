import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingDown,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getInventory } from '../services/api.js';
import { PRODUCT_CATALOG } from '../data/productCatalog.js';

const getLeadTime = (category = '') => {
  const value = String(category).toLowerCase();

  if (
    value.includes('fresh') ||
    value.includes('dairy') ||
    value.includes('meat') ||
    value.includes('seafood')
  ) {
    return 2;
  }

  if (
    value.includes('rice') ||
    value.includes('grain') ||
    value.includes('pulse') ||
    value.includes('flour') ||
    value.includes('dal')
  ) {
    return 4;
  }

  if (
    value.includes('household') ||
    value.includes('personal care')
  ) {
    return 5;
  }

  return 3;
};

/*
  IMPORTANT:
  Risk is NOT calculated here.

  The API already provides the business risk:
  High   -> Critical
  Medium -> Attention
  Low    -> Healthy

  This page only displays that value.
*/

const normalizeProduct = (product, index = 0) => {
  const name =
    product?.name ||
    product?.product_name ||
    product?.productName ||
    `Product ${index + 1}`;

  const category =
    product?.category ||
    product?.product_category ||
    'General';

  const currentStock = Number(
    product?.current_stock ??
      product?.currentStock ??
      product?.stock ??
      0
  );

  const predictedDemand = Number(
    product?.predicted_daily_demand ??
      product?.predictedDailyDemand ??
      product?.predictedDemand ??
      product?.daily_demand ??
      product?.dailyDemand ??
      product?.demand ??
      0
  );

  const leadTime =
    Number(
      product?.lead_time ??
        product?.leadTime
    ) ||
    getLeadTime(category);

  const safetyStock =
    Number(
      product?.safety_stock ??
        product?.safetyStock
    ) ||
    Math.ceil(predictedDemand * 1.5);

  const reorderPoint =
    Number(
      product?.reorder_point ??
        product?.reorderPoint
    ) ||
    Math.ceil(
      predictedDemand * leadTime +
        safetyStock
    );

  const recommendedQty = Math.max(
    0,
    Number(
      product?.recommended_order_quantity ??
        product?.recommendedOrderQuantity ??
        product?.recommendedQty ??
        reorderPoint - currentStock
    )
  );

  const daysCoverage =
    predictedDemand > 0
      ? Number(
          (
            currentStock /
            predictedDemand
          ).toFixed(1)
        )
      : 999;

  const leadTimeDemand = Math.ceil(
    predictedDemand * leadTime
  );

  /*
    THIS IS THE MAIN FIX.

    Always take risk from API.

    Never recalculate risk using stock/demand.
  */
  const risk =
    product?.risk === 'High' ||
    product?.risk === 'Medium' ||
    product?.risk === 'Low'
      ? product.risk
      : 'Low';

  return {
    id:
      product?.id ||
      product?.product_id ||
      product?.productId ||
      `product-${index + 1}`,

    name,
    category,

    currentStock,
    predictedDemand,

    leadTime,
    safetyStock,
    reorderPoint,
    recommendedQty,

    daysCoverage,
    leadTimeDemand,

    risk,
  };
};

const extractProducts = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.products)) {
    return response.products;
  }

  if (Array.isArray(response?.inventory)) {
    return response.inventory;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
};

/*
  Catalog fallback.

  This is only used if the API returns nothing.
  It does NOT invent risk values.

  Because this fallback does not have API risk,
  all fallback products are treated as Healthy.
*/
const buildCatalogProducts = () => {
  return Object.entries(PRODUCT_CATALOG).map(
    ([id, product], index) => {
      const name =
        product?.name ||
        product?.product_name ||
        product?.productName ||
        `Product ${index + 1}`;

      const category =
        product?.category ||
        product?.product_category ||
        'General';

      const predictedDailyDemand =
        Number(
          product?.predicted_daily_demand
        ) ||
        Number(
          product?.predictedDailyDemand
        ) ||
        Number(
          product?.predictedDemand
        ) ||
        Number(
          product?.daily_demand
        ) ||
        Number(product?.demand) ||
        10;

      const leadTime =
        Number(product?.lead_time) ||
        Number(product?.leadTime) ||
        getLeadTime(category);

      const safetyStock =
        Number(product?.safety_stock) ||
        Number(product?.safetyStock) ||
        Math.ceil(
          predictedDailyDemand * 1.5
        );

      const reorderPoint =
        Number(product?.reorder_point) ||
        Number(product?.reorderPoint) ||
        Math.ceil(
          predictedDailyDemand *
            leadTime +
            safetyStock
        );

      const currentStock =
        Number(product?.current_stock) ||
        Number(product?.currentStock) ||
        Number(product?.stock) ||
        reorderPoint + 20;

      return normalizeProduct(
        {
          id,
          name,
          category,
          current_stock: currentStock,
          predicted_daily_demand:
            predictedDailyDemand,
          lead_time: leadTime,
          safety_stock: safetyStock,
          reorder_point: reorderPoint,

          /*
            Fallback has no API risk.
            Keep it Healthy instead of recalculating.
          */
          risk: 'Low',
        },
        index
      );
    }
  );
};

const getRiskLabel = (risk) => {
  if (risk === 'High') {
    return 'Critical';
  }

  if (risk === 'Medium') {
    return 'Attention';
  }

  return 'Healthy';
};

const getRiskClass = (risk) => {
  if (risk === 'High') {
    return 'critical';
  }

  if (risk === 'Medium') {
    return 'attention';
  }

  return 'healthy';
};

const getAction = (product) => {
  if (
    product.risk === 'High' &&
    product.recommendedQty > 0
  ) {
    return 'Order Now';
  }

  if (
    product.risk === 'Medium' &&
    product.recommendedQty > 0
  ) {
    return 'Review';
  }

  return 'View';
};

const getRiskRank = (risk) => {
  if (risk === 'High') return 3;
  if (risk === 'Medium') return 2;
  return 1;
};

export default function RiskAnalysis() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] =
    useState('All');

  const [categoryFilter, setCategoryFilter] =
    useState('All');

  const [sortField, setSortField] =
    useState('risk');

  const [sortDirection, setSortDirection] =
    useState('desc');

  const [showFilters, setShowFilters] =
    useState(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getInventory();

      const apiProducts =
        extractProducts(response);

      if (apiProducts.length > 0) {
        /*
          IMPORTANT:
          API risk is preserved here.
        */
        const normalized =
          apiProducts.map(
            (product, index) =>
              normalizeProduct(
                product,
                index
              )
          );

        setProducts(normalized);
      } else {
        setProducts(
          buildCatalogProducts()
        );

        setError(
          'Live inventory data is unavailable. Showing catalog-based inventory analysis.'
        );
      }
    } catch (err) {
      console.error(
        'Risk Analysis inventory error:',
        err
      );

      setProducts(
        buildCatalogProducts()
      );

      setError(
        'Live inventory data is unavailable. Showing catalog-based inventory analysis.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const categories = useMemo(() => {
    const values = products
      .map(
        (product) =>
          product.category
      )
      .filter(Boolean);

    return [
      'All',
      ...new Set(values),
    ];
  }, [products]);

  const summary = useMemo(() => {
    const high =
      products.filter(
        (product) =>
          product.risk === 'High'
      ).length;

    const medium =
      products.filter(
        (product) =>
          product.risk === 'Medium'
      ).length;

    const low =
      products.filter(
        (product) =>
          product.risk === 'Low'
      ).length;

    const recommendedUnits =
      products.reduce(
        (total, product) =>
          total +
          product.recommendedQty,
        0
      );

    const safeInventory =
      products.reduce(
        (total, product) =>
          total +
          product.reorderPoint,
        0
      );

    return {
      high,
      medium,
      low,
      recommendedUnits,
      safeInventory,
    };
  }, [products]);

  const highestRiskProducts =
    useMemo(() => {
      return [...products]
        .sort((a, b) => {
          const riskDifference =
            getRiskRank(b.risk) -
            getRiskRank(a.risk);

          if (riskDifference !== 0) {
            return riskDifference;
          }

          return (
            a.daysCoverage -
            b.daysCoverage
          );
        })
        .slice(0, 6);
    }, [products]);

  const filteredProducts =
    useMemo(() => {
      let result = [...products];

      const searchValue =
        search
          .trim()
          .toLowerCase();

      if (searchValue) {
        result = result.filter(
          (product) =>
            product.name
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            product.category
              .toLowerCase()
              .includes(
                searchValue
              )
        );
      }

      if (riskFilter !== 'All') {
        result =
          result.filter(
            (product) =>
              product.risk ===
              riskFilter
          );
      }

      if (
        categoryFilter !==
        'All'
      ) {
        result =
          result.filter(
            (product) =>
              product.category ===
              categoryFilter
          );
      }

      result.sort((a, b) => {
        let first;
        let second;

        if (
          sortField === 'risk'
        ) {
          first =
            getRiskRank(
              a.risk
            );

          second =
            getRiskRank(
              b.risk
            );
        } else if (
          sortField ===
          'coverage'
        ) {
          first =
            a.daysCoverage;

          second =
            b.daysCoverage;
        } else if (
          sortField ===
          'stock'
        ) {
          first =
            a.currentStock;

          second =
            b.currentStock;
        } else if (
          sortField ===
          'demand'
        ) {
          first =
            a.predictedDemand;

          second =
            b.predictedDemand;
        } else if (
          sortField ===
          'reorder'
        ) {
          first =
            a.reorderPoint;

          second =
            b.reorderPoint;
        } else if (
          sortField ===
          'recommended'
        ) {
          first =
            a.recommendedQty;

          second =
            b.recommendedQty;
        } else {
          first =
            a.name.toLowerCase();

          second =
            b.name.toLowerCase();
        }

        if (first < second) {
          return sortDirection ===
            'asc'
            ? -1
            : 1;
        }

        if (first > second) {
          return sortDirection ===
            'asc'
            ? 1
            : -1;
        }

        return 0;
      });

      return result;
    }, [
      products,
      search,
      riskFilter,
      categoryFilter,
      sortField,
      sortDirection,
    ]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(
        (current) =>
          current === 'asc'
            ? 'desc'
            : 'asc'
      );
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (
    field
  ) => {
    if (sortField !== field) {
      return null;
    }

    return sortDirection ===
      'asc' ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  const clearFilters = () => {
    setSearch('');
    setRiskFilter('All');
    setCategoryFilter('All');
  };

  if (loading) {
    return (
      <div className="risk-page">
        <div className="risk-loading">
          <RefreshCw
            size={24}
            className="spin"
          />

          <span>
            Loading inventory risk
            analysis...
          </span>
        </div>

        <style>{`
          .risk-page {
            min-height: 100vh;
            padding: 28px;
            background: #f8fafc;
          }

          .risk-loading {
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            color: #64748b;
            font-size: 15px;
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="risk-page">
      <div className="risk-container">

        {/* HEADER */}
        <div className="page-header">
          <div>
            <div className="breadcrumb">
              Inventory
              <span>/</span>
              Risk Analysis
            </div>

            <h1>
              Inventory Risk Analysis
            </h1>

            <p>
              Identify products that may
              run out of stock and
              prioritize replenishment
              decisions.
            </p>
          </div>

          <button
            className="refresh-btn"
            onClick={
              loadInventory
            }
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* NOTICE */}
        {error && (
          <div className="notice">
            <AlertTriangle size={18} />

            <div>
              <strong>
                Inventory data notice
              </strong>

              <span>
                {error}
              </span>
            </div>
          </div>
        )}

        {/* SUMMARY */}
        <div className="summary-grid">

          <div className="summary-card critical-card">
            <div className="summary-icon">
              <XCircle size={21} />
            </div>

            <div>
              <span>
                Critical Risk
              </span>

              <strong>
                {summary.high}
              </strong>

              <small>
                Immediate attention
              </small>
            </div>
          </div>

          <div className="summary-card attention-card">
            <div className="summary-icon">
              <AlertTriangle size={21} />
            </div>

            <div>
              <span>
                Attention Needed
              </span>

              <strong>
                {summary.medium}
              </strong>

              <small>
                Review stock levels
              </small>
            </div>
          </div>

          <div className="summary-card healthy-card">
            <div className="summary-icon">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <span>
                Healthy Stock
              </span>

              <strong>
                {summary.low}
              </strong>

              <small>
                No immediate action
              </small>
            </div>
          </div>

          <div className="summary-card order-card">
            <div className="summary-icon">
              <ShoppingCart size={21} />
            </div>

            <div>
              <span>
                Recommended Units
              </span>

              <strong>
                {summary.recommendedUnits.toLocaleString()}
              </strong>

              <small>
                Across current inventory
              </small>
            </div>
          </div>

        </div>

        {/* RISK OVERVIEW */}
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2>
                Inventory Risk Overview
              </h2>

              <p>
                Current stock compared with
                expected demand and
                replenishment requirements.
              </p>
            </div>

            <div className="risk-legend">
              <span>
                <i className="dot critical" />
                Critical
              </span>

              <span>
                <i className="dot attention" />
                Attention
              </span>

              <span>
                <i className="dot healthy" />
                Healthy
              </span>
            </div>
          </div>

          <div className="overview-grid">

            <div className="overview-item">
              <div className="overview-top">
                <span>
                  Critical
                </span>

                <strong>
                  {summary.high}
                </strong>
              </div>

              <div className="progress">
                <div
                  className="progress-fill critical"
                  style={{
                    width: `${
                      products.length
                        ? (summary.high /
                            products.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <small>
                Stock may not cover
                lead-time demand
              </small>
            </div>

            <div className="overview-item">
              <div className="overview-top">
                <span>
                  Attention
                </span>

                <strong>
                  {summary.medium}
                </strong>
              </div>

              <div className="progress">
                <div
                  className="progress-fill attention"
                  style={{
                    width: `${
                      products.length
                        ? (summary.medium /
                            products.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <small>
                Stock is approaching
                reorder level
              </small>
            </div>

            <div className="overview-item">
              <div className="overview-top">
                <span>
                  Healthy
                </span>

                <strong>
                  {summary.low}
                </strong>
              </div>

              <div className="progress">
                <div
                  className="progress-fill healthy"
                  style={{
                    width: `${
                      products.length
                        ? (summary.low /
                            products.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <small>
                Current inventory has
                sufficient coverage
              </small>
            </div>

          </div>
        </section>

        {/* PLANNING */}
        <section className="planning-card">
          <div className="planning-icon">
            <Package size={21} />
          </div>

          <div className="planning-content">
            <strong>
              Replenishment Planning
            </strong>

            <span>
              {summary.recommendedUnits.toLocaleString()}{' '}
              units are currently
              recommended across the
              inventory.
            </span>
          </div>

          <div className="planning-value">
            <small>
              Target inventory
            </small>

            <strong>
              {summary.safeInventory.toLocaleString()}
            </strong>
          </div>
        </section>

        {/* HIGHEST RISK */}
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2>
                Highest Risk Products
              </h2>

              <p>
                Products requiring the
                closest attention right now.
              </p>
            </div>

            <button
              className="text-btn"
              onClick={() =>
                setRiskFilter('High')
              }
            >
              View all critical
            </button>
          </div>

          {highestRiskProducts.length ===
          0 ? (
            <div className="empty-state">
              <CheckCircle2 size={30} />

              <strong>
                No critical inventory
                risks
              </strong>

              <span>
                Current inventory is in a
                healthy position.
              </span>
            </div>
          ) : (
            <div className="risk-product-grid">
              {highestRiskProducts.map(
                (product) => {
                  const riskClass =
                    getRiskClass(
                      product.risk
                    );

                  return (
                    <div
                      key={
                        product.id
                      }
                      className="risk-product"
                    >
                      <div className="risk-product-top">
                        <div>
                          <strong>
                            {
                              product.name
                            }
                          </strong>

                          <span>
                            {
                              product.category
                            }
                          </span>
                        </div>

                        <span
                          className={`risk-badge ${riskClass}`}
                        >
                          {getRiskLabel(
                            product.risk
                          )}
                        </span>
                      </div>

                      <div className="risk-product-stats">
                        <div>
                          <small>
                            Stock
                          </small>

                          <strong>
                            {
                              product.currentStock
                            }
                          </strong>
                        </div>

                        <div>
                          <small>
                            Daily demand
                          </small>

                          <strong>
                            {
                              product.predictedDemand
                            }
                          </strong>
                        </div>

                        <div>
                          <small>
                            Coverage
                          </small>

                          <strong>
                            {
                              product.daysCoverage
                            }d
                          </strong>
                        </div>

                        <div>
                          <small>
                            Reorder
                          </small>

                          <strong>
                            {
                              product.reorderPoint
                            }
                          </strong>
                        </div>
                      </div>

                      <button
                        className="product-action"
                        onClick={() => {
                          if (
                            product.recommendedQty >
                            0
                          ) {
                            navigate(
                              '/reorder'
                            );
                          } else {
                            navigate(
                              '/inventory'
                            );
                          }
                        }}
                      >
                        {getAction(
                          product
                        )}
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* PRODUCT DETAILS */}
        <section className="section-card">

          <div className="section-header">
            <div>
              <h2>
                Product Risk Details
              </h2>

              <p>
                Review stock coverage and
                replenishment requirements
                by product.
              </p>
            </div>

            <button
              className="filter-toggle"
              onClick={() =>
                setShowFilters(
                  (value) => !value
                )
              }
            >
              <Search size={16} />
              Filters

              {showFilters ? (
                <ChevronUp size={15} />
              ) : (
                <ChevronDown size={15} />
              )}
            </button>
          </div>

          {/* FILTERS */}
          {showFilters && (
            <div className="filter-panel">

              <div className="search-box">
                <Search size={17} />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search products or categories..."
                />
              </div>

              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Risk Levels
                </option>

                <option value="High">
                  Critical
                </option>

                <option value="Medium">
                  Attention
                </option>

                <option value="Low">
                  Healthy
                </option>
              </select>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
              >
                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category ===
                      'All'
                        ? 'All Categories'
                        : category}
                    </option>
                  )
                )}
              </select>

              <button
                className="clear-btn"
                onClick={
                  clearFilters
                }
              >
                Clear
              </button>
            </div>
          )}

          {!showFilters && (
            <div className="inline-search">
              <Search size={17} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search products or categories..."
              />
            </div>
          )}

          {/* TABLE */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>

                  <th
                    onClick={() =>
                      handleSort(
                        'name'
                      )
                    }
                  >
                    <span>
                      Product
                      {renderSortIcon(
                        'name'
                      )}
                    </span>
                  </th>

                  <th>
                    Category
                  </th>

                  <th
                    onClick={() =>
                      handleSort(
                        'stock'
                      )
                    }
                  >
                    <span>
                      Current Stock
                      {renderSortIcon(
                        'stock'
                      )}
                    </span>
                  </th>

                  <th
                    onClick={() =>
                      handleSort(
                        'demand'
                      )
                    }
                  >
                    <span>
                      Daily Demand
                      {renderSortIcon(
                        'demand'
                      )}
                    </span>
                  </th>

                  <th
                    onClick={() =>
                      handleSort(
                        'coverage'
                      )
                    }
                  >
                    <span>
                      Coverage
                      {renderSortIcon(
                        'coverage'
                      )}
                    </span>
                  </th>

                  <th>
                    Risk
                  </th>

                  <th
                    onClick={() =>
                      handleSort(
                        'reorder'
                      )
                    }
                  >
                    <span>
                      Reorder Point
                      {renderSortIcon(
                        'reorder'
                      )}
                    </span>
                  </th>

                  <th
                    onClick={() =>
                      handleSort(
                        'recommended'
                      )
                    }
                  >
                    <span>
                      Recommended
                      {renderSortIcon(
                        'recommended'
                      )}
                    </span>
                  </th>

                  <th>
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>
                {filteredProducts.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="table-empty"
                    >
                      <Package
                        size={28}
                      />

                      <strong>
                        No products found
                      </strong>

                      <span>
                        Try changing your
                        search or filters.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(
                    (product) => {
                      const riskClass =
                        getRiskClass(
                          product.risk
                        );

                      const action =
                        getAction(
                          product
                        );

                      return (
                        <tr
                          key={
                            product.id
                          }
                        >
                          <td>
                            <div className="product-name-cell">
                              <strong>
                                {
                                  product.name
                                }
                              </strong>

                              <small>
                                Lead time:{' '}
                                {
                                  product.leadTime
                                }{' '}
                                days
                              </small>
                            </div>
                          </td>

                          <td>
                            <span className="category-text">
                              {
                                product.category
                              }
                            </span>
                          </td>

                          <td>
                            <strong>
                              {
                                product.currentStock
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              product.predictedDemand
                            }
                          </td>

                          <td>
                            <div
                              className={`coverage-value ${riskClass}`}
                            >
                              {
                                product.daysCoverage
                              }{' '}
                              days
                            </div>
                          </td>

                          <td>
                            <span
                              className={`risk-badge ${riskClass}`}
                            >
                              {product.risk ===
                              'High' ? (
                                <XCircle
                                  size={13}
                                />
                              ) : product.risk ===
                                'Medium' ? (
                                <AlertTriangle
                                  size={13}
                                />
                              ) : (
                                <CheckCircle2
                                  size={13}
                                />
                              )}

                              {getRiskLabel(
                                product.risk
                              )}
                            </span>
                          </td>

                          <td>
                            {
                              product.reorderPoint
                            }
                          </td>

                          <td>
                            {product.recommendedQty >
                            0 ? (
                              <strong className="recommended-value">
                                +
                                {
                                  product.recommendedQty
                                }
                              </strong>
                            ) : (
                              <span className="no-order">
                                —
                              </span>
                            )}
                          </td>

                          <td>
                            <button
                              className={`table-action ${riskClass}`}
                              onClick={() => {
                                if (
                                  action ===
                                    'Order Now' ||
                                  action ===
                                    'Review'
                                ) {
                                  navigate(
                                    '/reorder'
                                  );
                                } else {
                                  navigate(
                                    '/inventory'
                                  );
                                }
                              }}
                            >
                              {action}
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              Showing{' '}
              <strong>
                {
                  filteredProducts.length
                }
              </strong>{' '}
              of{' '}
              <strong>
                {products.length}
              </strong>{' '}
              products
            </span>

            <span>
              Critical:{' '}
              <strong className="critical-text">
                {summary.high}
              </strong>

              {' · '}

              Attention:{' '}
              <strong className="attention-text">
                {summary.medium}
              </strong>

              {' · '}

              Healthy:{' '}
              <strong className="healthy-text">
                {summary.low}
              </strong>
            </span>
          </div>

        </section>

        {/* EXPLANATION */}
        <section className="explanation-card">

          <div className="explanation-icon">
            <TrendingDown size={21} />
          </div>

          <div>
            <strong>
              How inventory risk is calculated
            </strong>

            <p>
              Risk is based on available stock,
              expected daily demand, supplier
              lead time and the target reorder
              level. Products that may not have
              enough stock to cover their
              lead-time demand are marked
              Critical. Products approaching
              their reorder level are marked
              Attention.
            </p>
          </div>

        </section>

      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .risk-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 28px;
          color: #172033;
        }

        .risk-container {
          max-width: 1500px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .breadcrumb {
          display: flex;
          gap: 8px;
          color: #94a3b8;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 29px;
          line-height: 1.2;
          font-weight: 700;
          color: #172033;
        }

        .page-header p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .refresh-btn {
          border: 1px solid #dbe2ea;
          background: white;
          color: #334155;
          height: 40px;
          padding: 0 15px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .refresh-btn:hover {
          background: #f8fafc;
        }

        .refresh-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .notice {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
          border-radius: 10px;
          padding: 12px 15px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 20px;
        }

        .notice div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .notice strong {
          font-size: 13px;
        }

        .notice span {
          font-size: 12px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .summary-card {
          background: white;
          border: 1px solid #e5eaf0;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          gap: 14px;
          min-height: 116px;
        }

        .summary-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .critical-card .summary-icon {
          background: #fee2e2;
          color: #dc2626;
        }

        .attention-card .summary-icon {
          background: #fef3c7;
          color: #d97706;
        }

        .healthy-card .summary-icon {
          background: #dcfce7;
          color: #16a34a;
        }

        .order-card .summary-icon {
          background: #e0e7ff;
          color: #4f46e5;
        }

        .summary-card > div:last-child {
          display: flex;
          flex-direction: column;
        }

        .summary-card span {
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .summary-card strong {
          margin-top: 4px;
          color: #172033;
          font-size: 27px;
          line-height: 1.1;
        }

        .summary-card small {
          margin-top: 5px;
          color: #94a3b8;
          font-size: 11px;
        }

        .section-card {
          background: white;
          border: 1px solid #e5eaf0;
          border-radius: 12px;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .section-header {
          padding: 20px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid #edf1f5;
        }

        .section-header h2 {
          margin: 0;
          font-size: 17px;
          color: #172033;
        }

        .section-header p {
          margin: 5px 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .risk-legend {
          display: flex;
          gap: 18px;
          font-size: 12px;
          color: #64748b;
        }

        .risk-legend span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .dot.critical {
          background: #dc2626;
        }

        .dot.attention {
          background: #d97706;
        }

        .dot.healthy {
          background: #16a34a;
        }

        .overview-grid {
          padding: 20px 22px;
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .overview-item {
          padding: 15px;
          border: 1px solid #edf1f5;
          border-radius: 10px;
        }

        .overview-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .overview-top span {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .overview-top strong {
          font-size: 20px;
          color: #172033;
        }

        .progress {
          height: 7px;
          background: #eef2f6;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 9px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 20px;
        }

        .progress-fill.critical {
          background: #dc2626;
        }

        .progress-fill.attention {
          background: #d97706;
        }

        .progress-fill.healthy {
          background: #16a34a;
        }

        .overview-item small {
          font-size: 11px;
          color: #94a3b8;
        }

        .planning-card {
          background: #172033;
          color: white;
          border-radius: 12px;
          padding: 19px 22px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }

        .planning-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(255,255,255,.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .planning-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .planning-content strong {
          font-size: 14px;
        }

        .planning-content span {
          font-size: 12px;
          color: #cbd5e1;
        }

        .planning-value {
          text-align: right;
        }

        .planning-value small {
          display: block;
          color: #94a3b8;
          font-size: 11px;
        }

        .planning-value strong {
          font-size: 23px;
        }

        .text-btn {
          border: 0;
          background: transparent;
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .risk-product-grid {
          padding: 20px 22px;
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .risk-product {
          border: 1px solid #edf1f5;
          border-radius: 10px;
          padding: 15px;
        }

        .risk-product-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 16px;
        }

        .risk-product-top > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .risk-product-top strong {
          font-size: 13px;
          color: #172033;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .risk-product-top span:not(.risk-badge) {
          font-size: 11px;
          color: #94a3b8;
        }

        .risk-product-stats {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }

        .risk-product-stats div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .risk-product-stats small {
          color: #94a3b8;
          font-size: 10px;
        }

        .risk-product-stats strong {
          color: #334155;
          font-size: 13px;
        }

        .risk-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          white-space: nowrap;
        }

        .risk-badge.critical {
          color: #b91c1c;
          background: #fee2e2;
        }

        .risk-badge.attention {
          color: #b45309;
          background: #fef3c7;
        }

        .risk-badge.healthy {
          color: #15803d;
          background: #dcfce7;
        }

        .product-action {
          width: 100%;
          height: 34px;
          border: 1px solid #dbe2ea;
          background: white;
          border-radius: 7px;
          cursor: pointer;
          color: #334155;
          font-size: 11px;
          font-weight: 600;
        }

        .product-action:hover {
          background: #f8fafc;
        }

        .filter-toggle {
          height: 36px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          gap: 7px;
          background: white;
          border: 1px solid #dbe2ea;
          border-radius: 7px;
          color: #475569;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .filter-panel {
          padding: 15px 22px;
          background: #f8fafc;
          border-bottom: 1px solid #edf1f5;
          display: grid;
          grid-template-columns:
            minmax(240px, 1fr)
            180px
            200px
            auto;
          gap: 10px;
        }

        .search-box,
        .inline-search {
          height: 38px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #dbe2ea;
          background: white;
          border-radius: 7px;
          padding: 0 11px;
          color: #94a3b8;
        }

        .inline-search {
          margin: 15px 22px;
        }

        .search-box input,
        .inline-search input {
          border: 0;
          outline: 0;
          width: 100%;
          font-size: 12px;
          color: #334155;
          background: transparent;
        }

        .filter-panel select {
          height: 38px;
          border: 1px solid #dbe2ea;
          border-radius: 7px;
          background: white;
          padding: 0 10px;
          color: #475569;
          font-size: 12px;
          outline: none;
        }

        .clear-btn {
          border: 0;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          padding: 0 10px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        thead {
          background: #f8fafc;
        }

        th {
          padding: 12px 15px;
          text-align: left;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .03em;
          white-space: nowrap;
          border-bottom: 1px solid #edf1f5;
        }

        th > span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        th:not(:nth-child(2)):not(:nth-child(6)):not(:nth-child(9)) {
          cursor: pointer;
        }

        td {
          padding: 13px 15px;
          border-bottom: 1px solid #f0f3f6;
          color: #475569;
          font-size: 12px;
          white-space: nowrap;
        }

        tbody tr:hover {
          background: #fafcff;
        }

        .product-name-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .product-name-cell strong {
          color: #172033;
          font-size: 12px;
        }

        .product-name-cell small {
          color: #94a3b8;
          font-size: 10px;
        }

        .category-text {
          color: #64748b;
        }

        .coverage-value {
          font-weight: 700;
        }

        .coverage-value.critical {
          color: #dc2626;
        }

        .coverage-value.attention {
          color: #d97706;
        }

        .coverage-value.healthy {
          color: #16a34a;
        }

        .recommended-value {
          color: #dc2626;
        }

        .no-order {
          color: #94a3b8;
        }

        .table-action {
          height: 30px;
          padding: 0 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          border: 1px solid #dbe2ea;
          background: white;
        }

        .table-action.critical {
          color: #b91c1c;
          border-color: #fecaca;
          background: #fffafa;
        }

        .table-action.attention {
          color: #b45309;
          border-color: #fde68a;
          background: #fffdf7;
        }

        .table-action.healthy {
          color: #15803d;
          border-color: #bbf7d0;
          background: #f7fff9;
        }

        .table-empty {
          height: 220px;
          text-align: center;
          color: #94a3b8;
        }

        .table-empty svg {
          display: block;
          margin: 0 auto 8px;
        }

        .table-empty strong,
        .table-empty span {
          display: block;
        }

        .table-empty strong {
          color: #475569;
          margin-bottom: 4px;
        }

        .table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 22px;
          color: #94a3b8;
          font-size: 11px;
          background: #fafbfc;
        }

        .table-footer strong {
          color: #475569;
        }

        .critical-text {
          color: #dc2626 !important;
        }

        .attention-text {
          color: #d97706 !important;
        }

        .healthy-text {
          color: #16a34a !important;
        }

        .empty-state {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #16a34a;
        }

        .empty-state strong {
          color: #334155;
          font-size: 14px;
        }

        .empty-state span {
          color: #94a3b8;
          font-size: 12px;
        }

        .explanation-card {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          background: white;
          border: 1px solid #e5eaf0;
          border-radius: 12px;
          padding: 18px 20px;
        }

        .explanation-icon {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .explanation-card strong {
          display: block;
          color: #334155;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .explanation-card p {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
          max-width: 1000px;
        }

        @media (max-width: 1100px) {
          .summary-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .risk-product-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .filter-panel {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (max-width: 760px) {
          .risk-page {
            padding: 16px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .summary-grid,
          .overview-grid,
          .risk-product-grid {
            grid-template-columns: 1fr;
          }

          .planning-card {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .planning-value {
            width: 100%;
            text-align: left;
          }

          .section-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .risk-legend {
            flex-wrap: wrap;
          }

          .filter-panel {
            grid-template-columns: 1fr;
          }

          .table-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
}