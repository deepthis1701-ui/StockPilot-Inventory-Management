import mongoose from 'mongoose';

const salesTransactionSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  sku: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.000001 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  channel: { type: String, enum: ['counter', 'online', 'wholesale', 'other'], default: 'counter' },
  reference: { type: String, trim: true, default: '' },
  source: { type: String, enum: ['pos', 'manual', 'csv_import', 'demo'], default: 'manual' },
  importBatchId: { type: String, index: true },
  importRowNumber: { type: Number, min: 1 },
  transactionDate: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

salesTransactionSchema.index({ productId: 1, transactionDate: -1 });
salesTransactionSchema.index(
  { importBatchId: 1, importRowNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      importBatchId: { $exists: true },
      importRowNumber: { $exists: true }
    }
  }
);

export default mongoose.models.SalesTransaction || mongoose.model('SalesTransaction', salesTransactionSchema);
