import mongoose from "mongoose";

const checkoutSessionStateSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderCreated: {
      type: Boolean,
      default: false,
    },
    stockRestored: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const CheckoutSessionState = mongoose.model(
  "checkout_session_states",
  checkoutSessionStateSchema,
);
