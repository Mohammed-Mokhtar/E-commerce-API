import { Router } from "express";
import { auth, checkRole } from "../../middleware/auth.js";
import { validate } from "../../utils/validation.js";
import {
  addProductSchema,
  updateProductSchema,
  updateStockSchema,
} from "./product.validate.js";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} from "./product.service.js";
import { APIFeatures } from "../../utils/APIFeatures.js";
import { Product } from "../../database/models/product.model.js";
import {
  resizeAndUploadMultipleImage,
  uploadPhoto,
} from "../../middleware/imageUpload.js";

const router = Router();

router.post(
  "/",
  auth,
  checkRole("admin"),
  uploadPhoto.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  validate(addProductSchema),
  resizeAndUploadMultipleImage,
  addProduct,
);

router.put(
  "/:id",
  auth,
  checkRole("admin"),
  uploadPhoto.fields([
    { name: "image", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  validate(updateProductSchema),
  resizeAndUploadMultipleImage,
  updateProduct,
);

router.patch(
  "/:id/stock",
  auth,
  checkRole("admin"),
  validate(updateStockSchema),
  updateStock,
);

router.delete("/:id", auth, checkRole("admin"), deleteProduct);

//public APIs
router.get("/", async (req, res) => {
  try {
    const queryString = req.query;

    const query = new APIFeatures(
      Product.find({ isDeleted: false }),
      queryString,
    )
      .filter()
      .sort()
      .paginate();

    const products = await query.query;

    return res.json({ message: "success", products });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, isDeleted: false });

    if (!product) return res.status(404).json({ message: "no product found" });

    return res.status(200).json({ message: "success", product });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
});

router.get("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({
      category: categoryId,
      isDeleted: false,
    });

    if (!products.length)
      return res.status(404).json({ message: "no products found" });

    return res.status(200).json({ message: "success", products });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
});

router.get("/subcategory/:subcategoryId", async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const products = await Product.find({
      subcategory: subcategoryId,
      isDeleted: false,
    });

    if (!products.length)
      return res.status(404).json({ message: "no products found" });

    return res.status(200).json({ message: "success", products });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
});

export default router;

