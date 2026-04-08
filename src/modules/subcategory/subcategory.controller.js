import { Router } from "express";

import { auth, checkRole } from "../../middleware/auth.js";
import { validate } from "../../utils/validation.js";
import {
  addSubcategorySchema,
  updateSubcategorySchema,
} from "./subcategory.validate.js";
import {
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoryDetails,
} from "./subcategory.service.js";

const router = Router();

router.post(
  "/",
  auth,
  checkRole("admin"),
  validate(addSubcategorySchema),
  addSubcategory,
);

router.put(
  "/:id",
  auth,
  checkRole("admin"),
  validate(updateSubcategorySchema),
  updateSubcategory,
);

router.delete("/:id", auth, checkRole("admin"), deleteSubcategory);

// public APis
router.get("/:id", getSubcategoryDetails);

export default router;

