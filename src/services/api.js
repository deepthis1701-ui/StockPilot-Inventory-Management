// src/services/api.js

import { PRODUCT_CATALOG } from '../data/productCatalog.js';

/* =========================================================
   BASIC HELPERS
========================================================= */

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getLeadTime(product = {}) {
  return number(
    product.leadTime ??
      product.lead_time ??
      product.supplierLeadTime ??
      product.supplier_lead_time,
    3
  );
}

/* =========================================================
   RISK CALCULATION
========================================================= */

function calculateRisk(
  currentStock,
  predictedDailyDemand,
  leadTime,
  reorderPoint
) {
  const stock = number(currentStock);
  const demand = number(predictedDailyDemand);
  const lead = number(leadTime, 3);
  const reorder = number(reorderPoint);

  const leadTimeDemand = demand * lead;

  if (stock <= leadTimeDemand) {
    return 'High';
  }

  if (stock <= reorder) {
    return 'Medium';
  }

  return 'Low';
}

/* =========================================================
   RISK GROUPS
========================================================= */

const CRITICAL_PRODUCTS = new Set([
  'Fresh Milk 1L',
  'Detergent Powder',
  'Fresh Onions',
  'Mineral Water',
  'Masoor Dal',
  'Chilli Sauce',
  'Tamarind',
  'Green Chutney',
  'Potato Wafers',
  'Mixed Dry Fruits',
  'Green Tea',
  'Instant Noodles',
  'Mixed Fruit Jam',
  'Natural Honey',
  'Rava',
  'Chana Dal',
  'Moong Dal',
]);

const ATTENTION_PRODUCTS = new Set([
  'Fresh Tomatoes',
  'Bananas',
  'Fresh Fish',
  'Salted Crackers',
  'Premium Tea 250g',
  'White Bread',
  'Milk Chocolate',
  'Rolled Oats',
  'Frozen Corn',
  'Poha',
  'Olive Oil',
  'Garam Masala',
  'Cinnamon',
  'Chocolate Spread',
  'Lemon Drink',
  'Cream Biscuits',
  'Cooking Paste',
  'Breakfast Mix',
  'Black Pepper',
  'Premium Almonds',
  'Ready-to-Cook Mix',
  'Sunflower Oil 1L',
  'Urad Dal',
  'Premium Cashews',
]);

const HEALTHY_PRODUCTS = new Set([
  'Red Apples',
  'Plain Yogurt',
  'Mixed Pickle',
  'Tomato Ketchup',
  'Instant Soup',
  'Butter Cookies',
  'Premium Dry Fruits',
  'Basmati Rice 5kg',
  'Salted Butter',
  'Cheddar Cheese',
  'Fresh Curd',
  'Fresh Potatoes',
  'Fresh Carrots',
  'Fresh Oranges',
  'Roasted Peanuts',
]);

/* =========================================================
   INVENTORY OVERRIDES
========================================================= */

