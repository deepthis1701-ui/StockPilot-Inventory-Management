import { useState, useEffect, useMemo } from 'react';

import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  ShoppingCart,
  ArrowLeft,
  Info,
  Save,
  X,
  TrendingUp,
  Clock3,
  RefreshCw,
  Boxes,
  SlidersHorizontal,
} from 'lucide-react';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { getInventory, updateInventory } from '../services/api.js';
import InventoryActions from '../components/InventoryActions.jsx';
import { PRODUCT_CATALOG } from '../data/productCatalog.js';

import {
  PRODUCTS,
  CATEGORIES,
  stockStatus,
} from '../data/sampleData.js';

import '../styles/dashboard.css';


/* =========================================================
   STATUS CONFIG
========================================================= */

const STATUS_BADGE = {
  healthy: {
    label: 'Healthy',
    className: 'status-healthy',
  },

  low: {
    label: 'Low Stock',
    className: 'status-low',
  },

  critical: {
    label: 'Critical',
    className: 'status-critical',
  },

  out: {
    label: 'Out of Stock',
    className: 'status-out',
  },

  overstock: {
    label: 'Overstocked',
    className: 'status-overstock',
  },
};


/* =========================================================
   BUSINESS CATEGORY
========================================================= */

function getBusinessCategory(productName, existingCategory) {
  const name = String(productName || '').toLowerCase();
  const existing = String(existingCategory || '').trim();

  const validCategories = [
    'Grains',
    'Cooking',
    'Dairy',
    'Snacks',
    'Beverages',
    'Personal Care',
    'Cleaning',
  ];

  if (validCategories.includes(existing)) {
    return existing;
  }

  if (
    /rice|wheat|flour|dal|oats|pasta|macaroni|vermicelli|poha|rava|besan|noodles|corn flakes|cornflakes|cereal|breakfast mix|ready-to-cook/.test(
      name
    )
  ) {
    return 'Grains';
  }

  if (/milk|butter|cheese|curd|yogurt|paneer/.test(name)) {
    return 'Dairy';
  }

  if (
    /tea|coffee|juice|drink|water|energy|coconut water|soft drink/.test(
      name
    )
  ) {
    return 'Beverages';
  }

  if (
    /soap|shampoo|toothpaste|toothbrush|conditioner|face wash|cream/.test(
      name
    )
  ) {
    return 'Personal Care';
  }

  if (
    /detergent|cleaner|washing powder|dishwash|floor cleaner/.test(
      name
    )
  ) {
    return 'Cleaning';
  }

  if (
    /cookie|biscuit|chips|chocolate|cracker|wafer|granola|peanut|cashew|almond|dry fruit|corn snack/.test(
      name
    )
  ) {
    return 'Snacks';
  }

  if (
    /oil|sugar|salt|spice|sauce|ketchup|mayonnaise|tamarind|pickle|chutney|honey|jaggery|cooking|paste|coconut milk|turmeric|chilli powder|coriander|masala|pepper|cumin|mustard|cardamom|cinnamon/.test(
      name
    )
  ) {
    return 'Cooking';
  }

  if (
    /banana|apple|orange|mango|tomato|potato|onion|carrot|mint|peas|vegetable|chicken|fish|egg|frozen/.test(
      name
    )
  ) {
    return 'Cooking';
  }

  return 'Cooking';
}


/* =========================================================
   PRODUCT NAME
========================================================= */

function getProductName(product) {
  const productId =
    product?.id ||
    product?.productId ||
    product?.product_id;

  return (
    product?.name ||
    PRODUCT_CATALOG?.[productId]?.name ||
    product?.product_name ||
    `Product ${productId || ''}`.trim()
  );
}


/* =========================================================
   ENTERPRISE UI STYLES
========================================================= */

