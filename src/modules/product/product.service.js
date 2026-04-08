import { Product } from "../../database/models/product.model.js";

export const addProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, subcategory } = req.body;

    const addedProduct = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      subcategory,
    });
    return res
      .status(201)
      .json({ message: "product added successfully", product: addedProduct });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id });

    if (!product) return res.status(404).json({ message: "no product found" });

    const { name, description, price, stock, category, subcategory } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;

    await product.save();

    return res
      .status(200)
      .json({ message: "product updated successfully", product });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ message: "no product found" });

    if (product.isDeleted)
      return res.status(404).json({ message: "no product found" });

    product.isDeleted = true;
    product.deletedAt = new Date();

    await product.save();

    return res.status(200).json({ message: "product deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ message: "no product found" });

    product.stock = stock;

    await product.save();

    return res
      .status(200)
      .json({ message: "stock updated successfully", product });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

