import { Router } from "express";

import { auth, checkRole } from "../../middleware/auth.js";
import { validate } from "../../utils/validation.js";
import { updateOrderStatusSchema } from "./order.validate.js";
import { getAllOrders, updateOrderStatus } from "./order.service.js";

const router = Router();

router.get("/", auth, checkRole("admin"), getAllOrders);

router.patch(
  "/:id/status",
  auth,
  checkRole("admin"),
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);

export default router;

