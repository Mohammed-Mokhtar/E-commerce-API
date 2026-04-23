import { Router } from "express";

import { auth, checkRole } from "../../middleware/auth.js";
import { validate } from "../../utils/validation.js";
import {
  addCategorySchema,
  updateCategorySchema,
} from "./category.validate.js";
import {
  addCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getSubcategoriesByCategory,
} from "./category.service.js";
import {
  resizeAndUploadSingleImage,
  uploadPhoto,
} from "../../middleware/imageUpload.js";

const router = Router();

router.post(
  "/",
  auth,
  checkRole("admin"),
  uploadPhoto.single("avatar"),
  validate(addCategorySchema),
  resizeAndUploadSingleImage("category"),
  addCategory,
);

router.put(
  "/:id",
  auth,
  checkRole("admin"),
  uploadPhoto.single("avatar"),
  validate(updateCategorySchema),
  resizeAndUploadSingleImage("category"),
  updateCategory,
);

router.delete("/:id", auth, checkRole("admin"), deleteCategory);

// public APIs
router.get("/", getCategories);

router.get("/:id/subcategories", getSubcategoriesByCategory);

export default router;

