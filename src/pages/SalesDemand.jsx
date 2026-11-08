import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UploadCloud,
  X
} from 'lucide-react';
import {
  getSales,
  getSalesDemandStats,
  getTopProducts,
  getInventory,
  getForecast,
  importHistoricalSales
} from '../services/api.js';
import './SalesDemand.css';

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

const number = (value, digits = 0) => Number(value || 0).toLocaleString('en-IN', {
  maximumFractionDigits: digits
});

const getDayKey = (value) => {
  if (!value) return '';
  const raw = String(value);
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(raw)) return raw;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

function parseCsvLine(line) {
  const cells = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"' && quoted && line[i + 1] === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }

  if (quoted) {
    throw new Error('A CSV row contains an unmatched quotation mark.');
  }

  cells.push(value.trim());
  return cells;
}

function SalesTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="sdx-tooltip">
      <div className="sdx-tooltip-date">
        {new Date(label).toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })}
      </div>
      <div className="sdx-tooltip-value">
        {metric === 'revenue'
          ? money(payload[0].value)
          : `${number(payload[0].value)} units`}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, tone, label, value, note }) {
  return (
    <article className="sdx-metric-card">
      <div className="sdx-metric-top">
        <div className={`sdx-metric-icon ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="sdx-metric-label">{label}</div>
      <div className="sdx-metric-value">{value}</div>
      <div className="sdx-metric-note">{note}</div>
    </article>
  );
}

export default function SalesDemand() {
  const [range, setRange] = useState('daily');
  const [metric, setMetric] = useState('revenue');
  const [salesRows, setSalesRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fileRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError('');

    const results = await Promise.allSettled([
      getSales(range, metric),
      getSalesDemandStats(),
      getTopProducts(),
      getInventory(),
      getForecast('All Products', 14)
    ]);

    const [salesResult, statsResult, productsResult, inventoryResult, forecastResult] = results;

    if (salesResult.status === 'fulfilled') {
      const raw = salesResult.value?.data || salesResult.value?.sales || [];
      setSalesRows(Array.isArray(raw) ? raw : []);
    } else {
      setSalesRows([]);
      setPageError('The sales trend could not be loaded. Check that the backend is running.');
    }

    setStats(statsResult.status === 'fulfilled' ? statsResult.value : null);
    setTopProducts(productsResult.status === 'fulfilled'
      ? (productsResult.value?.products || productsResult.value?.data || [])
      : []);
    setInventory(inventoryResult.status === 'fulfilled'
      ? (inventoryResult.value?.products || [])
      : []);
    setForecast(forecastResult.status === 'fulfilled' ? forecastResult.value : null);
    setLoading(false);
  }, [range, metric]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const chartData = useMemo(() => {
    const days = range === 'weekly' ? 7 : range === 'quarterly' ? 90 : 30;
    const keyed = new Map(
      salesRows.map((row) => {
        const day = getDayKey(row.date || row.label || row.day);
        return [day, Number(row.value ?? row[metric] ?? 0)];
      }).filter(([day]) => day)
    );

    const now = new Date();
    const todayUtc = new Date(Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ));
    const points = [];

    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(todayUtc);
      date.setUTCDate(todayUtc.getUTCDate() - offset);
      const day = date.toISOString().slice(0, 10);
      points.push({ date: day, value: keyed.get(day) || 0 });
    }

    return points;
  }, [salesRows, range, metric]);

  const forecastItems = forecast?.forecasts || [];
  const readyForecasts = forecastItems.filter((item) =>
    item.forecast_status === 'available' || item.predicted_daily_demand != null
  );
  const historyNeeded = forecastItems.filter((item) =>
    item.forecast_status === 'insufficient_history'
  ).length;
  const demandProducts = inventory.filter((item) => {
    const demand = item.predictedDailyDemand ?? item.predicted_daily_demand;
    return demand !== null && demand !== undefined && Number(demand) > 0;
  });
  const lowCoverageProducts = demandProducts.filter((item) =>
    item.daysCoverage != null &&
    Number(item.daysCoverage) <= Number(item.leadTime || 7)
  );

  const handleImport = async () => {
    if (!selectedFile) return;

    setImportBusy(true);
    setFeedback(null);

    try {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please choose a .csv file.');
      }

      const csvText = (await selectedFile.text()).replace(/^\\uFEFF/, '');
      const lines = csvText.split(/\\r?\\n/).filter((line) => line.trim());

      if (lines.length < 2) {
        throw new Error('Your CSV needs a header row and at least one sales row.');
      }

      if (lines.length - 1 > 5000) {
        throw new Error('A single import can contain up to 5,000 rows.');
      }

      const headers = parseCsvLine(lines[0]).map((header) =>
        header.toLowerCase().replace(/[\\s-]+/g, '_')
      );
      const dateKey = headers.includes('date') ? 'date' : 'transaction_date';

      for (const required of [dateKey, 'sku', 'quantity']) {
        if (!headers.includes(required)) {
          throw new Error(`Missing required column: ${required}`);
        }
      }

      const rows = lines.slice(1).map((line, index) => {
        const values = parseCsvLine(line);

        if (values.length > headers.length) {
          throw new Error(`Row ${index + 2} has more values than the header.`);
        }

        const record = Object.fromEntries(
          headers.map((header, valueIndex) => [header, values[valueIndex] ?? ''])
        );

        return {
          date: record.date || record.transaction_date,
          sku: record.sku,
          quantity: record.quantity,
          unitPrice: record.unit_price || record.unitprice || record.price || undefined,
          channel: record.channel || 'counter',
          reference: record.reference || ''
        };
      });

      const result = await importHistoricalSales(rows);

      setFeedback({
        type: 'success',
        message: `${number(result.importedRows)} historical sales row(s) imported. Current stock was not changed.`
      });
      setSelectedFile(null);

      if (fileRef.current) fileRef.current.value = '';

      await loadData();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message || 'Unable to import this CSV file.'
      });
    } finally {
      setImportBusy(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'date,sku,quantity,unit_price,channel,reference\\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'stockpilot-sales-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const rangeLabel = range === 'weekly' ? 'Last 7 days'
    : range === 'quarterly' ? 'Last 90 days'
      : 'Last 30 days';

  return (
    <main className="sdx-page">
      <header className="sdx-header">
        <div>
          <div className="sdx-eyebrow">STORE PERFORMANCE</div>
          <h1 className="sdx-title">Sales &amp; Demand</h1>
          <p className="sdx-subtitle">
            A clear view of store sales, product movement and forecast readiness.
          </p>
        </div>

        <div className="sdx-header-actions">
          <div className="sdx-date-chip">
            <CalendarDays size={14} />
            {rangeLabel}
          </div>
          <button
            type="button"
            className="sdx-button sdx-button-ghost"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'sdx-spin' : ''} />
            {loading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </header>

      {pageError && (
        <div className="sdx-error-banner">
          <AlertCircle size={15} />
          {pageError}
        </div>
      )}

      <section className="sdx-metrics" aria-label="Sales summary">
        <MetricCard
          icon={IndianRupee}
          tone="blue"
          label="Revenue"
          value={stats ? money(stats.totalSales) : '—'}
          note="Recorded in the last 30 days"
        />
        <MetricCard
          icon={ShoppingBag}
          tone="violet"
          label="Units sold"
          value={stats ? number(stats.unitsSold) : '—'}
          note="Total quantity sold"
        />
        <MetricCard
          icon={Activity}
          tone="cyan"
          label="Average daily sales"
          value={stats ? number(stats.averageDailyDemand, 2) : '—'}
          note="Units per day · 30-day average"
        />
        <MetricCard
          icon={FileSpreadsheet}
          tone="amber"
          label="Transactions"
          value={stats ? number(stats.transactionCount) : '—'}
          note="Recorded bills and sales entries"
        />
      </section>

      <section className="sdx-main-grid">
        <article className="sdx-card">
          <div className="sdx-card-header">
            <div>
              <div className="sdx-card-kicker">SALES ACTIVITY</div>
              <h2 className="sdx-card-title">Sales trend</h2>
              <p className="sdx-card-description">
                Daily sales recorded by StockPilot for the selected period.
              </p>
            </div>

            <div className="sdx-chart-tools">
              <div className="sdx-segment" aria-label="Date range">
                {[
                  ['weekly', '7D'],
                  ['daily', '30D'],
                  ['quarterly', '90D']
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={range === value ? 'active' : ''}
                    onClick={() => setRange(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="sdx-segment" aria-label="Sales metric">
                <button
                  type="button"
                  className={metric === 'revenue' ? 'active' : ''}
                  onClick={() => setMetric('revenue')}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  className={metric === 'units' ? 'active' : ''}
                  onClick={() => setMetric('units')}
                >
                  Units
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="sdx-chart-empty">
              <div className="sdx-empty-icon"><BarChart3 size={20} /></div>
              <div className="sdx-empty-title">Loading sales activity</div>
              <div className="sdx-empty-copy">Fetching the latest transaction history.</div>
            </div>
          ) : chartData.some((item) => item.value > 0) ? (
            <div className="sdx-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sdxSalesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4778df" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#4778df" stopOpacity={0.015} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#edf1f6" strokeDasharray="3 5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                    tick={{ fill: '#9aa5b5', fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short'
                    })}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={metric === 'revenue' ? 58 : 38}
                    tick={{ fill: '#9aa5b5', fontSize: 10 }}
                    tickFormatter={(value) => metric === 'revenue'
                      ? `₹${number(value)}`
                      : number(value)}
                  />
                  <Tooltip content={<SalesTooltip metric={metric} />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#4778df"
                    strokeWidth={2.5}
                    fill="url(#sdxSalesFill)"
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#315fca' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="sdx-chart-empty">
              <div className="sdx-empty-icon"><BarChart3 size={20} /></div>
              <div className="sdx-empty-title">No sales in this period yet</div>
              <div className="sdx-empty-copy">
                Sales entered manually or imported from your POS will appear here. The chart does not use sample values.
              </div>
            </div>
          )}
        </article>

        <div className="sdx-side-stack">
          <article className="sdx-forecast-card">
            <div className="sdx-forecast-heading">
              <div className="sdx-forecast-icon"><Sparkles size={18} /></div>
              <span className={readyForecasts.length > 0 ? 'sdx-status ready' : 'sdx-status waiting'}>
                {readyForecasts.length > 0 ? 'Forecast available' : 'Building history'}
              </span>
            </div>
            <div className="sdx-card-kicker" style={{ marginTop: 15 }}>DEMAND FORECAST</div>
            <h2 className="sdx-card-title">Forecast readiness</h2>

            {readyForecasts.length > 0 ? (
              <>
                <p className="sdx-forecast-copy">
                  {readyForecasts.length} product forecast(s) are available from the current sales history.
                </p>
                <div className="sdx-forecast-products">
                  {readyForecasts.slice(0, 3).map((item) => (
                    <div className="sdx-forecast-product" key={item.id || item.product_id || item.sku}>
                      <span className="sdx-forecast-product-name">
                        {item.product_name || item.name || item.sku || 'Product'}
                      </span>
                      <span className="sdx-forecast-product-value">
                        {number(item.predicted_daily_demand, 2)} / day
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="sdx-forecast-copy">
                {historyNeeded > 0
                  ? `${historyNeeded} product(s) need more history before a reliable forecast can be produced. The current engine requires at least 56 tracked days and 7 days with sales per product.`
                  : 'Forecasts will appear here when enough dated sales history is available for your products. No demand estimate is being invented.'}
              </p>
            )}
            <div className="sdx-forecast-products">
              <div className="sdx-forecast-product">
                <span className="sdx-forecast-product-name">Products with sales history</span>
                <span className="sdx-forecast-product-value">{number(forecastItems.length)}</span>
              </div>
              <div className="sdx-forecast-product">
                <span className="sdx-forecast-product-name">Forecasts available</span>
                <span className="sdx-forecast-product-value">{number(readyForecasts.length)}</span>
              </div>
              <div className="sdx-forecast-product">
                <span className="sdx-forecast-product-name">Low stock coverage alerts</span>
                <span className="sdx-forecast-product-value">{number(
                  inventory.filter((item) => item.daysCoverage != null &&
                    Number(item.daysCoverage) <= Number(item.leadTime || 7)).length
                )}</span>
              </div>
            </div>
          </article>

          <article className="sdx-card">
            <div className="sdx-card-header" style={{ marginBottom: 8 }}>
              <div>
                <div className="sdx-card-kicker">INVENTORY SIGNAL</div>
                <h2 className="sdx-card-title">Stock coverage</h2>
              </div>
              <Package size={18} color="#7790b5" />
            </div>
            <p className="sdx-forecast-copy" style={{ marginTop: 0 }}>
              {lowCoverageProducts.length > 0
                ? `${lowCoverageProducts.length} product(s) with recorded demand have stock coverage at or below their lead time. Review Risk Analysis for details.`
                : demandProducts.length > 0
                  ? 'No products with recorded demand are currently below their lead-time coverage.'
                  : 'Stock coverage alerts will become meaningful after products have enough sales history to estimate daily demand.'}
            </p>
          </article>
        </div>
      </section>

      <section className="sdx-bottom-grid">
        <article className="sdx-card">
          <div className="sdx-card-header">
            <div>
              <div className="sdx-card-kicker">PRODUCT PERFORMANCE</div>
              <h2 className="sdx-card-title">Top-selling products</h2>
              <p className="sdx-card-description">Ranked by units sold over the last 30 days.</p>
            </div>
            <span className="sdx-status">{number(topProducts.length)} products</span>
          </div>

          {topProducts.length > 0 ? (
            <div className="sdx-product-list">
              {topProducts.slice(0, 6).map((product, index) => (
                <div className="sdx-product-row" key={product.id || product.productId || product.sku || index}>
                  <div className="sdx-product-rank">{index + 1}</div>
                  <div>
                    <div className="sdx-product-name">{product.name || product.productName || 'Unnamed product'}</div>
                    <div className="sdx-product-sku">{product.sku || 'SKU not available'}</div>
                  </div>
                  <div className="sdx-product-number">
                    <span>Units</span>
                    {number(product.units)}
                  </div>
                  <div className="sdx-product-number">
                    <span>Revenue</span>
                    {money(product.revenue)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sdx-empty-inline">
              <Clock3 size={17} />
              <span>
                No product has sales in the last 30 days yet. Record a sale or import genuine historical POS data to populate this ranking.
              </span>
            </div>
          )}
        </article>

        <article className="sdx-card sdx-import-card">
          <div className="sdx-card-header">
            <div>
              <div className="sdx-card-kicker">HISTORICAL DATA</div>
              <h2 className="sdx-card-title">Import sales history</h2>
            </div>
            <div className="sdx-upload-icon"><FileSpreadsheet size={18} /></div>
          </div>
          <p className="sdx-import-intro">
            Bring in past transactions from your billing or POS software to improve reporting and build demand history. Imports never change current stock.
          </p>

          <label className="sdx-upload-zone" htmlFor="sdx-sales-csv">
            <span className="sdx-upload-icon"><UploadCloud size={18} /></span>
            <span>
              <span className="sdx-upload-title">
                {selectedFile ? 'CSV file selected' : 'Choose a CSV file'}
              </span>
              <span className="sdx-upload-copy">Click to browse · Up to 5,000 rows</span>
              {selectedFile && <span className="sdx-upload-name">{selectedFile.name}</span>}
            </span>
          </label>
          <input
            ref={fileRef}
            id="sdx-sales-csv"
            className="sdx-file-input"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] || null);
              setFeedback(null);
            }}
          />

          <div className="sdx-import-actions">
            <button
              type="button"
              className="sdx-button sdx-button-primary"
              onClick={handleImport}
              disabled={!selectedFile || importBusy}
            >
              <UploadCloud size={14} />
              {importBusy ? 'Importing…' : 'Import sales'}
            </button>
            <button type="button" className="sdx-template-link" onClick={downloadTemplate}>
              Download CSV template
            </button>
          </div>

          {selectedFile && (
            <button
              type="button"
              className="sdx-template-link"
              style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}
              onClick={() => {
                setSelectedFile(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
            >
              <X size={12} /> Remove selected file
            </button>
          )}

          {feedback && (
            <div className={`sdx-feedback ${feedback.type}`}>
              {feedback.type === 'success'
                ? <CheckCircle2 size={14} />
                : <AlertCircle size={14} />}
              <span>{feedback.message}</span>
            </div>
          )}

          <p className="sdx-import-note">
            Required: date, sku, quantity. Optional: unit_price, channel, reference. Dates must be within the last 730 days. Use actual transaction records; the downloaded template contains headers only.
          </p>
        </article>
      </section>
    </main>
  );
}