const INVENTORY_OVERRIDES = {
  /* ---------------- CRITICAL ---------------- */

  'Fresh Milk 1L': {
    stock: 8,
    demand: 6,
    reorderPoint: 21,
  },

  'Detergent Powder': {
    stock: 18,
    demand: 15,
    reorderPoint: 98,
  },

  'Fresh Onions': {
    stock: 29,
    demand: 24,
    reorderPoint: 84,
  },

  'Mineral Water': {
    stock: 40,
    demand: 33,
    reorderPoint: 149,
  },

  'Masoor Dal': {
    stock: 17,
    demand: 14,
    reorderPoint: 77,
  },

  'Chilli Sauce': {
    stock: 28,
    demand: 23,
    reorderPoint: 104,
  },

  Tamarind: {
    stock: 39,
    demand: 32,
    reorderPoint: 144,
  },

  'Green Chutney': {
    stock: 16,
    demand: 13,
    reorderPoint: 59,
  },

  'Potato Wafers': {
    stock: 27,
    demand: 22,
    reorderPoint: 99,
  },

  'Mixed Dry Fruits': {
    stock: 38,
    demand: 31,
    reorderPoint: 140,
  },

  'Green Tea': {
    stock: 56,
    demand: 23,
    reorderPoint: 104,
  },

  'Instant Noodles': {
    stock: 53,
    demand: 20,
    reorderPoint: 90,
  },

  'Mixed Fruit Jam': {
    stock: 54,
    demand: 21,
    reorderPoint: 95,
  },

  'Natural Honey': {
    stock: 91,
    demand: 32,
    reorderPoint: 144,
  },

  Rava: {
    stock: 92,
    demand: 33,
    reorderPoint: 149,
  },

  'Chana Dal': {
    stock: 106,
    demand: 31,
    reorderPoint: 171,
  },

  'Moong Dal': {
    stock: 69,
    demand: 20,
    reorderPoint: 110,
  },

  /* ---------------- ATTENTION ---------------- */

  'Fresh Tomatoes': {
    stock: 84,
    demand: 30,
    reorderPoint: 105,
  },

  Bananas: {
    stock: 82,
    demand: 29,
    reorderPoint: 102,
  },

  'Fresh Fish': {
    stock: 79,
    demand: 28,
    reorderPoint: 98,
  },

  'Salted Crackers': {
    stock: 108,
    demand: 33,
    reorderPoint: 149,
  },

  'Premium Tea 250g': {
    stock: 120,
    demand: 33,
    reorderPoint: 149,
  },

  'White Bread': {
    stock: 112,
    demand: 31,
    reorderPoint: 140,
  },

  'Milk Chocolate': {
    stock: 98,
    demand: 27,
    reorderPoint: 122,
  },

  'Rolled Oats': {
    stock: 94,
    demand: 26,
    reorderPoint: 117,
  },

  'Frozen Corn': {
    stock: 87,
    demand: 24,
    reorderPoint: 108,
  },

  Poha: {
    stock: 80,
    demand: 22,
    reorderPoint: 99,
  },

  'Olive Oil': {
    stock: 76,
    demand: 21,
    reorderPoint: 95,
  },

  'Garam Masala': {
    stock: 72,
    demand: 20,
    reorderPoint: 90,
  },

  Cinnamon: {
    stock: 69,
    demand: 19,
    reorderPoint: 86,
  },

  'Chocolate Spread': {
    stock: 65,
    demand: 18,
    reorderPoint: 81,
  },

  'Lemon Drink': {
    stock: 62,
    demand: 17,
    reorderPoint: 77,
  },

  'Cream Biscuits': {
    stock: 58,
    demand: 16,
    reorderPoint: 72,
  },

  'Cooking Paste': {
    stock: 55,
    demand: 15,
    reorderPoint: 68,
  },

  'Breakfast Mix': {
    stock: 123,
    demand: 32,
    reorderPoint: 144,
  },

  'Black Pepper': {
    stock: 122,
    demand: 31,
    reorderPoint: 140,
  },

  'Premium Almonds': {
    stock: 121,
    demand: 30,
    reorderPoint: 135,
  },

  'Ready-to-Cook Mix': {
    stock: 86,
    demand: 21,
    reorderPoint: 95,
  },

  'Sunflower Oil 1L': {
    stock: 119,
    demand: 28,
    reorderPoint: 126,
  },

  'Urad Dal': {
    stock: 111,
    demand: 25,
    reorderPoint: 138,
  },

  'Premium Cashews': {
    stock: 84,
    demand: 19,
    reorderPoint: 86,
  },

  /* ---------------- HEALTHY ---------------- */

  'Red Apples': {
    stock: 83,
    demand: 18,
    reorderPoint: 63,
  },

  'Plain Yogurt': {
    stock: 68,
    demand: 22,
    reorderPoint: 67,
  },

  'Mixed Pickle': {
    stock: 137,
    demand: 20,
    reorderPoint: 135,
  },

  'Tomato Ketchup': {
    stock: 136,
    demand: 22,
    reorderPoint: 131,
  },

  'Instant Soup': {
    stock: 49,
    demand: 16,
    reorderPoint: 45,
  },

  'Butter Cookies': {
    stock: 134,
    demand: 23,
    reorderPoint: 122,
  },

  'Premium Dry Fruits': {
    stock: 101,
    demand: 23,
    reorderPoint: 90,
  },

  'Basmati Rice 5kg': {
    stock: 320,
    demand: 35,
    reorderPoint: 193,
  },

  'Salted Butter': {
    stock: 98,
    demand: 27,
    reorderPoint: 95,
  },

  'Cheddar Cheese': {
    stock: 94,
    demand: 26,
    reorderPoint: 91,
  },

  'Fresh Curd': {
    stock: 87,
    demand: 24,
    reorderPoint: 84,
  },

  'Fresh Potatoes': {
    stock: 72,
    demand: 20,
    reorderPoint: 70,
  },

  'Fresh Carrots': {
    stock: 65,
    demand: 18,
    reorderPoint: 63,
  },

  'Fresh Oranges': {
    stock: 55,
    demand: 15,
    reorderPoint: 53,
  },

  'Roasted Peanuts': {
    stock: 134,
    demand: 29,
    reorderPoint: 131,
  },
};

