import { Router } from "express";

import { auth, checkRole } from "../../middleware/auth.js";
import { validate } from "../../utils/validation.js";
import { updateProfileSchema } from "./user.validate.js";

import {
  resizeAndUploadSingleImage,
  uploadPhoto,
} from "../../middleware/imageUpload.js";
import {
  deleteProfile,
  getProfile,
  restoreUser,
  updateProfile,
} from "./user.service.js";

const router = Router();

router.get("/profile", auth, getProfile);

router.put(
  "/profile",
  auth,
  uploadPhoto.single("avatar"),
  validate(updateProfileSchema),
  resizeAndUploadSingleImage("users"),
  updateProfile,
);

router.delete("/profile", auth, deleteProfile);

router.patch(
  "/profile/restore-user/:id",
  auth,
  checkRole("admin"),
  restoreUser,
);

export default router;

