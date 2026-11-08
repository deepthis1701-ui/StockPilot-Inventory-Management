import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  movementType: {
    type: String,
    enum: ['opening', 'purchase', 'sale', 'adjustment', 'return', 'wastage'],
    required: true
  },
  quantityChange: { type: Number, required: true },
  balanceBefore: { type: Number, required: true, min: 0 },
  balanceAfter: { type: Number, required: true, min: 0 },
  unitCost: { type: Number, min: 0, default: 0 },
  reference: { type: String, trim: true, default: '' },
  note: { type: String, trim: true, default: '', maxlength: 500 },
  occurredAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

stockMovementSchema.index({ productId: 1, occurredAt: -1 });

export default mongoose.models.StockMovement || mongoose.model('StockMovement', stockMovementSchema);