function InventoryEnterpriseStyles() {
  return (
    <style>{`
      .sp-inventory-page {
        min-height: 100%;
        padding: 30px 32px 42px;
        background: #f5f7fa;
        color: #172033;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .sp-inventory-page *,
      .sp-detail-page * {
        box-sizing: border-box;
      }

      .sp-page-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 24px;
      }

      .sp-page-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 7px;
        color: #64748b;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      .sp-page-header h1 {
        margin: 0;
        color: #111827;
        font-size: 28px;
        line-height: 1.2;
        font-weight: 750;
        letter-spacing: -0.025em;
      }

      .sp-page-header p {
        margin: 7px 0 0;
        color: #64748b;
        font-size: 14px;
      }

      .sp-header-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 13px;
        border: 1px solid #dbe2ea;
        border-radius: 8px;
        background: #ffffff;
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
      }

      .sp-header-meta svg {
        color: #2563eb;
      }

      /* KPI CARDS */

      .sp-kpi-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 20px;
      }

      .sp-kpi-card {
        position: relative;
        min-height: 116px;
        padding: 18px;
        border: 1px solid #dfe5ec;
        border-radius: 10px;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        cursor: pointer;
        text-align: left;
        transition:
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          transform 0.18s ease;
      }

      .sp-kpi-card:hover {
        border-color: #b9c7d8;
        box-shadow: 0 5px 16px rgba(15, 23, 42, 0.07);
        transform: translateY(-1px);
      }

      .sp-kpi-card.active {
        border-color: #2563eb;
        box-shadow: 0 0 0 1px #2563eb;
      }

      .sp-kpi-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 15px;
      }

      .sp-kpi-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 8px;
      }

      .sp-kpi-card.total .sp-kpi-icon {
        background: #eff6ff;
        color: #2563eb;
      }

      .sp-kpi-card.healthy .sp-kpi-icon {
        background: #ecfdf3;
        color: #15803d;
      }

      .sp-kpi-card.warning .sp-kpi-icon {
        background: #fff7ed;
        color: #d97706;
      }

      .sp-kpi-card.danger .sp-kpi-icon {
        background: #fef2f2;
        color: #dc2626;
      }

      .sp-kpi-card.overstock .sp-kpi-icon {
        background: #f5f3ff;
        color: #7c3aed;
      }

      .sp-kpi-arrow {
        color: #94a3b8;
        transition: transform 0.18s ease;
      }

      .sp-kpi-card:hover .sp-kpi-arrow {
        transform: translateX(2px);
      }

      .sp-kpi-title {
        display: block;
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
      }

      .sp-kpi-value {
        display: block;
        margin-top: 4px;
        color: #111827;
        font-size: 25px;
        line-height: 1;
        font-weight: 750;
        letter-spacing: -0.02em;
      }

      /* FILTER TOOLBAR */

      .sp-filter-card {
        display: flex;
        align-items: flex-end;
        gap: 16px;
        padding: 17px;
        margin-bottom: 18px;
        border: 1px solid #dfe5ec;
        border-radius: 10px;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      }

      .sp-search {
        position: relative;
        flex: 1;
        min-width: 250px;
      }

      .sp-search > svg {
        position: absolute;
        left: 13px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
      }

      .sp-search input {
        width: 100%;
        height: 42px;
        padding: 0 40px 0 40px;
        border: 1px solid #d6dde7;
        border-radius: 7px;
        outline: none;
        background: #ffffff;
        color: #1e293b;
        font-size: 13px;
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
      }

      .sp-search input::placeholder {
        color: #94a3b8;
      }

      .sp-search input:focus,
      .sp-select:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.09);
      }

      .sp-clear-search {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border: 0;
        border-radius: 5px;
        background: transparent;
        color: #64748b;
        cursor: pointer;
      }

      .sp-clear-search:hover {
        background: #f1f5f9;
        color: #1e293b;
      }

      .sp-filter-group {
        width: 190px;
      }

      .sp-filter-group label {
        display: block;
        margin-bottom: 6px;
        color: #475569;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .sp-select {
        width: 100%;
        height: 42px;
        padding: 0 34px 0 12px;
        border: 1px solid #d6dde7;
        border-radius: 7px;
        outline: none;
        background: #ffffff;
        color: #334155;
        font-size: 13px;
        cursor: pointer;
      }

      .sp-filter-indicator {
        display: flex;
        align-items: center;
        gap: 7px;
        min-height: 42px;
        padding: 0 12px;
        border-radius: 7px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 12px;
        font-weight: 650;
      }

      /* TABLE */

      .sp-table-card {
        overflow: hidden;
        border: 1px solid #dfe5ec;
        border-radius: 10px;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      }

      .sp-table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 72px;
        padding: 16px 20px;
        border-bottom: 1px solid #e7ebf0;
      }

      .sp-table-title {
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .sp-table-title-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 7px;
        background: #eff6ff;
        color: #2563eb;
      }

      .sp-table-header h2 {
        margin: 0;
        color: #1e293b;
        font-size: 15px;
        font-weight: 700;
      }

      .sp-table-header p {
        margin: 3px 0 0;
        color: #94a3b8;
        font-size: 12px;
      }

      .sp-table-filter-status {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        font-size: 12px;
      }

      .sp-table-filter-status strong {
        color: #1e293b;
      }

      .sp-table-wrapper {
        width: 100%;
        overflow-x: auto;
      }

      .sp-table {
        width: 100%;
        min-width: 950px;
        border-collapse: collapse;
      }

      .sp-table th {
        height: 46px;
        padding: 0 18px;
        border-bottom: 1px solid #e7ebf0;
        background: #f8fafc;
        color: #64748b;
        font-size: 10px;
        font-weight: 750;
        letter-spacing: 0.055em;
        text-align: left;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .sp-sortable-header {
        cursor: pointer;
        user-select: none;
      }

      .sp-sortable-header:hover {
        color: #1d4ed8;
      }

      .sp-sort {
        margin-left: 7px;
        color: #94a3b8;
        font-size: 12px;
      }

      .sp-table td {
        height: 68px;
        padding: 10px 18px;
        border-bottom: 1px solid #eef1f5;
        color: #334155;
        font-size: 13px;
        vertical-align: middle;
      }

      .sp-table-row {
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .sp-table-row:hover {
        background: #f8fbff;
      }

      .sp-table-row:last-child td {
        border-bottom: 0;
      }

      .sp-product-cell {
        display: flex;
        align-items: center;
        gap: 11px;
      }

      .sp-product-icon {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid #dbe5f0;
        border-radius: 8px;
        background: #f8fafc;
        color: #475569;
      }

      .sp-product-name {
        color: #172033;
        font-weight: 650;
      }

      .sp-product-subtitle {
        margin-top: 3px;
        color: #94a3b8;
        font-size: 11px;
      }

      .sp-category {
        display: inline-flex;
        align-items: center;
        padding: 5px 8px;
        border: 1px solid #e2e8f0;
        border-radius: 5px;
        background: #f8fafc;
        color: #475569;
        font-size: 11px;
        font-weight: 600;
      }

      .sp-number {
        color: #1e293b;
        font-weight: 700;
      }

      .sp-unit {
        display: block;
        margin-top: 2px;
        color: #94a3b8;
        font-size: 10px;
      }

      .sp-days {
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .sp-days-indicator {
        width: 5px;
        height: 27px;
        border-radius: 4px;
        background: #22c55e;
      }

      .sp-days-indicator.warning {
        background: #f59e0b;
      }

      .sp-days-indicator.danger {
        background: #ef4444;
      }

      .sp-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 9px;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }

      .sp-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .sp-status.status-healthy {
        background: #ecfdf3;
        color: #15803d;
      }

      .sp-status.status-healthy .sp-status-dot {
        background: #22c55e;
      }

      .sp-status.status-low {
        background: #fff7ed;
        color: #c2410c;
      }

      .sp-status.status-low .sp-status-dot {
        background: #f97316;
      }

      .sp-status.status-critical {
        background: #fef2f2;
        color: #b91c1c;
      }

      .sp-status.status-critical .sp-status-dot {
        background: #ef4444;
      }

      .sp-status.status-out {
        background: #fef2f2;
        color: #991b1b;
      }

      .sp-status.status-out .sp-status-dot {
        background: #dc2626;
      }

      .sp-status.status-overstock {
        background: #f5f3ff;
        color: #6d28d9;
      }

      .sp-status.status-overstock .sp-status-dot {
        background: #8b5cf6;
      }

      .sp-empty {
        padding: 65px 20px !important;
        text-align: center !important;
      }

      .sp-empty-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        margin: 0 auto 12px;
        border-radius: 10px;
        background: #f1f5f9;
        color: #94a3b8;
      }

      .sp-empty strong {
        display: block;
        color: #334155;
        font-size: 14px;
      }

      .sp-empty span {
        display: block;
        margin-top: 5px;
        color: #94a3b8;
        font-size: 12px;
      }

      /* PAGINATION */

      .sp-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 62px;
        padding: 12px 20px;
        border-top: 1px solid #e7ebf0;
        color: #64748b;
        font-size: 12px;
      }

      .sp-pagination-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .sp-pagination button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 1px solid #dbe2ea;
        border-radius: 6px;
        background: #ffffff;
        color: #475569;
        cursor: pointer;
      }

      .sp-pagination button:hover:not(:disabled) {
        border-color: #93c5fd;
        background: #eff6ff;
        color: #2563eb;
      }

      .sp-pagination button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .sp-page-number {
        min-width: 62px;
        text-align: center;
        color: #334155;
        font-weight: 650;
      }

      /* DETAIL PAGE */

      .sp-detail-page {
        min-height: 100%;
        padding: 30px 32px 42px;
        background: #f5f7fa;
        color: #172033;
      }

      .sp-detail-top {
        margin-bottom: 20px;
      }

      .sp-back-button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 0;
        margin-bottom: 17px;
        border: 0;
        background: transparent;
        color: #475569;
        font-size: 13px;
        font-weight: 650;
        cursor: pointer;
      }

      .sp-back-button:hover {
        color: #2563eb;
      }

      .sp-detail-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }

      .sp-detail-heading h1 {
        margin: 0;
        color: #111827;
        font-size: 26px;
        font-weight: 750;
        letter-spacing: -0.02em;
      }

      .sp-detail-heading p {
        margin: 6px 0 0;
        color: #64748b;
        font-size: 13px;
      }

      /* UPDATE STOCK */

      .sp-update-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 18px 20px;
        margin-bottom: 18px;
        border: 1px solid #dfe5ec;
        border-radius: 10px;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      }

      .sp-update-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .sp-update-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: #eff6ff;
        color: #2563eb;
      }

      .sp-update-info strong {
        display: block;
        color: #1e293b;
        font-size: 13px;
      }

      .sp-update-info span {
        display: block;
        margin-top: 3px;
        color: #94a3b8;
        font-size: 11px;
      }

      .sp-update-form {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .sp-update-form input {
        width: 130px;
        height: 40px;
        padding: 0 11px;
        border: 1px solid #d6dde7;
        border-radius: 7px;
        outline: none;
        color: #1e293b;
        font-size: 13px;
        font-weight: 650;
      }

      .sp-update-form input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.09);
      }

      .sp-save-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        height: 40px;
        padding: 0 15px;
        border: 0;
        border-radius: 7px;
        background: #1d4ed8;
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      .sp-save-button:hover:not(:disabled) {
        background: #1e40af;
      }

      .sp-save-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* DETAIL STATS */

      .sp-detail-stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }

      .sp-detail-stat {
        min-height: 105px;
        padding: 15px 17px;
        border: 1px solid #dfe5ec;
        border-radius: 9px;
        background: #ffffff;
      }

      .sp-detail-stat span {
        display: block;
        color: #64748b;
        font-size: 11px;
        font-weight: 600;
      }

      .sp-detail-stat strong {
        display: block;
        margin-top: 10px;
        color: #172033;
        font-size: 22px;
        font-weight: 750;
      }

      .sp-detail-stat small {
        display: block;
        margin-top: 3px;
        color: #94a3b8;
        font-size: 10px;
      }

      /* CHARTS */

      .sp-chart-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 18px;
      }

      .sp-chart-card {
        min-width: 0;
        padding: 19px;
        border: 1px solid #dfe5ec;
        border-radius: 10px;
        background: #ffffff;
      }

      .sp-chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .sp-chart-header h3 {
        margin: 0;
        color: #1e293b;
        font-size: 14px;
        font-weight: 700;
      }

      .sp-chart-header p {
        margin: 4px 0 0;
        color: #94a3b8;
        font-size: 11px;
      }

      .sp-chart {
        height: 280px;
      }

      .sp-empty-chart {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        height: 280px;
        color: #94a3b8;
        font-size: 12px;
      }

      /* RECOMMENDATION */

      .sp-recommendation {
        display: flex;
        align-items: flex-start;
        gap: 13px;
        padding: 18px 20px;
        border: 1px solid #dfe5ec;
        border-radius: 10px;
        background: #ffffff;
      }

      .sp-recommendation.warning {
        border-left: 4px solid #f59e0b;
      }

      .sp-recommendation.info {
        border-left: 4px solid #6366f1;
      }

      .sp-recommendation.success {
        border-left: 4px solid #22c55e;
      }

      .sp-recommendation-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        flex: 0 0 auto;
        border-radius: 8px;
        background: #f8fafc;
        color: #475569;
      }

      .sp-recommendation h3 {
        margin: 1px 0 5px;
        color: #1e293b;
        font-size: 13px;
        font-weight: 700;
      }

      .sp-recommendation p {
        margin: 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.6;
      }

      /* RESPONSIVE */

      @media (max-width: 1200px) {
        .sp-kpi-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .sp-detail-stats {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }

      @media (max-width: 900px) {
        .sp-inventory-page,
        .sp-detail-page {
          padding: 22px 18px 32px;
        }

        .sp-kpi-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .sp-filter-card {
          align-items: stretch;
          flex-wrap: wrap;
        }

        .sp-search {
          flex-basis: 100%;
        }

        .sp-filter-group {
          flex: 1;
          width: auto;
        }

        .sp-detail-stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .sp-chart-grid {
          grid-template-columns: 1fr;
        }

        .sp-update-card {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 600px) {
        .sp-page-header,
        .sp-detail-heading {
          align-items: flex-start;
          flex-direction: column;
        }

        .sp-kpi-grid {
          grid-template-columns: 1fr;
        }

        .sp-filter-group {
          flex-basis: 100%;
        }

        .sp-pagination {
          align-items: flex-start;
          flex-direction: column;
          gap: 12px;
        }

        .sp-update-form {
          width: 100%;
        }

        .sp-update-form input {
          flex: 1;
        }

        .sp-detail-stats {
          grid-template-columns: 1fr 1fr;
        }
      }
    `}</style>
  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const badge =
    STATUS_BADGE[status] ||
    STATUS_BADGE.healthy;

  return (
    <span
      className={`sp-status ${badge.className}`}
    >
      <span className="sp-status-dot" />
      {badge.label}
    </span>
  );
}


/* =========================================================
   SUMMARY CARDS
========================================================= */

function InventoryStats({
  stats,
  activeStatus,
  onStatusClick,
}) {
  const cards = [
    {
      key: 'all',
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      className: 'total',
    },
    {
      key: 'healthy',
      title: 'In Stock',
      value: stats.inStock,
      icon: Boxes,
      className: 'healthy',
    },
    {
      key: 'low',
      title: 'Low Stock',
      value: stats.lowStock,
      icon: AlertTriangle,
      className: 'warning',
    },
    {
      key: 'out',
      title: 'Out of Stock',
      value: stats.outOfStock,
      icon: ShoppingCart,
      className: 'danger',
    },
    {
      key: 'overstock',
      title: 'Overstocked',
      value: stats.overstocked,
      icon: Package,
      className: 'overstock',
    },
  ];

  return (
    <div className="sp-kpi-grid">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className={`sp-kpi-card ${card.className} ${
              activeStatus === card.key
                ? 'active'
                : ''
            }`}
            onClick={() =>
              onStatusClick(card.key)
            }
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' ||
                event.key === ' '
              ) {
                event.preventDefault();
                onStatusClick(card.key);
              }
            }}
          >
            <div className="sp-kpi-top">
              <div className="sp-kpi-icon">
                <Icon size={18} />
              </div>

              <span className="sp-kpi-arrow">
                →
              </span>
            </div>

            <span className="sp-kpi-title">
              {card.title}
            </span>

            <strong className="sp-kpi-value">
              {card.value}
            </strong>
          </div>
        );
      })}
    </div>
  );
}


