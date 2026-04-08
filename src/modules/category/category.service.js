import { Category } from "../../database/models/category.model.js";
import { Subcategory } from "../../database/models/subcategory.model.js";

export const addCategory = async (req, res) => {
  try {
    let { name } = req.body;

    name = name.charAt(0).toUpperCase() + name.slice(1);

    const addedCategory = await Category.create({ name });
    return res
      .status(201)
      .json({ message: "category added successfully", addedCategory });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let { name } = req.body;

    name = name.charAt(0).toUpperCase() + name.slice(1);

    const category = await Category.findByIdAndUpdate(
      id,
      { name },
      { returnDocument: "after" },
    );

    return res.json({ message: "category updated successfully", category });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "no category found" });

    if (category.isDeleted)
      return res.status(404).json({ message: "no category found" });

    category.isDeleted = true;
    category.deletedAt = new Date();

    await category.save();
    return res.status(200).json({ message: "category deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }).populate(
      "subcategories",
    );

    return res.status(200).json({ message: "success", categories });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const getSubcategoriesByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategories = await Subcategory.find({ categoryId: id });

    return res.status(200).json({ message: "success", subcategories });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

