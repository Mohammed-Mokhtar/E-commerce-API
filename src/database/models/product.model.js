import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subcategories",
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    autoDeletedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

productSchema.pre("save", function () {
  if (this.stock === 0) {
    this.isDeleted = true;
    this.autoDeletedAt = new Date();
  } else {
    this.isDeleted = false;
    this.autoDeletedAt = null;
  }
});

export const Product = mongoose.model("products", productSchema);

