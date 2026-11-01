import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    incomingStock: {
      type: Number,
      default: 0,
      min: 0
    },

    leadTimeDays: {
      type: Number,
      default: 7,
      min: 0
    },

    supplier: {
      type: String,
      default: ''
    },

    minimumOrderQty: {
      type: Number,
      default: 0,
      min: 0
    },

    unitCost: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

const Inventory = mongoose.model(
  'Inventory',
  inventorySchema
);

export default Inventory;