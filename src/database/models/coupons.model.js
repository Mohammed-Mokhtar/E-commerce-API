import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    usageLimits: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    maxAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model("coupons", couponSchema);
