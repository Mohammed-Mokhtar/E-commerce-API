import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    items: {
      type: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
          },
          quantity: {
            type: Number,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
        },
      ],
      required: true,
    },
    totalAmountBeforeDiscount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "card"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      required: true,
    },
    shippingAddress: {
      type: {
        city: {
          type: String,
          required: true,
        },

        phone: {
          type: String,
          required: true,
        },
      },
      required: true,
    },
    sessionId: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
    },
    totalAmountAfterDiscount: {
      type: Number,
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model("orders", orderSchema);