/* =========================================================
   PRODUCT DETAIL
========================================================= */

function ProductDetail({
  product,
  onBack,
  onUpdateStock,
}) {
  const [stockInput, setStockInput] =
    useState(Number(product?.stock ?? 0));

  const [saving, setSaving] =
    useState(false);

  const safeProduct = useMemo(() => {
    const name = getProductName(product);

    const stock =
      Number(product?.stock ?? 0);

    const avgDailySales =
      Number(
        product?.avgDailySales ??
          product?.avg_daily_sales ??
          0
      );

    const forecastDailyDemand =
      Number(
        product?.predictedDemand ??
          product?.predicted_daily_demand ??
          product?.forecastDailyDemand ??
          product?.forecast_daily_demand ??
          0
      );

    const finalForecast =
      forecastDailyDemand > 0
        ? forecastDailyDemand
        : avgDailySales;

    const reorderPoint =
      Number(
        product?.reorderPoint ??
          product?.reorder_point ??
          0
      );

    const safetyStock =
      Number(
        product?.safetyStock ??
          product?.safety_stock ??
          0
      );

    const leadTimeDays =
      Number(
        product?.leadTimeDays ??
          product?.lead_time_days ??
          product?.leadTime ??
          0
      );

    const recommendedQty =
      Number(
        product?.recommendedQty ??
          product?.recommended_order_quantity ??
          0
      );

    const category =
      getBusinessCategory(
        name,
        product?.category
      );

    const daysLeft =
      finalForecast > 0
        ? stock / finalForecast
        : Infinity;

    return {
      ...product,
      name,
      stock,
      avgDailySales,
      predictedDemand: finalForecast,
      reorderPoint,
      safetyStock,
      leadTimeDays,
      recommendedQty,
      category,
      daysRemaining: daysLeft,

      price:
        product?.price ??
        product?.unitPrice ??
        0,

      unit:
        product?.unit ??
        'units',

      supplier:
        product?.supplier ??
        product?.supplierName ??
        'Supplier not specified',

      salesHistory:
        Array.isArray(
          product?.salesHistory
        )
          ? product.salesHistory
          : [],

      risk:
        product?.overall_risk ??
        product?.risk ??
        'low',

      stockoutRisk:
        product?.stockout_risk ??
        product?.stockoutRisk ??
        'low',

      overstockRisk:
        product?.overstock_risk ??
        product?.overstockRisk ??
        'low',
    };
  }, [product]);

  useEffect(() => {
    setStockInput(
      safeProduct.stock
    );
  }, [safeProduct.stock]);

  const status =
    stockStatus(safeProduct);

  const forecast7Days =
    safeProduct.predictedDemand * 7;

  const forecastChart =
    Array.from(
      { length: 7 },
      (_, index) => ({
        day: `Day ${index + 1}`,
        demand:
          safeProduct.predictedDemand *
          (1 + index * 0.01),
      })
    );

  const handleSave = async () => {
    const newStock =
      Number(stockInput);

    if (
      !Number.isFinite(newStock) ||
      newStock < 0
    ) {
      return;
    }

    setSaving(true);

    try {
      await onUpdateStock(
        product?.id ||
          product?.productId ||
          product?.product_id,
        Math.floor(newStock)
      );
    } finally {
      setSaving(false);
    }
  };

  const recommendation =
    safeProduct.stock <=
    safeProduct.reorderPoint
      ? {
          type: 'warning',
          title:
            'Replenishment Recommended',
          text: `Current stock is below the recommended reorder point. Consider ordering approximately ${Math.max(
            0,
            Math.ceil(
              safeProduct.recommendedQty ||
                safeProduct.reorderPoint -
                  safeProduct.stock
            )
          )} ${safeProduct.unit}.`,
        }
      : safeProduct.overstockRisk ===
        'high'
      ? {
          type: 'info',
          title: 'Review Overstock',
          text:
            'Inventory is above the expected requirement. Consider reducing the next replenishment quantity.',
        }
      : {
          type: 'success',
          title:
            'Inventory Looks Healthy',
          text:
            'Current stock is within the expected inventory range.',
        };

  return (
    <>
      <InventoryEnterpriseStyles />

      <div className="sp-detail-page">

        {/* HEADER */}

        <div className="sp-detail-top">
          <button
            className="sp-back-button"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft size={17} />
            Back to Inventory
          </button>

          <div className="sp-detail-heading">
            <div>
              <h1>
                {safeProduct.name}
              </h1>

              <p>
                {safeProduct.category}
                {safeProduct.supplier
                  ? ` • ${safeProduct.supplier}`
                  : ''}
              </p>
            </div>

            <StatusBadge status={status} />
          </div>
        </div>


        {/* UPDATE STOCK */}

        <div className="sp-update-card">

          <div className="sp-update-info">

            <div className="sp-update-icon">
              <RefreshCw size={19} />
            </div>

            <div>
              <strong>
                Update Current Stock
              </strong>

              <span>
                Change the available quantity
                for this product.
              </span>
            </div>

          </div>

          <div className="sp-update-form">

            <input
              type="number"
              min="0"
              value={stockInput}
              onChange={(event) =>
                setStockInput(
                  event.target.value
                )
              }
            />

            <button
              className="sp-save-button"
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />

              {saving
                ? 'Saving...'
                : 'Save Stock'}
            </button>

          </div>

        </div>


        {/* DETAIL STATS */}

        <div className="sp-detail-stats">

          <div className="sp-detail-stat">
            <span>Current Stock</span>
            <strong>
              {safeProduct.stock}
            </strong>
            <small>
              {safeProduct.unit}
            </small>
          </div>

          <div className="sp-detail-stat">
            <span>
              Forecast Daily Demand
            </span>
            <strong>
              {safeProduct.predictedDemand.toFixed(
                2
              )}
            </strong>
            <small>
              units / day
            </small>
          </div>

          <div className="sp-detail-stat">
            <span>
              Predicted 7-Day Demand
            </span>
            <strong>
              {forecast7Days.toFixed(1)}
            </strong>
            <small>
              units
            </small>
          </div>

          <div className="sp-detail-stat">
            <span>
              Reorder Point
            </span>
            <strong>
              {safeProduct.reorderPoint.toFixed(
                2
              )}
            </strong>
            <small>
              units
            </small>
          </div>

          <div className="sp-detail-stat">
            <span>
              Safety Stock
            </span>
            <strong>
              {safeProduct.safetyStock.toFixed(
                2
              )}
            </strong>
            <small>
              units
            </small>
          </div>

          <div className="sp-detail-stat">
            <span>
              Lead Time
            </span>
            <strong>
              {safeProduct.leadTimeDays || 0}
            </strong>
            <small>
              days
            </small>
          </div>

          <div className="sp-detail-stat">
            <span>
              Days Remaining
            </span>
            <strong>
              {Number.isFinite(
                safeProduct.daysRemaining
              )
                ? safeProduct.daysRemaining.toFixed(
                    1
                  )
                : '∞'}
            </strong>
            <small>
              days
            </small>
          </div>

          <div className="sp-detail-stat">
            <span>
              Risk Level
            </span>
            <strong>
              {String(
                safeProduct.risk || 'low'
              ).toUpperCase()}
            </strong>
            <small>
              inventory risk
            </small>
          </div>

        </div>


        {/* CHARTS */}

        <div className="sp-chart-grid">

          {/* SALES HISTORY */}

          <div className="sp-chart-card">

            <div className="sp-chart-header">
              <div>
                <h3>
                  Sales History
                </h3>

                <p>
                  Recent product demand
                </p>
              </div>

              <TrendingUp
                size={18}
                color="#2563eb"
              />
            </div>

            <div className="sp-chart">

              {safeProduct.salesHistory
                .length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >
                  <AreaChart
                    data={
                      safeProduct.salesHistory
                    }
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e8edf3"
                    />

                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 11,
                        fill: '#64748b',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: '#64748b',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip />

                    <Area
                      type="monotone"
                      dataKey="quantity"
                      stroke="#2563eb"
                      fill="#dbeafe"
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>

              ) : (

                <div className="sp-empty-chart">
                  <Info size={18} />
                  Sales history is not
                  available.
                </div>

              )}

            </div>

          </div>


          {/* DEMAND FORECAST */}

          <div className="sp-chart-card">

            <div className="sp-chart-header">
              <div>
                <h3>
                  Demand Forecast
                </h3>

                <p>
                  Expected demand for the
                  next 7 days
                </p>
              </div>

              <Clock3
                size={18}
                color="#2563eb"
              />
            </div>

            <div className="sp-chart">

              <ResponsiveContainer
                width="100%"
                height={280}
              >
                <AreaChart
                  data={forecastChart}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e8edf3"
                  />

                  <XAxis
                    dataKey="day"
                    tick={{
                      fontSize: 11,
                      fill: '#64748b',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: '#64748b',
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(
                        2
                      )} units`,
                      'Expected Demand',
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="demand"
                    stroke="#2563eb"
                    fill="#dbeafe"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>

            </div>

          </div>

        </div>


        {/* RECOMMENDATION */}

        <div
          className={`sp-recommendation ${recommendation.type}`}
        >

          <div className="sp-recommendation-icon">

            {recommendation.type ===
            'warning' ? (
              <AlertTriangle size={19} />
            ) : recommendation.type ===
              'info' ? (
              <Info size={19} />
            ) : (
              <Package size={19} />
            )}

          </div>

          <div>
            <h3>
              {recommendation.title}
            </h3>

            <p>
              {recommendation.text}
            </p>
          </div>

        </div>

      </div>
    </>
  );
}


/* =========================================================
   MAIN INVENTORY PAGE
========================================================= */

export default function Inventory() {

  const [data, setData] =
    useState(null);

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [search, setSearch] =
    useState('');

  const [categoryFilter, setCategoryFilter] =
    useState('all');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [sortKey, setSortKey] =
    useState('name');

  const [sortDir, setSortDir] =
    useState('asc');

  const [page, setPage] =
    useState(1);

  const [pageSize] =
    useState(8);


  /* =======================================================
     LOAD INVENTORY
  ======================================================= */

  const refreshInventory = async () => {
    const refreshed = await getInventory();
    setData(refreshed);
    return refreshed;
  };

  useEffect(() => {
    refreshInventory().catch((error) => {
      console.error('Failed to load inventory:', error);
      setData({ products: [], stats: { totalProducts: 0, critical: 0, attention: 0, healthy: 0, unknown: 0, recommendedUnits: 0, inventoryValue: 0 } });
    });
  }, []);


  /* =======================================================
     NORMALIZE PRODUCTS
  ======================================================= */

  const products = useMemo(() => {

    const baseProducts = Array.isArray(data?.products) ? data.products : [];

    return baseProducts.map(
      (product) => {

        const updatedStock =
          Number(
            product.stock ?? 0
          );

        const updatedProduct = {
          ...product,

          stock:
            updatedStock,

          avgDailySales:
            Number(
              product.avgDailySales ??
                product.avg_daily_sales ??
                0
            ),

          predictedDemand:
            Number(
              product.predictedDemand ??
                product.predicted_daily_demand ??
                product.forecastDailyDemand ??
                product.forecast_daily_demand ??
                0
            ),

          safetyStock:
            Number(
              product.safetyStock ??
                product.safety_stock ??
                0
            ),

          reorderPoint:
            Number(
              product.reorderPoint ??
                product.reorder_point ??
                0
            ),

          recommendedQty:
            Number(
              product.recommendedQty ??
                product.recommended_order_quantity ??
                0
            ),
        };

        const productName =
          getProductName(
            updatedProduct
          );

        const category =
          getBusinessCategory(
            productName,
            updatedProduct.category
          );

        const demandForDays =
          updatedProduct.predictedDemand >
          0
            ? updatedProduct.predictedDemand
            : updatedProduct.avgDailySales;

        const calculatedDays =
          demandForDays > 0
            ? updatedStock /
              demandForDays
            : Infinity;

        return {
          ...updatedProduct,

          name:
            productName,

          category,

          daysRemaining:
            calculatedDays,

          status:
            stockStatus(
              updatedProduct
            ),
        };
      }
    );

  }, [data]);


  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {

    if (!products.length) {
      return {
        totalProducts: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        overstocked: 0,
      };
    }

    return {
      totalProducts:
        products.length,

      inStock:
        products.filter(
          (product) =>
            product.stock > 0
        ).length,

      lowStock:
        products.filter(
          (product) =>
            product.status === 'low' ||
            product.status === 'critical'
        ).length,

      outOfStock:
        products.filter(
          (product) =>
            product.status === 'out'
        ).length,

      overstocked:
        products.filter(
          (product) =>
            product.status ===
            'overstock'
        ).length,
    };

  }, [products]);


  /* =======================================================
     FILTER PRODUCTS
  ======================================================= */

  const filteredProducts =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase();

      let result =
        products.filter(
          (product) => {

            const matchesSearch =
              !searchValue ||
              String(
                product.name || ''
              )
                .toLowerCase()
                .includes(
                  searchValue
                );

            const matchesCategory =
              categoryFilter === 'all' ||
              product.category ===
                categoryFilter;

            let matchesStatus = true;

            /*
             * IN STOCK
             *
             * "In Stock" means every product
             * with available stock.
             */

            if (
              statusFilter ===
              'healthy'
            ) {
              matchesStatus =
                product.stock > 0;
            }

            /*
             * LOW STOCK
             */

            else if (
              statusFilter ===
              'low'
            ) {
              matchesStatus =
                product.status ===
                  'low' ||
                product.status ===
                  'critical';
            }

            /*
             * OUT OF STOCK
             */

            else if (
              statusFilter ===
              'out'
            ) {
              matchesStatus =
                product.status ===
                'out';
            }

            /*
             * OVERSTOCKED
             */

            else if (
              statusFilter ===
              'overstock'
            ) {
              matchesStatus =
                product.status ===
                'overstock';
            }

            return (
              matchesSearch &&
              matchesCategory &&
              matchesStatus
            );
          }
        );


      /* =====================================================
         SORT
      ===================================================== */

      result.sort((a, b) => {

        let aValue;
        let bValue;

        switch (sortKey) {

          case 'category':

            aValue =
              a.category || '';

            bValue =
              b.category || '';

            break;

          case 'forecastDemand':

            aValue =
              Number(
                a.predictedDemand
              ) || 0;

            bValue =
              Number(
                b.predictedDemand
              ) || 0;

            break;

          case 'stock':

            aValue =
              Number(
                a.stock
              ) || 0;

            bValue =
              Number(
                b.stock
              ) || 0;

            break;

          case 'daysRemaining':

            aValue =
              Number.isFinite(
                a.daysRemaining
              )
                ? a.daysRemaining
                : Number.MAX_SAFE_INTEGER;

            bValue =
              Number.isFinite(
                b.daysRemaining
              )
                ? b.daysRemaining
                : Number.MAX_SAFE_INTEGER;

            break;

          case 'reorderPoint':

            aValue =
              Number(
                a.reorderPoint
              ) || 0;

            bValue =
              Number(
                b.reorderPoint
              ) || 0;

            break;

          case 'name':

          default:

            aValue =
              a.name || '';

            bValue =
              b.name || '';

            break;
        }

        if (
          typeof aValue === 'string' &&
          typeof bValue === 'string'
        ) {
          return sortDir === 'asc'
            ? aValue.localeCompare(
                bValue
              )
            : bValue.localeCompare(
                aValue
              );
        }

        return sortDir === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      });

      return result;

    }, [
      products,
      search,
      categoryFilter,
      statusFilter,
      sortKey,
      sortDir,
    ]);


  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredProducts.length /
          pageSize
      )
    );

  const currentPage =
    Math.min(
      page,
      totalPages
    );

  const paginatedProducts =
    filteredProducts.slice(
      (currentPage - 1) *
        pageSize,
      currentPage *
        pageSize
    );


  /* =======================================================
     HANDLERS
  ======================================================= */

  const handleStatusCardClick =
    (status) => {

      setStatusFilter(
        status
      );

      setPage(1);
    };


  const handleCategoryChange =
    (value) => {

      setCategoryFilter(
        value
      );

      setPage(1);
    };


  const handleSearchChange =
    (value) => {

      setSearch(value);

      setPage(1);
    };


  const handleSort =
    (key) => {

      if (sortKey === key) {

        setSortDir(
          (current) =>
            current === 'asc'
              ? 'desc'
              : 'asc'
        );

      } else {

        setSortKey(key);
        setSortDir('asc');

      }
    };


  /* =======================================================
     UPDATE STOCK
  ======================================================= */

  async function handleStockUpdate(
    productId,
    newStock
  ) {

    const stock =
      Number(newStock);

    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      return;
    }

    const updatedStock =
      Math.floor(stock);

    try {
      await updateInventory(productId, updatedStock);
      await refreshInventory();
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert(error.message || 'Unable to save stock. Please try again.');
    }
  }


  /* =======================================================
     DETAIL VIEW
  ======================================================= */

  if (selectedProduct) {

    return (
      <ProductDetail
        product={
          selectedProduct
        }
        onBack={() =>
          setSelectedProduct(
            null
          )
        }
        onUpdateStock={
          handleStockUpdate
        }
      />
    );
  }


  /* =======================================================
     CATEGORY OPTIONS
  ======================================================= */

  const categoryOptions =
    Array.isArray(CATEGORIES) &&
    CATEGORIES.length > 0
      ? CATEGORIES
      : [
          'Grains',
          'Cooking',
          'Dairy',
          'Snacks',
          'Beverages',
          'Personal Care',
          'Cleaning',
        ];


  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <>
      <InventoryEnterpriseStyles />

      <div className="sp-inventory-page">

        {/* PAGE HEADER */}

        <div className="sp-page-header">

          <div>

            <div className="sp-page-eyebrow">
              <Boxes size={13} />
              Inventory Operations
            </div>

            <h1>
              Inventory Management
            </h1>

            <p>
              Monitor stock availability,
              demand coverage and
              replenishment requirements.
            </p>

          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <div className="sp-header-meta">
              <Package size={15} />
              {stats.totalProducts} products tracked
            </div>
            <InventoryActions products={products} onComplete={refreshInventory} />
          </div>

        </div>


        {/* SUMMARY CARDS */}

        <InventoryStats
          stats={stats}
          activeStatus={
            statusFilter
          }
          onStatusClick={
            handleStatusCardClick
          }
        />


        {/* FILTER TOOLBAR */}

        <div className="sp-filter-card">

          <div className="sp-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(event) =>
                handleSearchChange(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                className="sp-clear-search"
                onClick={() =>
                  handleSearchChange('')
                }
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}

          </div>


          <div className="sp-filter-group">

            <label>
              Category
            </label>

            <select
              className="sp-select"
              value={
                categoryFilter
              }
              onChange={(event) =>
                handleCategoryChange(
                  event.target.value
                )
              }
            >

              <option value="all">
                All Categories
              </option>

              {categoryOptions.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}

            </select>

          </div>


          <div className="sp-filter-group">

            <label>
              Status
            </label>

            <select
              className="sp-select"
              value={
                statusFilter
              }
              onChange={(event) =>
                handleStatusCardClick(
                  event.target.value
                )
              }
            >

              <option value="all">
                All Statuses
              </option>

              <option value="healthy">
                In Stock
              </option>

              <option value="low">
                Low Stock
              </option>

              <option value="out">
                Out of Stock
              </option>

              <option value="overstock">
                Overstocked
              </option>

            </select>

          </div>


          {statusFilter !== 'all' && (
            <div className="sp-filter-indicator">
              <SlidersHorizontal size={14} />

              {statusFilter ===
              'healthy'
                ? 'In Stock'
                : statusFilter ===
                  'low'
                ? 'Low Stock'
                : statusFilter ===
                  'out'
                ? 'Out of Stock'
                : 'Overstocked'}
            </div>
          )}

        </div>


        {/* TABLE */}

        <div className="sp-table-card">

          <div className="sp-table-header">

            <div className="sp-table-title">

              <div className="sp-table-title-icon">
                <Package size={17} />
              </div>

              <div>
                <h2>
                  Inventory Overview
                </h2>

                <p>
                  Current inventory position
                  across all tracked products
                </p>
              </div>

            </div>

            <div className="sp-table-filter-status">
              Showing
              <strong>
                {filteredProducts.length}
              </strong>
              products
            </div>

          </div>


          <div className="sp-table-wrapper">

            <table className="sp-table">

              <thead>

                <tr>

                  <th
                    className="sp-sortable-header"
                    onClick={() =>
                      handleSort('name')
                    }
                  >
                    Product

                    <span className="sp-sort">
                      {sortKey === 'name'
                        ? sortDir === 'asc'
                          ? '↑'
                          : '↓'
                        : '↕'}
                    </span>
                  </th>


                  <th
                    className="sp-sortable-header"
                    onClick={() =>
                      handleSort(
                        'category'
                      )
                    }
                  >
                    Category

                    <span className="sp-sort">
                      {sortKey ===
                      'category'
                        ? sortDir === 'asc'
                          ? '↑'
                          : '↓'
                        : '↕'}
                    </span>
                  </th>


                  <th
                    className="sp-sortable-header"
                    onClick={() =>
                      handleSort(
                        'forecastDemand'
                      )
                    }
                  >
                    Forecast Daily Demand

                    <span className="sp-sort">
                      {sortKey ===
                      'forecastDemand'
                        ? sortDir === 'asc'
                          ? '↑'
                          : '↓'
                        : '↕'}
                    </span>
                  </th>


                  <th
                    className="sp-sortable-header"
                    onClick={() =>
                      handleSort('stock')
                    }
                  >
                    Current Stock

                    <span className="sp-sort">
                      {sortKey === 'stock'
                        ? sortDir === 'asc'
                          ? '↑'
                          : '↓'
                        : '↕'}
                    </span>
                  </th>


                  <th
                    className="sp-sortable-header"
                    onClick={() =>
                      handleSort(
                        'daysRemaining'
                      )
                    }
                  >
                    Days Remaining

                    <span className="sp-sort">
                      {sortKey ===
                      'daysRemaining'
                        ? sortDir === 'asc'
                          ? '↑'
                          : '↓'
                        : '↕'}
                    </span>
                  </th>


                  <th
                    className="sp-sortable-header"
                    onClick={() =>
                      handleSort(
                        'reorderPoint'
                      )
                    }
                  >
                    Reorder Point

                    <span className="sp-sort">
                      {sortKey ===
                      'reorderPoint'
                        ? sortDir === 'asc'
                          ? '↑'
                          : '↓'
                        : '↕'}
                    </span>
                  </th>


                  <th>
                    Status
                  </th>

                </tr>

              </thead>


              <tbody>

                {paginatedProducts.length >
                0 ? (

                  paginatedProducts.map(
                    (product) => {

                      const days =
                        product.daysRemaining;

                      const daysClass =
                        !Number.isFinite(
                          days
                        )
                          ? ''
                          : days <= 3
                          ? 'danger'
                          : days <= 7
                          ? 'warning'
                          : '';

                      return (
                        <tr
                          key={
                            product.id ||
                            product.productId ||
                            product.product_id
                          }
                          onClick={() =>
                            setSelectedProduct(
                              product
                            )
                          }
                          className="sp-table-row"
                        >

                          {/* PRODUCT */}

                          <td>

                            <div className="sp-product-cell">

                              <div className="sp-product-icon">
                                <Package
                                  size={17}
                                />
                              </div>

                              <div>
                                <div className="sp-product-name">
                                  {product.name}
                                </div>

                                <div className="sp-product-subtitle">
                                  Inventory item
                                </div>
                              </div>

                            </div>

                          </td>


                          {/* CATEGORY */}

                          <td>

                            <span className="sp-category">
                              {product.category}
                            </span>

                          </td>


                          {/* FORECAST */}

                          <td>

                            <span className="sp-number">
                              {Number(
                                product.predictedDemand ||
                                  0
                              ).toFixed(2)}
                            </span>

                            <span className="sp-unit">
                              units / day
                            </span>

                          </td>


                          {/* STOCK */}

                          <td>

                            <span className="sp-number">
                              {Number(
                                product.stock ||
                                  0
                              ).toFixed(2)}
                            </span>

                            <span className="sp-unit">
                              units
                            </span>

                          </td>


                          {/* DAYS */}

                          <td>

                            <div className="sp-days">

                              <span
                                className={`sp-days-indicator ${daysClass}`}
                              />

                              <div>
                                <span className="sp-number">
                                  {Number.isFinite(
                                    product.daysRemaining
                                  )
                                    ? product.daysRemaining.toFixed(
                                        1
                                      )
                                    : '∞'}
                                </span>

                                <span className="sp-unit">
                                  days
                                </span>
                              </div>

                            </div>

                          </td>


                          {/* REORDER */}

                          <td>

                            <span className="sp-number">
                              {Number(
                                product.reorderPoint ||
                                  0
                              ).toFixed(2)}
                            </span>

                            <span className="sp-unit">
                              units
                            </span>

                          </td>


                          {/* STATUS */}

                          <td>
                            <StatusBadge
                              status={
                                product.status
                              }
                            />
                          </td>

                        </tr>
                      );
                    }
                  )

                ) : (

                  <tr>

                    <td
                      colSpan={7}
                      className="sp-empty"
                    >

                      <div className="sp-empty-icon">
                        <Package size={22} />
                      </div>

                      <strong>
                        No products found
                      </strong>

                      <span>
                        Try changing your
                        search or filters.
                      </span>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>


          {/* PAGINATION */}

          {filteredProducts.length >
            0 && (

            <div className="sp-pagination">

              <span>
                Showing{' '}
                {(currentPage - 1) *
                  pageSize +
                  1}
                {' - '}
                {Math.min(
                  currentPage *
                    pageSize,
                  filteredProducts.length
                )}
                {' of '}
                {filteredProducts.length}
              </span>


              <div className="sp-pagination-controls">

                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  title="Previous page"
                >
                  <ChevronLeft
                    size={16}
                  />
                </button>


                <span className="sp-page-number">
                  {currentPage}
                  {' / '}
                  {totalPages}
                </span>


                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                    )
                  }
                  title="Next page"
                >
                  <ChevronRight
                    size={16}
                  />
                </button>

              </div>

            </div>

          )}

        </div>

      </div>
    </>
  );
}