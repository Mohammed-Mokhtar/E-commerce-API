import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
          quantity: {
            type: Number,
            default: 1,
            min: 1,
            required: true,
          },
          totalItemPrice: {
            type: Number,
            required: true,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

cartSchema.virtual("totalPrice").get(function () {
  return Number(
    this.items.reduce((acc, item) => acc + item.totalItemPrice, 0).toFixed(2),
  );
});

export const Cart = mongoose.model("cart", cartSchema);