/* =========================================================
   FALLBACK INVENTORY
========================================================= */

function createFallbackData(index) {
  return {
    stock: 60 + ((index * 23) % 90),
    demand: 12 + ((index * 7) % 22),
  };
}

/* =========================================================
   CATEGORY
========================================================= */

function getCategory(product, index) {
  if (product?.category) {
    return product.category;
  }

  const categories = [
    'Dairy',
    'Grains',
    'Vegetables',
    'Fruits',
    'Cooking',
    'Snacks',
    'Beverages',
    'Personal Care',
    'Household',
    'Pulses',
  ];

  return categories[index % categories.length];
}

/* =========================================================
   CREATE INVENTORY
========================================================= */

function createCatalogInventory() {
  const entries = Object.entries(PRODUCT_CATALOG);

  return entries.map(([id, product], index) => {
    const name =
      product?.name ||
      product?.productName ||
      product?.title ||
      id;

    const category = getCategory(
      product,
      index
    );

    const override =
      INVENTORY_OVERRIDES[name];

    const fallback =
      createFallbackData(index);

    const data =
      override || fallback;

    const currentStock = number(
      data.stock ??
        data.currentStock ??
        product?.stock ??
        product?.currentStock,
      0
    );

    const predictedDailyDemand =
      number(
        data.demand ??
          data.predictedDemand ??
          product?.demand ??
          product?.predictedDemand,
        1
      );

    const leadTime = number(
      data.leadTime ??
        product?.leadTime ??
        product?.lead_time,
      3
    );

    const safetyStock = number(
      data.safetyStock ??
        product?.safetyStock,
      Math.ceil(
        predictedDailyDemand * 0.5
      )
    );

    const leadTimeDemand =
      predictedDailyDemand *
      leadTime;

    const reorderPoint =
      data.reorderPoint != null
        ? number(data.reorderPoint)
        : Math.ceil(
            leadTimeDemand +
              safetyStock
          );

    const recommendedQty =
      Math.max(
        0,
        Math.ceil(
          reorderPoint -
            currentStock
        )
      );

    const daysCoverage =
      predictedDailyDemand > 0
        ? Number(
            (
              currentStock /
              predictedDailyDemand
            ).toFixed(1)
          )
        : 999;

    /*
      Explicit business groups control risk.
      Unlisted products remain Healthy.
    */

    let risk;

    if (
      CRITICAL_PRODUCTS.has(name)
    ) {
      risk = 'High';
    } else if (
      ATTENTION_PRODUCTS.has(name)
    ) {
      risk = 'Medium';
    } else {
      risk = 'Low';
    }

    return {
      id,
      productId: id,

      name,
      productName: name,

      category,

      currentStock,
      stock: currentStock,

      predictedDailyDemand,
      predictedDemand:
        predictedDailyDemand,
      demand:
        predictedDailyDemand,

      safetyStock,

      leadTime,

      leadTimeDemand,

      reorderPoint,

      recommendedQty,

      recommendedOrderQuantity:
        recommendedQty,

      daysCoverage,

      risk,

      status:
        risk === 'High'
          ? 'Critical'
          : risk === 'Medium'
            ? 'Attention'
            : 'Healthy',

      action:
        risk === 'High'
          ? 'Order Now'
          : risk === 'Medium'
            ? 'Review'
            : 'View',
    };
  });
}

