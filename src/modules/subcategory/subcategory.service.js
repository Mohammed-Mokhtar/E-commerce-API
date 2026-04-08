import { Category } from "../../database/models/category.model.js";
import { Subcategory } from "../../database/models/subcategory.model.js";

export const addSubcategory = async (req, res) => {
  try {
    let { name, categoryId } = req.body;
    const category = await Category.findOne({
      _id: categoryId,
      isDeleted: false,
    });

    if (!category)
      return res.status(404).json({ message: "no category found" });

    name = name.charAt(0).toUpperCase() + name.slice(1);

    const addedSubcategory = await Subcategory.create({
      name,
      categoryId,
    });

    return res
      .status(201)
      .json({ message: "subcategory added successfully", addedSubcategory });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, categoryId } = req.body;
    const category = await Category.findOne({
      _id: categoryId,
      isDeleted: false,
    });

    if (!category)
      return res.status(404).json({ message: "no category found" });

    name = name.charAt(0).toUpperCase() + name.slice(1);

    const subcategory = await Subcategory.findByIdAndUpdate(
      id,
      { name, categoryId },
      { returnDocument: "after" },
    );

    return res
      .status(200)
      .json({ message: "subcategory updated successfully", subcategory });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategory = await Subcategory.findById(id);

    if (!subcategory)
      return res.status(404).json({ message: "no subcategory found" });

    if (subcategory.isDeleted)
      return res.status(404).json({ message: "no subcategory found" });

    subcategory.isDeleted = true;
    subcategory.deletedAt = new Date();

    await subcategory.save();

    return res
      .status(200)
      .json({ message: "subcategory deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const getSubcategoryDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategory = await Subcategory.findById(id);

    if (!subcategory || subcategory.isDeleted)
      return res.status(404).json({ message: "no subcategory found" });

    return res
      .status(200)
      .json({ message: "subcategory found successfully", subcategory });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

