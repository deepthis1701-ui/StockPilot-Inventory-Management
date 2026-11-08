import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },
  currentStock: { type: Number, required: true, min: 0, default: 0 },
  incomingStock: { type: Number, min: 0, default: 0 },
  reservedStock: { type: Number, min: 0, default: 0 },
  leadTimeDays: { type: Number, min: 0, default: 7 },
  supplier: { type: String, trim: true, default: '' },
  minimumOrderQty: { type: Number, min: 1, default: 1 },
  unitCost: { type: Number, min: 0, default: 0 }
}, { timestamps: true });

export default mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