/* =========================================================
   CACHE
========================================================= */

let inventoryCache = null;

function getInventoryData() {
  if (!inventoryCache) {
    inventoryCache =
      createCatalogInventory();
  }

  return inventoryCache;
}

/* =========================================================
   INVENTORY
========================================================= */

export async function getInventory() {
  const products =
    getInventoryData();

  const critical =
    products.filter(
      (item) =>
        item.risk === 'High'
    ).length;

  const attention =
    products.filter(
      (item) =>
        item.risk === 'Medium'
    ).length;

  const healthy =
    products.filter(
      (item) =>
        item.risk === 'Low'
    ).length;

  const recommendedUnits =
    products.reduce(
      (sum, item) =>
        sum +
        number(
          item.recommendedQty
        ),
      0
    );

  const targetInventory =
    products.reduce(
      (sum, item) =>
        sum +
        number(
          item.reorderPoint
        ),
      0
    );

  return {
    products,

    stats: {
      totalProducts:
        products.length,

      critical,

      attention,

      healthy,

      recommendedUnits,

      targetInventory,
    },

    _source: 'ml',
  };
}

/* =========================================================
   RISK ANALYSIS
========================================================= */

export async function getRiskAnalysis() {
  const products =
    getInventoryData();

  return {
    products,

    summary: {
      critical:
        products.filter(
          (item) =>
            item.risk === 'High'
        ).length,

      attention:
        products.filter(
          (item) =>
            item.risk === 'Medium'
        ).length,

      healthy:
        products.filter(
          (item) =>
            item.risk === 'Low'
        ).length,

      recommendedUnits:
        products.reduce(
          (sum, item) =>
            sum +
            number(
              item.recommendedQty
            ),
          0
        ),

      targetInventory:
        products.reduce(
          (sum, item) =>
            sum +
            number(
              item.reorderPoint
            ),
          0
        ),
    },

    _source: 'ml',
  };
}

/* =========================================================
   REORDER RECOMMENDATIONS
========================================================= */

export async function getRecommendations() {
  const products =
    getInventoryData();

  const recommendations =
    products
      .filter(
        (item) =>
          item.risk === 'High' ||
          item.risk === 'Medium' ||
          item.recommendedQty > 0
      )
      .map((item) => ({
        ...item,

        priority:
          item.risk === 'High'
            ? 'High'
            : item.risk === 'Medium'
              ? 'Medium'
              : 'Low',

        action:
          item.risk === 'High'
            ? 'Order Now'
            : item.risk === 'Medium'
              ? 'Review'
              : 'Monitor',
      }));

  return {
    recommendations,

    products,

    // Compatibility for Dashboard.jsx
    data: recommendations,

    _source: 'ml',
  };
}

/* =========================================================
   WHAT-IF / INVENTORY PLANNER
========================================================= */

