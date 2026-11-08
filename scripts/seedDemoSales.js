/**
 * ============================================================
 *  DEMO / SAMPLE DATA SEEDER — StockPilot
 * ============================================================
 *
 *  Generates realistic historical sales transactions for the
 *  past 90 days for at least 3 active products.
 *
 *  Safe to re-run: checks for existing demo rows per product
 *  per date and skips duplicates (idempotent).
 *
 *  Usage:
 *    npm run seed:demo          (requires MONGODB_URI in .env)
 *
 *  To remove demo data later:
 *    db.salestransactions.deleteMany({ source: 'demo' })
 * ============================================================
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../server/db.js';
import Product from '../server/schemas/Product.js';
import SalesTransaction from '../server/schemas/SalesTransaction.js';

// ─── Configuration ──────────────────────────────────────────
const DAYS_OF_HISTORY = 90;      // How many days back to generate
const MIN_PRODUCTS    = 3;       // Minimum products to seed
const ZERO_SALE_PROB  = 0.10;    // 10 % chance of a zero-sale day

// Per-product demand profiles (cycled if more products exist)
const DEMAND_PROFILES = [
  { label: 'high-steady',   baseDemand: 15, variance: 4,  spikeFactor: 2.5 },
  { label: 'medium-wavy',   baseDemand: 8,  variance: 3,  spikeFactor: 3.0 },
  { label: 'low-sporadic',  baseDemand: 3,  variance: 2,  spikeFactor: 4.0 },
  { label: 'high-seasonal', baseDemand: 12, variance: 5,  spikeFactor: 2.0 },
  { label: 'medium-stable', baseDemand: 10, variance: 2,  spikeFactor: 1.5 },
];

// ─── Helpers ────────────────────────────────────────────────

/** Return a date string YYYY-MM-DD (UTC). */
function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

/** Clamp value to [min, max]. */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Generate daily quantity for a given day index and profile. */
function dailyQuantity(dayIndex, profile) {
  // 10 % chance of zero-sale day
  if (Math.random() < ZERO_SALE_PROB) return 0;

  const { baseDemand, variance, spikeFactor } = profile;

  // Weekly seasonality: slightly lower on weekends (day 5-6)
  const dayOfWeek = dayIndex % 7;
  const weekendDip = (dayOfWeek >= 5) ? 0.65 : 1.0;

  // Sinusoidal monthly wave
  const monthWave = Math.sin((dayIndex / 30) * 2 * Math.PI) * (variance * 0.5);

  // Random noise
  const noise = (Math.random() - 0.5) * 2 * variance;

  // Occasional demand spike (~5 % of days)
  const spike = (Math.random() < 0.05) ? spikeFactor : 1.0;

  const raw = (baseDemand + monthWave + noise) * weekendDip * spike;
  return clamp(Math.round(raw), 0, 200);
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log('🌱 StockPilot Demo Sales Seeder');
  console.log('─'.repeat(50));

  await connectDB();

  // 1. Fetch active products
  const products = await Product.find({ isActive: true })
    .sort({ createdAt: 1 })
    .limit(Math.max(MIN_PRODUCTS, 5))
    .lean();

  if (products.length < MIN_PRODUCTS) {
    console.error(
      `❌  Need at least ${MIN_PRODUCTS} active products in the database.\n` +
      `   Found: ${products.length}. Add products first, then re-run.`
    );
    process.exit(1);
  }

  console.log(`📦 Found ${products.length} active product(s):`);
  products.forEach(p => console.log(`   • ${p.sku} — ${p.name} (\$${p.sellingPrice})`));

  // 2. Build date list (today - DAYS_OF_HISTORY .. yesterday)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dates = [];
  for (let i = DAYS_OF_HISTORY; i >= 1; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d);
  }

  console.log(`📅 Date range: ${fmtDate(dates[0])} → ${fmtDate(dates[dates.length - 1])}`);

  // 3. For each product, find existing demo dates and generate missing ones
  let totalInserted = 0;
  let totalSkipped  = 0;

  for (let pi = 0; pi < products.length; pi++) {
    const product = products[pi];
    const productId = String(product._id);
    const profile = DEMAND_PROFILES[pi % DEMAND_PROFILES.length];

    // Existing demo transaction dates for this product
    const existingDocs = await SalesTransaction.find(
      { productId, source: 'demo' },
      { transactionDate: 1 }
    ).lean();

    const existingDates = new Set(
      existingDocs.map(d => fmtDate(d.transactionDate))
    );

    const toInsert = [];

    for (let di = 0; di < dates.length; di++) {
      const dateStr = fmtDate(dates[di]);

      // Skip if a demo record already exists for this product + date
      if (existingDates.has(dateStr)) {
        totalSkipped++;
        continue;
      }

      const qty = dailyQuantity(di, profile);
      if (qty === 0) {
        // We still skip zero-quantity days because schema requires quantity > 0
        // (min: 0.000001). Zero-sale days are simply absent from the collection,
        // and the forecast endpoint fills them as 0.
        continue;
      }

      const unitPrice = product.sellingPrice || 10;
      toInsert.push({
        productId,
        sku:             product.sku,
        productName:     product.name,
        quantity:         qty,
        unitPrice,
        totalAmount:      qty * unitPrice,
        channel:          'counter',
        reference:        `DEMO-${product.sku}-${dateStr}`,
        source:           'demo',
        transactionDate:  dates[di],
      });
    }

    if (toInsert.length > 0) {
      await SalesTransaction.insertMany(toInsert, { ordered: false });
    }

    const nonZero = toInsert.length;
    const skipped = existingDates.size;
    totalInserted += nonZero;
    totalSkipped  += 0; // already counted above

    console.log(
      `   ✅ ${product.sku} [${profile.label}]: ` +
      `${nonZero} new transactions inserted, ${skipped} dates already existed`
    );
  }

  console.log('─'.repeat(50));
  console.log(`🏁 Done. Total inserted: ${totalInserted} | Skipped (existing): ${totalSkipped}`);
  console.log('   To remove demo data:  db.salestransactions.deleteMany({ source: "demo" })');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
