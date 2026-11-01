import React, { useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  ShoppingCart,
  AlertTriangle,
  Package,
  CheckCircle2,
  Clock3,
  Eye,
  Check,
  XCircle,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
  Boxes,
} from 'lucide-react';

/* =========================================================
   REORDER DATA
========================================================= */

const INITIAL_PRODUCTS = [
  {
    name: 'Chana Dal',
    category: 'Pulses',
    stock: 75,
    demand: 22,
    safety: 30,
    leadTime: 4,
  },
  {
    name: 'Garam Masala',
    category: 'Spices',
    stock: 42,
    demand: 9,
    safety: 15,
    leadTime: 5,
  },
  {
    name: 'Instant Noodles',
    category: 'Instant Foods',
    stock: 190,
    demand: 24,
    safety: 35,
    leadTime: 3,
  },
  {
    name: 'Fresh Onions',
    category: 'Vegetables',
    stock: 65,
    demand: 26,
    safety: 35,
    leadTime: 2,
  },
  {
    name: 'Toor Dal',
    category: 'Pulses',
    stock: 88,
    demand: 18,
    safety: 28,
    leadTime: 4,
  },
  {
    name: 'Wheat Flour 5kg',
    category: 'Grains',
    stock: 145,
    demand: 16,
    safety: 25,
    leadTime: 4,
  },
  {
    name: 'Butter Cookies',
    category: 'Biscuits',
    stock: 125,
    demand: 12,
    safety: 20,
    leadTime: 4,
  },
  {
    name: 'Premium Dry Fruits',
    category: 'Dry Fruits',
    stock: 38,
    demand: 7,
    safety: 12,
    leadTime: 5,
  },
  {
    name: 'Green Chutney',
    category: 'Sauces',
    stock: 35,
    demand: 10,
    safety: 16,
    leadTime: 2,
  },
  {
    name: 'Energy Drink',
    category: 'Beverages',
    stock: 92,
    demand: 15,
    safety: 25,
    leadTime: 4,
  },
  {
    name: 'Salted Crackers',
    category: 'Biscuits',
    stock: 105,
    demand: 11,
    safety: 20,
    leadTime: 4,
  },
  {
    name: 'Mayonnaise',
    category: 'Sauces',
    stock: 58,
    demand: 10,
    safety: 18,
    leadTime: 5,
  },
  {
    name: 'Chilli Sauce',
    category: 'Sauces',
    stock: 48,
    demand: 8,
    safety: 14,
    leadTime: 4,
  },
  {
    name: 'Soy Sauce',
    category: 'Sauces',
    stock: 55,
    demand: 7,
    safety: 14,
    leadTime: 5,
  },
  {
    name: 'Moong Dal',
    category: 'Pulses',
    stock: 82,
    demand: 17,
    safety: 26,
    leadTime: 4,
  },
  {
    name: 'Fresh Potatoes',
    category: 'Vegetables',
    stock: 92,
    demand: 24,
    safety: 30,
    leadTime: 2,
  },
  {
    name: 'Fresh Oranges',
    category: 'Fruits',
    stock: 70,
    demand: 18,
    safety: 25,
    leadTime: 2,
  },
  {
    name: 'Bath Soap',
    category: 'Personal Care',
    stock: 160,
    demand: 13,
    safety: 25,
    leadTime: 5,
  },
  {
    name: 'Cinnamon',
    category: 'Spices',
    stock: 34,
    demand: 5,
    safety: 10,
    leadTime: 5,
  },
  {
    name: 'Coconut Water',
    category: 'Beverages',
    stock: 45,
    demand: 12,
    safety: 20,
    leadTime: 3,
  },
  {
    name: 'Red Apples',
    category: 'Fruits',
    stock: 55,
    demand: 19,
    safety: 25,
    leadTime: 2,
  },
  {
    name: 'Fresh Mangoes',
    category: 'Fruits',
    stock: 48,
    demand: 17,
    safety: 24,
    leadTime: 2,
  },
  {
    name: 'Basmati Rice 5kg',
    category: 'Grains',
    stock: 320,
    demand: 38,
    safety: 55,
    leadTime: 5,
  },
  {
    name: 'Chilli Powder',
    category: 'Spices',
    stock: 52,
    demand: 8,
    safety: 14,
    leadTime: 5,
  },
  {
    name: 'Cornflakes Cereal',
    category: 'Breakfast',
    stock: 110,
    demand: 13,
    safety: 22,
    leadTime: 4,
  },
  {
    name: 'Mineral Water',
    category: 'Beverages',
    stock: 210,
    demand: 31,
    safety: 45,
    leadTime: 3,
  },
  {
    name: 'Sparkling Soft Drink',
    category: 'Beverages',
    stock: 85,
    demand: 16,
    safety: 25,
    leadTime: 3,
  },
  {
    name: 'Ready-to-Cook Mix',
    category: 'Ready Foods',
    stock: 65,
    demand: 13,
    safety: 20,
    leadTime: 4,
  },
  {
    name: 'Mixed Spice Pack',
    category: 'Spices',
    stock: 47,
    demand: 8,
    safety: 14,
    leadTime: 5,
  },
  {
    name: 'Chicken Breast',
    category: 'Meat',
    stock: 42,
    demand: 18,
    safety: 25,
    leadTime: 2,
  },
  {
    name: 'Mixed Vegetables',
    category: 'Frozen Foods',
    stock: 58,
    demand: 15,
    safety: 23,
    leadTime: 2,
  },
  {
    name: 'Fresh Tomatoes',
    category: 'Vegetables',
    stock: 80,
    demand: 28,
    safety: 35,
    leadTime: 2,
  },
  {
    name: 'Tamarind',
    category: 'Spices',
    stock: 58,
    demand: 7,
    safety: 13,
    leadTime: 5,
  },
  {
    name: 'Granola Bars',
    category: 'Snacks',
    stock: 75,
    demand: 12,
    safety: 20,
    leadTime: 4,
  },
  {
    name: 'Roasted Corn Snacks',
    category: 'Snacks',
    stock: 92,
    demand: 10,
    safety: 18,
    leadTime: 4,
  },
  {
    name: 'Fresh Carrots',
    category: 'Vegetables',
    stock: 50,
    demand: 16,
    safety: 23,
    leadTime: 2,
  },
  {
    name: 'Instant Soup',
    category: 'Instant Foods',
    stock: 66,
    demand: 11,
    safety: 18,
    leadTime: 4,
  },
  {
    name: 'Coconut Milk',
    category: 'Cooking',
    stock: 48,
    demand: 9,
    safety: 16,
    leadTime: 4,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function calculateProduct(product, index) {
  const currentStock = Number(product.stock) || 0;
  const predictedDemand = Number(product.demand) || 0;
  const safetyStock = Number(product.safety) || 0;
  const leadTime = Number(product.leadTime) || 1;

  const reorderPoint = Math.ceil(
    predictedDemand * leadTime + safetyStock
  );

  const daysCoverage =
    predictedDemand > 0
      ? Number((currentStock / predictedDemand).toFixed(1))
      : 999;

  const stockGap = Math.max(0, reorderPoint - currentStock);

  let risk = 'Low';

  if (currentStock <= 0 || daysCoverage <= leadTime) {
    risk = 'High';
  } else if (currentStock <= reorderPoint) {
    risk = 'Medium';
  }

  let action = 'No Action';

  if (risk === 'High') {
    action = 'Order Now';
  } else if (risk === 'Medium' && stockGap > 0) {
    action = 'Review';
  }

  return {
    id: `${product.name}-${index}`,
    ...product,
    currentStock,
    predictedDemand,
    safetyStock,
    leadTime,
    reorderPoint,
    daysCoverage,
    recommendedQty: stockGap,
    risk,
    action,
    reviewed: false,
    dismissed: false,
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function downloadCSV(rows) {
  const headers = [
    'Product',
    'Category',
    'Current Stock',
    'Daily Demand',
    'Days Coverage',
    'Safety Stock',
    'Reorder Point',
    'Risk',
    'Recommended Quantity',
    'Action',
  ];

  const csvRows = rows.map((item) => [
    item.name,
    item.category,
    item.currentStock,
    item.predictedDemand,
    item.daysCoverage,
    item.safetyStock,
    item.reorderPoint,
    item.risk,
    item.recommendedQty,
    item.action,
  ]);

  const csv = [
    headers,
    ...csvRows,
  ]
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'stockpilot-reorder-recommendations.csv';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ReorderRecommendations() {
  const [products, setProducts] = useState(
    INITIAL_PRODUCTS.map(calculateProduct)
  );

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [risk, setRisk] = useState('All Risk');
  const [action, setAction] = useState('All Actions');
  const [sortBy, setSortBy] = useState('priority');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');

  const categories = useMemo(() => {
    return [
      'All Categories',
      ...Array.from(
        new Set(products.map((product) => product.category))
      ).sort(),
    ];
  }, [products]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    const active = products.filter((item) => !item.dismissed);

    const orderNow = active.filter(
      (item) => item.action === 'Order Now'
    );

    const review = active.filter(
      (item) => item.action === 'Review'
    );

    const noAction = active.filter(
      (item) => item.action === 'No Action'
    );

    const reorderUnits = active.reduce(
      (total, item) => total + item.recommendedQty,
      0
    );

    const highestReorder = active.reduce(
      (max, item) =>
        item.recommendedQty > max.recommendedQty ? item : max,
      {
        name: '—',
        recommendedQty: 0,
      }
    );

    const lowestCoverage = active.reduce(
      (min, item) =>
        item.daysCoverage < min.daysCoverage ? item : min,
      active[0] || {
        name: '—',
        daysCoverage: 0,
      }
    );

    const averageCoverage =
      active.length > 0
        ? active.reduce(
            (sum, item) => sum + item.daysCoverage,
            0
          ) / active.length
        : 0;

    return {
      total: active.length,
      orderNow: orderNow.length,
      review: review.length,
      noAction: noAction.length,
      reorderUnits,
      highestReorder,
      lowestCoverage,
      averageCoverage,
    };
  }, [products]);

  /* =========================================================
     FILTER + SORT
  ========================================================= */

  const filteredProducts = useMemo(() => {
    let result = products.filter((item) => !item.dismissed);

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    if (category !== 'All Categories') {
      result = result.filter(
        (item) => item.category === category
      );
    }

    if (risk !== 'All Risk') {
      result = result.filter((item) => item.risk === risk);
    }

    if (action !== 'All Actions') {
      result = result.filter((item) => item.action === action);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'recommended':
          return b.recommendedQty - a.recommendedQty;

        case 'coverage':
          return a.daysCoverage - b.daysCoverage;

        case 'demand':
          return b.predictedDemand - a.predictedDemand;

        case 'stock':
          return a.currentStock - b.currentStock;

        case 'name':
          return a.name.localeCompare(b.name);

        case 'priority':
        default: {
          const priority = {
            High: 1,
            Medium: 2,
            Low: 3,
          };

          const riskDifference =
            priority[a.risk] - priority[b.risk];

          if (riskDifference !== 0) {
            return riskDifference;
          }

          return b.recommendedQty - a.recommendedQty;
        }
      }
    });

    return result;
  }, [
    products,
    search,
    category,
    risk,
    action,
    sortBy,
  ]);

  const filterCounts = useMemo(() => {
    const active = products.filter((item) => !item.dismissed);

    return {
      all: active.length,
      orderNow: active.filter(
        (item) => item.action === 'Order Now'
      ).length,
      review: active.filter(
        (item) => item.action === 'Review'
      ).length,
      noAction: active.filter(
        (item) => item.action === 'No Action'
      ).length,
    };
  }, [products]);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast('');
    }, 2500);
  };

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setProducts(
        INITIAL_PRODUCTS.map(calculateProduct)
      );

      setRefreshing(false);
      showToast('Reorder recommendations refreshed');
    }, 700);
  };

  const markReviewed = (id) => {
    setProducts((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              reviewed: true,
            }
          : item
      )
    );

    setSelectedProduct(null);
    showToast('Recommendation marked as reviewed');
  };

  const dismissRecommendation = (id) => {
    setProducts((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              dismissed: true,
            }
          : item
      )
    );

    setSelectedProduct(null);
    showToast('Recommendation dismissed');
  };

  const restoreAll = () => {
    setProducts((current) =>
      current.map((item) => ({
        ...item,
        dismissed: false,
      }))
    );

    showToast('Dismissed recommendations restored');
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All Categories');
    setRisk('All Risk');
    setAction('All Actions');
    setSortBy('priority');
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <div className="rp-page">
        {/* HEADER */}
        <header className="rp-header">
          

          <div className="rp-header-actions">
            <button
              className="rp-secondary-button"
              onClick={() =>
                downloadCSV(filteredProducts)
              }
            >
              <Download size={17} />
              Export
            </button>

            <button
              className="rp-primary-button"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={17}
                className={
                  refreshing ? 'rp-spin' : ''
                }
              />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {/* PLANNING SUMMARY */}
        <section className="rp-summary-grid">
          <SummaryCard
            icon={<Package size={20} />}
            label="Products Analyzed"
            value={formatNumber(summary.total)}
            detail="Active inventory items"
            tone="blue"
          />

          <SummaryCard
            icon={<ShoppingCart size={20} />}
            label="Order Now"
            value={formatNumber(summary.orderNow)}
            detail="High priority"
            tone="red"
          />

          <SummaryCard
            icon={<Clock3 size={20} />}
            label="Needs Review"
            value={formatNumber(summary.review)}
            detail="Approaching reorder point"
            tone="orange"
          />

          <SummaryCard
            icon={<Boxes size={20} />}
            label="Units to Reorder"
            value={formatNumber(summary.reorderUnits)}
            detail="Across all recommendations"
            tone="purple"
          />

          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            label="No Action"
            value={formatNumber(summary.noAction)}
            detail="Stock levels sufficient"
            tone="green"
          />
        </section>

        {/* ACTION OVERVIEW */}
        <section className="rp-overview">
          <div className="rp-overview-heading">
            <div>
              <span>PLANNING OVERVIEW</span>
              <h2>What needs attention?</h2>
            </div>

            <div className="rp-overview-count">
              {summary.total} products analyzed
            </div>
          </div>

          <div className="rp-overview-grid">
            <OverviewCard
              icon={<AlertTriangle size={19} />}
              title="Urgent orders"
              value={summary.orderNow}
              description="Products that may run short before the next replenishment cycle."
              tone="red"
            />

            <OverviewCard
              icon={<Clock3 size={19} />}
              title="Approaching reorder"
              value={summary.review}
              description="Products where stock is approaching the recommended reorder level."
              tone="orange"
            />

            <OverviewCard
              icon={<TrendingUp size={19} />}
              title="Largest order"
              value={`${formatNumber(
                summary.highestReorder.recommendedQty
              )} units`}
              description={
                summary.highestReorder.name === '—'
                  ? 'No replenishment required.'
                  : `${summary.highestReorder.name} has the largest suggested order.`
              }
              tone="purple"
            />

            <OverviewCard
              icon={<CalendarDays size={19} />}
              title="Lowest coverage"
              value={
                summary.lowestCoverage.name === '—'
                  ? '—'
                  : `${summary.lowestCoverage.daysCoverage} days`
              }
              description={
                summary.lowestCoverage.name === '—'
                  ? 'No active products.'
                  : `${summary.lowestCoverage.name} has the least stock coverage.`
              }
              tone="blue"
            />
          </div>
        </section>

        {/* SEARCH + FILTER BAR */}
        <section className="rp-toolbar">
          <div className="rp-search">
            <Search size={18} />
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products or categories..."
            />

            {search && (
              <button
                className="rp-clear-search"
                onClick={() => setSearch('')}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            className={`rp-filter-button ${
              showFilters ? 'active' : ''
            }`}
            onClick={() =>
              setShowFilters((current) => !current)
            }
          >
            <Filter size={16} />
            Filters
            {(category !== 'All Categories' ||
              risk !== 'All Risk' ||
              action !== 'All Actions') && (
              <span className="rp-filter-dot" />
            )}
            <ChevronDown
              size={15}
              className={
                showFilters ? 'rp-chevron-up' : ''
              }
            />
          </button>

          <div className="rp-sort">
            <span>Sort:</span>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
            >
              <option value="priority">Priority</option>
              <option value="recommended">
                Reorder quantity
              </option>
              <option value="coverage">
                Lowest coverage
              </option>
              <option value="demand">
                Highest demand
              </option>
              <option value="stock">
                Lowest stock
              </option>
              <option value="name">Product name</option>
            </select>
          </div>
        </section>

        {/* FILTER PANEL */}
        {showFilters && (
          <section className="rp-filter-panel">
            <div className="rp-filter-field">
              <label>Category</label>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="rp-filter-field">
              <label>Risk level</label>
              <select
                value={risk}
                onChange={(event) =>
                  setRisk(event.target.value)
                }
              >
                <option value="All Risk">All Risk</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="rp-filter-field">
              <label>Action</label>
              <select
                value={action}
                onChange={(event) =>
                  setAction(event.target.value)
                }
              >
                <option value="All Actions">
                  All Actions
                </option>
                <option value="Order Now">
                  Order Now
                </option>
                <option value="Review">Review</option>
                <option value="No Action">
                  No Action
                </option>
              </select>
            </div>

            <button
              className="rp-reset-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </section>
        )}

        {/* QUICK FILTERS */}
        <section className="rp-quick-filters">
          <button
            className={
              action === 'All Actions' &&
              risk === 'All Risk'
                ? 'active'
                : ''
            }
            onClick={() => {
              setAction('All Actions');
              setRisk('All Risk');
            }}
          >
            All
            <span>{filterCounts.all}</span>
          </button>

          <button
            className={
              action === 'Order Now' ? 'active urgent' : ''
            }
            onClick={() => {
              setAction('Order Now');
              setRisk('All Risk');
            }}
          >
            Order Now
            <span>{filterCounts.orderNow}</span>
          </button>

          <button
            className={
              action === 'Review' ? 'active review' : ''
            }
            onClick={() => {
              setAction('Review');
              setRisk('All Risk');
            }}
          >
            Review
            <span>{filterCounts.review}</span>
          </button>

          <button
            className={
              action === 'No Action'
                ? 'active healthy'
                : ''
            }
            onClick={() => {
              setAction('No Action');
              setRisk('All Risk');
            }}
          >
            No Action
            <span>{filterCounts.noAction}</span>
          </button>

          {products.some((item) => item.dismissed) && (
            <button
              className="rp-restored-button"
              onClick={restoreAll}
            >
              Restore dismissed
            </button>
          )}
        </section>

        {/* TABLE */}
        <section className="rp-table-card">
          <div className="rp-table-header">
            <div>
              <span className="rp-section-label">
                REPLENISHMENT PLAN
              </span>

              <h2>Recommended Actions</h2>

              <p>
                Review stock coverage and recommended
                quantities before placing orders.
              </p>
            </div>

            <div className="rp-result-count">
              Showing{' '}
              <strong>{filteredProducts.length}</strong>{' '}
              of {summary.total}
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="rp-table-wrapper">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Daily Demand</th>
                    <th>Coverage</th>
                    <th>Safety Stock</th>
                    <th>Reorder Point</th>
                    <th>Risk</th>
                    <th>Recommended</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((item) => (
                    <ProductRow
                      key={item.id}
                      product={item}
                      onView={() =>
                        setSelectedProduct(item)
                      }
                      onReview={() =>
                        markReviewed(item.id)
                      }
                      onDismiss={() =>
                        dismissRecommendation(item.id)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rp-empty">
              <div className="rp-empty-icon">
                <Search size={26} />
              </div>

              <h3>No products found</h3>

              <p>
                Try changing your search or filters to
                see more inventory recommendations.
              </p>

              <button
                onClick={clearFilters}
                className="rp-primary-button"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* WORKFLOW */}
        <section className="rp-workflow">
          <div className="rp-workflow-header">
            <div>
              <span className="rp-section-label">
                RECOMMENDATION LOGIC
              </span>

              <h2>How reorder recommendations work</h2>

              <p>
                StockPilot uses inventory levels and expected
                demand to identify when replenishment may be
                required.
              </p>
            </div>
          </div>

          <div className="rp-workflow-steps">
            <WorkflowStep
              number="01"
              title="Expected demand"
              description="Estimate how many units are likely to be sold each day."
            />

            <WorkflowStep
              number="02"
              title="Stock coverage"
              description="Compare available stock against expected daily demand."
            />

            <WorkflowStep
              number="03"
              title="Reorder point"
              description="Consider supplier lead time together with the required safety stock."
            />

            <WorkflowStep
              number="04"
              title="Recommended action"
              description="Flag products for immediate ordering, review, or no action."
            />
          </div>
        </section>
      </div>

      {/* DETAIL DRAWER */}
      {selectedProduct && (
        <ProductDrawer
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onReview={() =>
            markReviewed(selectedProduct.id)
          }
          onDismiss={() =>
            dismissRecommendation(selectedProduct.id)
          }
        />
      )}

      {/* TOAST */}
      {toast && (
        <div className="rp-toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .rp-page {
          min-height: 100%;
          padding: 30px 34px 50px;
          background: #f7f8fa;
          color: #18212f;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* HEADER */

        .rp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 26px;
        }

        .rp-eyebrow {
          margin-bottom: 8px;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.13em;
        }

        .rp-header h1 {
          margin: 0;
          font-size: 29px;
          line-height: 1.2;
          font-weight: 750;
          letter-spacing: -0.025em;
          color: #172033;
        }

        .rp-header p {
          max-width: 680px;
          margin: 8px 0 0;
          color: #667085;
          font-size: 14px;
          line-height: 1.6;
        }

        .rp-header-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }

        button {
          font-family: inherit;
        }

        .rp-primary-button,
        .rp-secondary-button {
          height: 40px;
          padding: 0 15px;
          border-radius: 8px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 650;
          transition: 0.18s ease;
        }

        .rp-primary-button {
          background: #1f4f8f;
          color: white;
          box-shadow: 0 2px 5px rgba(31, 79, 143, 0.16);
        }

        .rp-primary-button:hover {
          background: #19427a;
          transform: translateY(-1px);
        }

        .rp-primary-button:disabled {
          opacity: 0.65;
          cursor: default;
          transform: none;
        }

        .rp-secondary-button {
          background: white;
          border-color: #d9dee7;
          color: #344054;
        }

        .rp-secondary-button:hover {
          border-color: #b8c0cd;
          background: #fafbfc;
        }

        .rp-spin {
          animation: rpSpin 0.8s linear infinite;
        }

        @keyframes rpSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* SUMMARY */

        .rp-summary-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .rp-summary-card {
          min-height: 128px;
          padding: 18px;
          background: white;
          border: 1px solid #e4e7ec;
          border-radius: 11px;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.025);
        }

        .rp-summary-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .rp-summary-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
        }

        .rp-summary-icon.blue {
          color: #1f5d9b;
          background: #edf5ff;
        }

        .rp-summary-icon.red {
          color: #c53a3a;
          background: #fff0f0;
        }

        .rp-summary-icon.orange {
          color: #b66b13;
          background: #fff6e8;
        }

        .rp-summary-icon.purple {
          color: #7354a5;
          background: #f4effc;
        }

        .rp-summary-icon.green {
          color: #23815b;
          background: #ebf8f1;
        }

        .rp-summary-label {
          color: #667085;
          font-size: 12px;
          font-weight: 600;
        }

        .rp-summary-value {
          margin-top: 4px;
          color: #172033;
          font-size: 25px;
          line-height: 1.1;
          font-weight: 750;
          letter-spacing: -0.025em;
        }

        .rp-summary-detail {
          margin-top: 7px;
          color: #98a2b3;
          font-size: 11px;
        }

        /* OVERVIEW */

        .rp-overview {
          padding: 21px;
          margin-bottom: 22px;
          background: white;
          border: 1px solid #e4e7ec;
          border-radius: 11px;
        }

        .rp-overview-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .rp-overview-heading span {
          color: #7b8494;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.13em;
        }

        .rp-overview-heading h2 {
          margin: 4px 0 0;
          color: #172033;
          font-size: 18px;
          font-weight: 720;
        }

        .rp-overview-count {
          padding: 7px 11px;
          border: 1px solid #e5e7eb;
          border-radius: 7px;
          color: #667085;
          background: #fafbfc;
          font-size: 11px;
          font-weight: 600;
        }

        .rp-overview-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .rp-overview-card {
          padding: 15px;
          border: 1px solid #eaecf0;
          border-radius: 9px;
          background: #fcfcfd;
        }

        .rp-overview-top {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 13px;
        }

        .rp-overview-icon {
          width: 31px;
          height: 31px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rp-overview-icon.red {
          color: #c53a3a;
          background: #fff0f0;
        }

        .rp-overview-icon.orange {
          color: #b66b13;
          background: #fff6e8;
        }

        .rp-overview-icon.purple {
          color: #7354a5;
          background: #f4effc;
        }

        .rp-overview-icon.blue {
          color: #1f5d9b;
          background: #edf5ff;
        }

        .rp-overview-title {
          color: #475467;
          font-size: 12px;
          font-weight: 650;
        }

        .rp-overview-value {
          color: #172033;
          font-size: 22px;
          font-weight: 750;
        }

        .rp-overview-description {
          min-height: 34px;
          margin-top: 5px;
          color: #98a2b3;
          font-size: 11px;
          line-height: 1.5;
        }

        /* TOOLBAR */

        .rp-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .rp-search {
          position: relative;
          flex: 1;
          min-width: 200px;
          height: 42px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 13px;
          border: 1px solid #dfe3e8;
          border-radius: 8px;
          background: white;
          color: #98a2b3;
        }

        .rp-search:focus-within {
          border-color: #8ca8ca;
          box-shadow: 0 0 0 3px rgba(31, 79, 143, 0.07);
        }

        .rp-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #344054;
          font-size: 13px;
        }

        .rp-search input::placeholder {
          color: #98a2b3;
        }

        .rp-clear-search {
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: #f2f4f7;
          color: #667085;
          cursor: pointer;
        }

        .rp-filter-button {
          height: 42px;
          padding: 0 13px;
          display: flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #dfe3e8;
          border-radius: 8px;
          background: white;
          color: #475467;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .rp-filter-button:hover,
        .rp-filter-button.active {
          border-color: #b6c5d8;
          background: #f8fafc;
        }

        .rp-filter-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1f5d9b;
        }

        .rp-chevron-up {
          transform: rotate(180deg);
        }

        .rp-sort {
          height: 42px;
          padding: 0 9px 0 12px;
          display: flex;
          align-items: center;
          gap: 5px;
          border: 1px solid #dfe3e8;
          border-radius: 8px;
          background: white;
        }

        .rp-sort span {
          color: #98a2b3;
          font-size: 11px;
        }

        .rp-sort select {
          border: 0;
          outline: 0;
          background: transparent;
          color: #475467;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        /* FILTER PANEL */

        .rp-filter-panel {
          display: grid;
          grid-template-columns: repeat(4, minmax(150px, 1fr));
          gap: 12px;
          padding: 15px;
          margin-bottom: 10px;
          border: 1px solid #e4e7ec;
          border-radius: 9px;
          background: white;
        }

        .rp-filter-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rp-filter-field label {
          color: #667085;
          font-size: 11px;
          font-weight: 650;
        }

        .rp-filter-field select {
          width: 100%;
          height: 38px;
          padding: 0 10px;
          border: 1px solid #dfe3e8;
          border-radius: 7px;
          outline: none;
          background: white;
          color: #344054;
          font-size: 12px;
        }

        .rp-reset-button {
          align-self: end;
          height: 38px;
          border: 1px solid #dfe3e8;
          border-radius: 7px;
          background: #f9fafb;
          color: #475467;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        /* QUICK FILTERS */

        .rp-quick-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 13px;
          overflow-x: auto;
        }

        .rp-quick-filters button {
          height: 34px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          border: 1px solid #e0e4ea;
          border-radius: 7px;
          background: white;
          color: #667085;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
        }

        .rp-quick-filters button:hover {
          border-color: #c3cad4;
        }

        .rp-quick-filters button.active {
          border-color: #aebfd4;
          background: #f2f6fb;
          color: #1f4f8f;
        }

        .rp-quick-filters button.active.urgent {
          border-color: #efb3b3;
          background: #fff3f3;
          color: #b42318;
        }

        .rp-quick-filters button.active.review {
          border-color: #f1d2a5;
          background: #fff8eb;
          color: #a15c07;
        }

        .rp-quick-filters button.active.healthy {
          border-color: #b8dfcc;
          background: #f0faf5;
          color: #18794e;
        }

        .rp-quick-filters button span {
          min-width: 19px;
          height: 19px;
          padding: 0 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          background: #f2f4f7;
          color: #667085;
          font-size: 10px;
        }

        .rp-restored-button {
          margin-left: auto;
          border: 0 !important;
          background: transparent !important;
          color: #1f5d9b !important;
        }

        /* TABLE */

        .rp-table-card {
          overflow: hidden;
          border: 1px solid #e4e7ec;
          border-radius: 11px;
          background: white;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.02);
        }

        .rp-table-header {
          padding: 21px 21px 17px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid #eaecf0;
        }

        .rp-section-label {
          color: #7b8494;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.13em;
        }

        .rp-table-header h2,
        .rp-workflow-header h2 {
          margin: 4px 0 0;
          color: #172033;
          font-size: 18px;
          font-weight: 720;
        }

        .rp-table-header p,
        .rp-workflow-header p {
          margin: 5px 0 0;
          color: #98a2b3;
          font-size: 11px;
        }

        .rp-result-count {
          flex-shrink: 0;
          color: #98a2b3;
          font-size: 11px;
        }

        .rp-result-count strong {
          color: #475467;
        }

        .rp-table-wrapper {
          overflow-x: auto;
        }

        .rp-table {
          width: 100%;
          min-width: 1100px;
          border-collapse: collapse;
        }

        .rp-table th {
          height: 42px;
          padding: 0 13px;
          border-bottom: 1px solid #eaecf0;
          background: #fafbfc;
          color: #667085;
          font-size: 10px;
          font-weight: 750;
          text-align: left;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }

        .rp-table th:first-child {
          padding-left: 21px;
        }

        .rp-table td {
          height: 70px;
          padding: 10px 13px;
          border-bottom: 1px solid #f0f2f5;
          color: #475467;
          font-size: 12px;
          vertical-align: middle;
        }

        .rp-table tbody tr {
          transition: background 0.15s ease;
        }

        .rp-table tbody tr:hover {
          background: #fafcff;
        }

        .rp-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .rp-table td:first-child {
          padding-left: 21px;
        }

        .rp-product-cell {
          min-width: 190px;
        }

        .rp-product-name {
          color: #344054;
          font-size: 12px;
          font-weight: 700;
        }

        .rp-product-category {
          margin-top: 3px;
          color: #98a2b3;
          font-size: 10px;
        }

        .rp-number {
          color: #344054;
          font-weight: 650;
        }

        .rp-muted {
          color: #98a2b3;
        }

        .rp-coverage {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 74px;
        }

        .rp-coverage-text {
          color: #475467;
          font-size: 11px;
          font-weight: 650;
        }

        .rp-coverage-bar {
          width: 65px;
          height: 4px;
          overflow: hidden;
          border-radius: 5px;
          background: #edf0f3;
        }

        .rp-coverage-fill {
          height: 100%;
          border-radius: 5px;
        }

        .rp-coverage-fill.high {
          background: #d64545;
        }

        .rp-coverage-fill.medium {
          background: #d9942e;
        }

        .rp-coverage-fill.low {
          background: #3b8d68;
        }

        .rp-risk {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 750;
        }

        .rp-risk.high {
          color: #b42318;
          background: #fff0f0;
        }

        .rp-risk.medium {
          color: #a15c07;
          background: #fff6e8;
        }

        .rp-risk.low {
          color: #18794e;
          background: #edf9f3;
        }

        .rp-risk-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .rp-recommended {
          color: #1f4f8f;
          font-weight: 750;
        }

        .rp-action-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rp-action-badge {
          min-width: 70px;
          height: 29px;
          padding: 0 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 750;
        }

        .rp-action-badge.order {
          color: #b42318;
          background: #fff0f0;
        }

        .rp-action-badge.review {
          color: #a15c07;
          background: #fff6e8;
        }

        .rp-action-badge.none {
          color: #18794e;
          background: #edf9f3;
        }

        .rp-icon-action {
          width: 29px;
          height: 29px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e0e4ea;
          border-radius: 6px;
          background: white;
          color: #667085;
          cursor: pointer;
        }

        .rp-icon-action:hover {
          border-color: #bcc5d1;
          background: #f8fafc;
          color: #344054;
        }

        .rp-icon-action.success:hover {
          border-color: #b8dfcc;
          background: #f0faf5;
          color: #18794e;
        }

        .rp-icon-action.danger:hover {
          border-color: #efb3b3;
          background: #fff3f3;
          color: #b42318;
        }

        /* EMPTY */

        .rp-empty {
          padding: 70px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .rp-empty-icon {
          width: 55px;
          height: 55px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f2f4f7;
          color: #98a2b3;
        }

        .rp-empty h3 {
          margin: 15px 0 5px;
          color: #344054;
          font-size: 15px;
        }

        .rp-empty p {
          max-width: 400px;
          margin: 0 0 18px;
          color: #98a2b3;
          font-size: 12px;
          line-height: 1.6;
        }

        /* WORKFLOW */

        .rp-workflow {
          margin-top: 22px;
          padding: 21px;
          border: 1px solid #e4e7ec;
          border-radius: 11px;
          background: white;
        }

        .rp-workflow-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 19px;
        }

        .rp-workflow-step {
          position: relative;
          padding: 16px;
          border: 1px solid #eaecf0;
          border-radius: 9px;
          background: #fcfcfd;
        }

        .rp-workflow-number {
          color: #9aa3b1;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .rp-workflow-step h3 {
          margin: 8px 0 5px;
          color: #344054;
          font-size: 12px;
          font-weight: 700;
        }

        .rp-workflow-step p {
          margin: 0;
          color: #98a2b3;
          font-size: 10px;
          line-height: 1.55;
        }

        /* DRAWER */

        .rp-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.32);
          backdrop-filter: blur(2px);
        }

        .rp-drawer {
          position: fixed;
          top: 0;
          right: 0;
          z-index: 101;
          width: min(480px, 94vw);
          height: 100vh;
          overflow-y: auto;
          background: white;
          box-shadow: -12px 0 35px rgba(16, 24, 40, 0.13);
          animation: rpDrawerIn 0.2s ease;
        }

        @keyframes rpDrawerIn {
          from {
            transform: translateX(30px);
            opacity: 0.5;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .rp-drawer-header {
          padding: 22px;
          border-bottom: 1px solid #eaecf0;
        }

        .rp-drawer-close {
          width: 32px;
          height: 32px;
          margin-left: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e0e4ea;
          border-radius: 7px;
          background: white;
          color: #667085;
          cursor: pointer;
        }

        .rp-drawer-close:hover {
          background: #f8fafc;
        }

        .rp-drawer-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .rp-drawer-eyebrow {
          margin-bottom: 6px;
          color: #7b8494;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.11em;
        }

        .rp-drawer h2 {
          margin: 0;
          color: #172033;
          font-size: 21px;
          font-weight: 750;
        }

        .rp-drawer-category {
          margin-top: 5px;
          color: #98a2b3;
          font-size: 11px;
        }

        .rp-drawer-body {
          padding: 22px;
        }

        .rp-drawer-status {
          padding: 14px;
          margin-bottom: 18px;
          border-radius: 9px;
          border: 1px solid #eaecf0;
          background: #fafbfc;
        }

        .rp-drawer-status-label {
          color: #667085;
          font-size: 10px;
          font-weight: 650;
        }

        .rp-drawer-status-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }

        .rp-drawer-status-main strong {
          color: #172033;
          font-size: 17px;
        }

        .rp-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .rp-detail-card {
          padding: 14px;
          border: 1px solid #eaecf0;
          border-radius: 8px;
          background: white;
        }

        .rp-detail-card span {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          margin-bottom: 6px;
        }

        .rp-detail-card strong {
          color: #344054;
          font-size: 16px;
        }

        .rp-detail-card small {
          display: block;
          margin-top: 3px;
          color: #98a2b3;
          font-size: 9px;
        }

        .rp-drawer-section {
          margin-top: 22px;
        }

        .rp-drawer-section h3 {
          margin: 0 0 10px;
          color: #344054;
          font-size: 12px;
        }

        .rp-drawer-explanation {
          padding: 14px;
          border-left: 3px solid #7b9bc1;
          border-radius: 0 7px 7px 0;
          background: #f7f9fc;
          color: #667085;
          font-size: 11px;
          line-height: 1.65;
        }

        .rp-drawer-actions {
          display: flex;
          gap: 8px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #eaecf0;
        }

        .rp-drawer-actions button {
          flex: 1;
        }

        .rp-dismiss-button {
          height: 40px;
          border: 1px solid #efb3b3;
          border-radius: 7px;
          background: white;
          color: #b42318;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .rp-dismiss-button:hover {
          background: #fff6f6;
        }

        /* TOAST */

        .rp-toast {
          position: fixed;
          right: 25px;
          bottom: 25px;
          z-index: 200;
          min-height: 43px;
          padding: 0 15px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #cce8da;
          border-radius: 8px;
          background: white;
          color: #18794e;
          box-shadow: 0 8px 30px rgba(16, 24, 40, 0.12);
          font-size: 12px;
          font-weight: 650;
          animation: rpToastIn 0.2s ease;
        }

        @keyframes rpToastIn {
          from {
            opacity: 0;
            transform: translateY(7px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* RESPONSIVE */

        @media (max-width: 1250px) {
          .rp-summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .rp-overview-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .rp-workflow-steps {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 850px) {
          .rp-page {
            padding: 22px 18px 40px;
          }

          .rp-header {
            flex-direction: column;
          }

          .rp-header-actions {
            width: 100%;
          }

          .rp-header-actions button {
            flex: 1;
          }

          .rp-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .rp-toolbar {
            flex-wrap: wrap;
          }

          .rp-search {
            flex-basis: 100%;
          }

          .rp-filter-panel {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .rp-page {
            padding: 18px 13px 35px;
          }

          .rp-header h1 {
            font-size: 24px;
          }

          .rp-summary-grid,
          .rp-overview-grid,
          .rp-workflow-steps {
            grid-template-columns: 1fr;
          }

          .rp-overview-heading,
          .rp-table-header {
            flex-direction: column;
          }

          .rp-filter-panel {
            grid-template-columns: 1fr;
          }

          .rp-sort {
            flex: 1;
          }

          .rp-toolbar {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .rp-search {
            grid-column: 1 / -1;
          }

          .rp-sort {
            width: 100%;
          }

          .rp-filter-button {
            justify-content: center;
          }

          .rp-restored-button {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  label,
  value,
  detail,
  tone,
}) {
  return (
    <div className="rp-summary-card">
      <div className="rp-summary-top">
        <div className={`rp-summary-icon ${tone}`}>
          {icon}
        </div>
      </div>

      <div className="rp-summary-label">{label}</div>

      <div className="rp-summary-value">{value}</div>

      <div className="rp-summary-detail">{detail}</div>
    </div>
  );
}

/* =========================================================
   OVERVIEW CARD
========================================================= */

function OverviewCard({
  icon,
  title,
  value,
  description,
  tone,
}) {
  return (
    <div className="rp-overview-card">
      <div className="rp-overview-top">
        <div className={`rp-overview-icon ${tone}`}>
          {icon}
        </div>

        <div className="rp-overview-title">
          {title}
        </div>
      </div>

      <div className="rp-overview-value">{value}</div>

      <div className="rp-overview-description">
        {description}
      </div>
    </div>
  );
}

/* =========================================================
   PRODUCT ROW
========================================================= */

function ProductRow({
  product,
  onView,
  onReview,
  onDismiss,
}) {
  const coveragePercent = Math.min(
    100,
    (product.daysCoverage /
      Math.max(product.leadTime * 2, 1)) *
      100
  );

  const actionClass =
    product.action === 'Order Now'
      ? 'order'
      : product.action === 'Review'
      ? 'review'
      : 'none';

  return (
    <tr>
      <td>
        <div className="rp-product-cell">
          <div className="rp-product-name">
            {product.name}
          </div>

          <div className="rp-product-category">
            {product.category}
          </div>
        </div>
      </td>

      <td>
        <span className="rp-number">
          {formatNumber(product.currentStock)}
        </span>
      </td>

      <td>
        <span className="rp-number">
          {formatNumber(product.predictedDemand)}
        </span>
        <span className="rp-muted"> / day</span>
      </td>

      <td>
        <div className="rp-coverage">
          <div className="rp-coverage-text">
            {product.daysCoverage} days
          </div>

          <div className="rp-coverage-bar">
            <div
              className={`rp-coverage-fill ${product.risk.toLowerCase()}`}
              style={{
                width: `${coveragePercent}%`,
              }}
            />
          </div>
        </div>
      </td>

      <td>
        <span className="rp-number">
          {formatNumber(product.safetyStock)}
        </span>
      </td>

      <td>
        <span className="rp-number">
          {formatNumber(product.reorderPoint)}
        </span>
      </td>

      <td>
        <span
          className={`rp-risk ${product.risk.toLowerCase()}`}
        >
          <span className="rp-risk-dot" />
          {product.risk}
        </span>
      </td>

      <td>
        {product.recommendedQty > 0 ? (
          <span className="rp-recommended">
            +{formatNumber(product.recommendedQty)}
          </span>
        ) : (
          <span className="rp-muted">—</span>
        )}
      </td>

      <td>
        <div className="rp-action-group">
          <span
            className={`rp-action-badge ${actionClass}`}
          >
            {product.action}
          </span>

          <button
            className="rp-icon-action"
            title="View details"
            onClick={onView}
          >
            <Eye size={14} />
          </button>

          {product.action !== 'No Action' && (
            <>
              <button
                className="rp-icon-action success"
                title="Mark as reviewed"
                onClick={onReview}
              >
                <Check size={14} />
              </button>

              <button
                className="rp-icon-action danger"
                title="Dismiss"
                onClick={onDismiss}
              >
                <XCircle size={14} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   WORKFLOW STEP
========================================================= */

function WorkflowStep({
  number,
  title,
  description,
}) {
  return (
    <div className="rp-workflow-step">
      <div className="rp-workflow-number">{number}</div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

/* =========================================================
   PRODUCT DRAWER
========================================================= */

function ProductDrawer({
  product,
  onClose,
  onReview,
  onDismiss,
}) {
  const coveragePercent = Math.min(
    100,
    (product.daysCoverage /
      Math.max(product.leadTime * 2, 1)) *
      100
  );

  return (
    <>
      <div className="rp-overlay" onClick={onClose} />

      <aside className="rp-drawer">
        <div className="rp-drawer-header">
          <div className="rp-drawer-title-row">
            <div>
              <div className="rp-drawer-eyebrow">
                PRODUCT PLANNING
              </div>

              <h2>{product.name}</h2>

              <div className="rp-drawer-category">
                {product.category}
              </div>
            </div>

            <button
              className="rp-drawer-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="rp-drawer-body">
          <div className="rp-drawer-status">
            <div className="rp-drawer-status-label">
              RECOMMENDED ACTION
            </div>

            <div className="rp-drawer-status-main">
              <strong>{product.action}</strong>

              <span
                className={`rp-risk ${product.risk.toLowerCase()}`}
              >
                <span className="rp-risk-dot" />
                {product.risk} Risk
              </span>
            </div>
          </div>

          <div className="rp-detail-grid">
            <DetailCard
              label="Current Stock"
              value={formatNumber(
                product.currentStock
              )}
              note="units available"
            />

            <DetailCard
              label="Daily Demand"
              value={formatNumber(
                product.predictedDemand
              )}
              note="expected units/day"
            />

            <DetailCard
              label="Stock Coverage"
              value={`${product.daysCoverage} days`}
              note={`supplier lead time: ${product.leadTime} days`}
            />

            <DetailCard
              label="Safety Stock"
              value={formatNumber(
                product.safetyStock
              )}
              note="reserve units"
            />

            <DetailCard
              label="Reorder Point"
              value={formatNumber(
                product.reorderPoint
              )}
              note="recommended threshold"
            />

            <DetailCard
              label="Recommended Qty"
              value={
                product.recommendedQty > 0
                  ? `+${formatNumber(
                      product.recommendedQty
                    )}`
                  : '—'
              }
              note="units to replenish"
            />
          </div>

          <div className="rp-drawer-section">
            <h3>Stock coverage</h3>

            <div className="rp-coverage">
              <div className="rp-coverage-text">
                {product.daysCoverage} days available
              </div>

              <div
                className="rp-coverage-bar"
                style={{
                  width: '100%',
                }}
              >
                <div
                  className={`rp-coverage-fill ${product.risk.toLowerCase()}`}
                  style={{
                    width: `${coveragePercent}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rp-drawer-section">
            <h3>Why this recommendation?</h3>

            <div className="rp-drawer-explanation">
              {product.action === 'Order Now' &&
                `Current stock covers approximately ${product.daysCoverage} days, while the supplier lead time is ${product.leadTime} days. Replenishment should be planned immediately to reduce the risk of running short.`}

              {product.action === 'Review' &&
                `Current inventory is below the recommended reorder point of ${formatNumber(
                  product.reorderPoint
                )} units. A replenishment of approximately ${formatNumber(
                  product.recommendedQty
                )} units would restore the planned stock level.`}

              {product.action === 'No Action' &&
                `Current inventory of ${formatNumber(
                  product.currentStock
                )} units is above the recommended reorder point. No immediate replenishment is required.`}
            </div>
          </div>

          <div className="rp-drawer-section">
            <h3>Planning calculation</h3>

            <div className="rp-drawer-explanation">
              Reorder point = expected daily demand ×
              supplier lead time + safety stock.
              <br />
              <br />
              {product.predictedDemand} ×{' '}
              {product.leadTime} +{' '}
              {product.safetyStock} ={' '}
              <strong>
                {product.reorderPoint} units
              </strong>
            </div>
          </div>

          <div className="rp-drawer-actions">
            {product.action !== 'No Action' && (
              <>
                <button
                  className="rp-primary-button"
                  onClick={onReview}
                >
                  <Check size={16} />
                  Mark Reviewed
                </button>

                <button
                  className="rp-dismiss-button"
                  onClick={onDismiss}
                >
                  Dismiss
                </button>
              </>
            )}

            {product.action === 'No Action' && (
              <button
                className="rp-primary-button"
                onClick={onClose}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   DETAIL CARD
========================================================= */

function DetailCard({
  label,
  value,
  note,
}) {
  return (
    <div className="rp-detail-card">
      <span>{label}</span>

      <strong>{value}</strong>

      <small>{note}</small>
    </div>
  );
}