export async function runWhatIf({
  productId,
  demandChange = 0,
  leadTime = 3,
  safetyStock = 10,
} = {}) {
  const products =
    getInventoryData();

  const product =
    products.find(
      (item) =>
        String(item.id) ===
        String(productId)
    ) ||
    products.find(
      (item) =>
        String(item.productId) ===
        String(productId)
    ) ||
    products.find(
      (item) =>
        item.name === productId
    );

  if (!product) {
    throw new Error(
      'Product not found'
    );
  }

  const currentDemand =
    number(
      product.predictedDailyDemand
    );

  const currentStock =
    number(
      product.currentStock
    );

  const change =
    number(demandChange);

  const projectedDemand =
    currentDemand *
    (1 + change / 100);

  const projectedReorderPoint =
    Math.ceil(
      projectedDemand *
        number(leadTime, 3) +
        number(safetyStock, 10)
    );

  const recommendedOrderQuantity =
    Math.max(
      0,
      projectedReorderPoint -
        currentStock
    );

  const stockDuration =
    projectedDemand > 0
      ? Number(
          (
            currentStock /
            projectedDemand
          ).toFixed(1)
        )
      : 999;

  let risk = 'Low';

  if (
    stockDuration <=
    number(leadTime, 3)
  ) {
    risk = 'High';
  } else if (
    stockDuration <=
    number(leadTime, 3) + 3
  ) {
    risk = 'Medium';
  }

  return {
    productId: product.id,

    productName:
      product.name,

    currentStock,

    currentDemand,

    projectedDemand:
      Number(
        projectedDemand.toFixed(1)
      ),

    demandChange:
      change,

    leadTime:
      number(leadTime, 3),

    safetyStock:
      number(safetyStock, 10),

    projectedReorderPoint,

    requiredStock:
      projectedReorderPoint,

    recommendedOrderQuantity,

    orderQuantity:
      recommendedOrderQuantity,

    stockDuration,

    risk,

    _source: 'ml',
  };
}

/* =========================================================
   FORECAST
========================================================= */

export async function getForecast(
  productId = 'All Products',
  options = 7
) {
  const products =
    getInventoryData();

  let days = 7;

  /*
    Supports both:

    getForecast('All Products', 7)

    and

    getForecast(productId, {
      days: 7
    })
  */

  if (
    typeof options === 'number'
  ) {
    days = number(
      options,
      7
    );
  } else {
    days = number(
      options?.days,
      7
    );
  }

  /* -------------------------------------------------------
     ALL PRODUCTS FORECAST
  ------------------------------------------------------- */

  if (
    !productId ||
    productId === 'All Products'
  ) {
    const totalDailyDemand =
      products.reduce(
        (sum, product) =>
          sum +
          number(
            product.predictedDailyDemand
          ),
        0
      );

    const data = [];

    for (
      let i = 1;
      i <= days;
      i++
    ) {
      const variation =
        1 +
        Math.sin(i * 0.8) *
          0.06;

      const forecast =
        Number(
          (
            totalDailyDemand *
            variation
          ).toFixed(1)
        );

      data.push({
        day: i,

        date:
          `Day ${i}`,

        label:
          `Day ${i}`,

        historical:
          i === 1
            ? Number(
                totalDailyDemand.toFixed(
                  1
                )
              )
            : null,

        forecast,

        forecastUpper:
          Number(
            (
              forecast * 1.08
            ).toFixed(1)
          ),

        forecastLower:
          Number(
            (
              forecast * 0.92
            ).toFixed(1)
          ),

        demand:
          forecast,

        predictedDemand:
          forecast,
      });
    }

    return {
      product:
        'All Products',

      productId:
        'all',

      data,

      forecast:
        data,

      _source:
        'ml',
    };
  }

  /* -------------------------------------------------------
     SINGLE PRODUCT FORECAST
  ------------------------------------------------------- */

  const product =
    products.find(
      (item) =>
        String(item.id) ===
        String(productId)
    ) ||
    products.find(
      (item) =>
        item.name ===
        productId
    );

  if (!product) {
    throw new Error(
      'Product not found'
    );
  }

  const baseDemand =
    number(
      product.predictedDailyDemand,
      1
    );

  const data = [];

  for (
    let i = 1;
    i <= days;
    i++
  ) {
    const variation =
      1 +
      Math.sin(i * 0.8) *
        0.06;

    const forecast =
      Number(
        (
          baseDemand *
          variation
        ).toFixed(1)
      );

    data.push({
      day: i,

      date:
        `Day ${i}`,

      label:
        `Day ${i}`,

      historical:
        i === 1
          ? Number(
              baseDemand.toFixed(1)
            )
          : null,

      forecast,

      forecastUpper:
        Number(
          (
            forecast * 1.08
          ).toFixed(1)
        ),

      forecastLower:
        Number(
          (
            forecast * 0.92
          ).toFixed(1)
        ),

      demand:
        forecast,

      predictedDemand:
        forecast,
    });
  }

  return {
    product:
      product.name,

    productId:
      product.id,

    data,

    forecast:
      data,

    _source:
      'ml',
  };
}

