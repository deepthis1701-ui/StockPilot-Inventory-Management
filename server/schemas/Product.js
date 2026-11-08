import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  unit: { type: String, required: true, trim: true, maxlength: 30 },
  description: { type: String, trim: true, default: '', maxlength: 1000 },
  barcode: { type: String, trim: true, default: '' },
  sellingPrice: { type: Number, min: 0, default: 0 },
  costPrice: { type: Number, min: 0, default: 0 },
  supplierName: { type: String, trim: true, default: '' },
  leadTimeDays: { type: Number, min: 0, default: 7 },
  minimumOrderQty: { type: Number, min: 1, default: 1 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

productSchema.index({ name: 'text', sku: 'text', category: 'text' });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