/* =========================================================
   SALES PRODUCTS
========================================================= */

const SALES_PRODUCTS = [
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

/* =========================================================
   SALES & DEMAND STATS
========================================================= */

export async function getSalesDemandStats() {
  return {
    totalRevenue:
      181980,

    totalUnits:
      4301,

    averageDailySales:
      614,

    growth:
      9.8,

    forecastGrowth:
      11.6,

    revenueChange:
      9.8,

    unitsChange:
      7.4,

    _source:
      'sales',
  };
}

/* =========================================================
   SALES & DEMAND DATA
========================================================= */

export async function getSalesDemandData() {
  return {
    summary: {
      totalRevenue:
        181980,

      totalUnits:
        4301,

      averageDailySales:
        614,

      growth:
        9.8,

      forecastGrowth:
        11.6,
    },

    topProducts:
      SALES_PRODUCTS,

    attentionProducts: [
      {
        name:
          'Fresh Tomatoes',

        status:
          'Critical',

        stock:
          80,

        coverage:
          3,

        dailyDemand:
          28,

        action:
          'Restock now',
      },

      {
        name:
          'Fresh Milk 1L',

        status:
          'Warning',

        stock:
          120,

        coverage:
          6,

        dailyDemand:
          18,

        action:
          'Review order',
      },

      {
        name:
          'Farm Fresh Eggs',

        status:
          'Monitor',

        stock:
          250,

        coverage:
          8,

        dailyDemand:
          30,

        action:
          'Monitor',
      },
    ],

    salesPerformance: [
      {
        label: 'Mon',
        revenue: 18500,
        units: 412,
      },

      {
        label: 'Tue',
        revenue: 21200,
        units: 468,
      },

      {
        label: 'Wed',
        revenue: 19800,
        units: 441,
      },

      {
        label: 'Thu',
        revenue: 23100,
        units: 502,
      },

      {
        label: 'Fri',
        revenue: 25700,
        units: 568,
      },

      {
        label: 'Sat',
        revenue: 28900,
        units: 641,
      },

      {
        label: 'Sun',
        revenue: 26400,
        units: 589,
      },
    ],

    categoryDemand: [
      {
        category:
          'Dairy',

        demand:
          2094,

        growth:
          10.8,
      },

      {
        category:
          'Grains',

        demand:
          1240,

        growth:
          6.4,
      },

      {
        category:
          'Vegetables',

        demand:
          1120,

        growth:
          15.1,
      },

      {
        category:
          'Cooking',

        demand:
          980,

        growth:
          4.8,
      },

      {
        category:
          'Snacks',

        demand:
          760,

        growth:
          3.9,
      },
    ],

    upcomingDemand: [
      {
        name:
          'Fresh Milk 1L',

        currentStock:
          120,

        expectedStock:
          180,

        growth:
          12,

        action:
          'Restock',
      },

      {
        name:
          'Farm Fresh Eggs',

        currentStock:
          250,

        expectedStock:
          210,

        growth:
          8,

        action:
          'Healthy',
      },

      {
        name:
          'Basmati Rice 5kg',

        currentStock:
          320,

        expectedStock:
          275,

        growth:
          6,

        action:
          'Healthy',
      },

      {
        name:
          'Fresh Tomatoes',

        currentStock:
          80,

        expectedStock:
          140,

        growth:
          15,

        action:
          'Restock',
      },

      {
        name:
          'Sunflower Oil 1L',

        currentStock:
          190,

        expectedStock:
          165,

        growth:
          4,

        action:
          'Monitor',
      },
    ],

    seasonalInsights: [
      {
        title:
          'Dairy demand is rising',

        description:
          'Milk and egg demand is showing a steady upward trend.',

        impact:
          'High',
      },

      {
        title:
          'Vegetable demand increased',

        description:
          'Fresh vegetables are currently selling faster than the recent average.',

        impact:
          'High',
      },

      {
        title:
          'Cooking essentials remain stable',

        description:
          'Oil and other cooking products are showing consistent demand.',

        impact:
          'Medium',
      },
    ],

    _source:
      'sales',
  };
}

/* =========================================================
   SALES
========================================================= */

export async function getSales(
  options = {},
  legacyMetric = 'revenue'
) {
  let range =
    'daily';

  let metric =
    'revenue';

  /*
    Supports:

    getSales({
      range: 'daily',
      metric: 'units'
    })

    and:

    getSales(
      'daily',
      'units'
    )
  */

  if (
    typeof options ===
    'string'
  ) {
    range =
      options;

    metric =
      legacyMetric ||
      'revenue';
  } else {
    range =
      options.range ||
      'daily';

    metric =
      options.metric ||
      'revenue';
  }

  const data = [
    {
      label: 'Mon',
      revenue: 18500,
      units: 412,
    },

    {
      label: 'Tue',
      revenue: 21200,
      units: 468,
    },

    {
      label: 'Wed',
      revenue: 19800,
      units: 441,
    },

    {
      label: 'Thu',
      revenue: 23100,
      units: 502,
    },

    {
      label: 'Fri',
      revenue: 25700,
      units: 568,
    },

    {
      label: 'Sat',
      revenue: 28900,
      units: 641,
    },

    {
      label: 'Sun',
      revenue: 26400,
      units: 589,
    },
  ];

  return {
    range,

    metric,

    data,

    _source:
      'sales',
  };
}

/* =========================================================
   SALES STATS
========================================================= */

export async function getSalesStats() {
  const totalRevenue =
    SALES_PRODUCTS.reduce(
      (sum, item) =>
        sum +
        item.revenue,
      0
    );

  const totalUnits =
    SALES_PRODUCTS.reduce(
      (sum, item) =>
        sum +
        item.units,
      0
    );

  return {
    totalRevenue,

    totalUnits,

    averageOrderValue:
      totalUnits > 0
        ? Number(
            (
              totalRevenue /
              totalUnits
            ).toFixed(2)
          )
        : 0,

    growth:
      9.4,

    _source:
      'sales',
  };
}

/* =========================================================
   TOP PRODUCTS
========================================================= */

export async function getTopProducts() {
  return {
    data:
      SALES_PRODUCTS,

    products:
      SALES_PRODUCTS,

    _source:
      'sales',
  };
}

/* =========================================================
   DASHBOARD
========================================================= */

export async function getDashboard() {
  const inventory =
    await getInventory();

  const sales =
    await getSalesStats();

  /*
    IMPORTANT:

    Dashboard.jsx expects
    products directly on the
    dashboard response.

    Previously products were
    nested inside inventory,
    which caused the Overview
    page to receive an empty
    product list.
  */

  return {
    products:
      inventory.products,

    totalProducts:
      inventory.stats.totalProducts,

    critical:
      inventory.stats.critical,

    attention:
      inventory.stats.attention,

    healthy:
      inventory.stats.healthy,

    recommendedUnits:
      inventory.stats.recommendedUnits,

    targetInventory:
      inventory.stats.targetInventory,

    inventory: {
      totalProducts:
        inventory.stats.totalProducts,

      critical:
        inventory.stats.critical,

      attention:
        inventory.stats.attention,

      healthy:
        inventory.stats.healthy,

      recommendedUnits:
        inventory.stats.recommendedUnits,

      targetInventory:
        inventory.stats.targetInventory,
    },

    sales,

    topProducts:
      SALES_PRODUCTS,

    _source:
      'dashboard',
  };
}

/* =========================================================
   ASSISTANT
========================================================= */

export async function getAssistantResponse(
  message = ''
) {
  const text =
    String(message)
      .toLowerCase()
      .trim();

  const inventory =
    getInventoryData();

  if (
    text.includes('critical') ||
    text.includes('risk')
  ) {
    const critical =
      inventory.filter(
        (item) =>
          item.risk ===
          'High'
      );

    return {
      response:
        `There are ${critical.length} products requiring immediate attention. The highest-priority items include ${critical
          .slice(0, 5)
          .map(
            (item) =>
              item.name
          )
          .join(', ')}.`,

      products:
        critical,
    };
  }

  if (
    text.includes('reorder') ||
    text.includes('order')
  ) {
    const items =
      inventory
        .filter(
          (item) =>
            item.recommendedQty >
            0
        )
        .sort(
          (a, b) =>
            b.recommendedQty -
            a.recommendedQty
        );

    return {
      response:
        `There are ${items.length} products with recommended replenishment. The largest recommended quantities are for ${items
          .slice(0, 5)
          .map(
            (item) =>
              `${item.name} (${item.recommendedQty} units)`
          )
          .join(', ')}.`,

      products:
        items,
    };
  }

  if (
    text.includes('inventory') ||
    text.includes('stock')
  ) {
    return {
      response:
        `StockPilot is currently tracking ${inventory.length} products: ${inventory.filter(
          (item) =>
            item.risk ===
            'High'
        ).length} critical, ${inventory.filter(
          (item) =>
            item.risk ===
            'Medium'
        ).length} needing attention, and ${inventory.filter(
          (item) =>
            item.risk ===
            'Low'
        ).length} healthy.`,

      products:
        inventory,
    };
  }

  return {
    response:
      'I can help you review inventory risk, reorder requirements, stock levels, sales performance, and demand trends.',

    products: [],
  };
}

/* =========================================================
   REPORTS
========================================================= */

export async function getReports() {
  const inventory =
    getInventoryData();

  const critical =
    inventory.filter(
      (item) =>
        item.risk ===
        'High'
    );

  const attention =
    inventory.filter(
      (item) =>
        item.risk ===
        'Medium'
    );

  const healthy =
    inventory.filter(
      (item) =>
        item.risk ===
        'Low'
    );

  return {
    generatedAt:
      new Date().toISOString(),

    summary: {
      totalProducts:
        inventory.length,

      critical:
        critical.length,

      attention:
        attention.length,

      healthy:
        healthy.length,

      recommendedUnits:
        inventory.reduce(
          (sum, item) =>
            sum +
            number(
              item.recommendedQty
            ),
          0
        ),
    },

    critical,

    attention,

    healthy,

    products:
      inventory,

    _source:
      'reports',
  };
}

/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

export async function getProduct(
  productId
) {
  const products =
    getInventoryData();

  return (
    products.find(
      (item) =>
        String(item.id) ===
        String(productId)
    ) ||

    products.find(
      (item) =>
        item.name ===
        productId
    ) ||

    null
  );
}

/* =========================================================
   UPDATE INVENTORY
========================================================= */

export async function updateInventory(
  productId,
  newStock
) {
  const products =
    getInventoryData();

  const product =
    products.find(
      (item) =>
        String(item.id) ===
        String(productId)
    );

  if (!product) {
    throw new Error(
      'Product not found'
    );
  }

  product.currentStock =
    number(newStock);

  product.stock =
    number(newStock);

  product.daysCoverage =
    product.predictedDailyDemand >
    0
      ? Number(
          (
            product.currentStock /
            product.predictedDailyDemand
          ).toFixed(1)
        )
      : 999;

  product.recommendedQty =
    Math.max(
      0,
      Math.ceil(
        product.reorderPoint -
          product.currentStock
      )
    );

  if (
    CRITICAL_PRODUCTS.has(
      product.name
    )
  ) {
    product.risk =
      'High';
  } else if (
    ATTENTION_PRODUCTS.has(
      product.name
    )
  ) {
    product.risk =
      'Medium';
  } else {
    product.risk =
      'Low';
  }

  product.status =
    product.risk === 'High'
      ? 'Critical'
      : product.risk === 'Medium'
        ? 'Attention'
        : 'Healthy';

  product.action =
    product.risk === 'High'
      ? 'Order Now'
      : product.risk === 'Medium'
        ? 'Review'
        : 'View';

  return {
    success:
      true,

    product,
  };
}

/* =========================================================
   RESET INVENTORY CACHE
========================================================= */

export function resetInventoryCache() {
  inventoryCache =
    null;
}

/* =========================================================
   PRODUCT CATALOG EXPORT
========================================================= */

export {
  PRODUCT_CATALOG,
};