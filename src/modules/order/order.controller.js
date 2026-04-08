import { Router } from "express";
import { auth } from "../../middleware/auth.js";

import { orderCheckoutSchema } from "./order.validate.js";
import { validate } from "../../utils/validation.js";
import { checkout, getMyOrders, getOrderDetails } from "./order.service.js";

const router = Router();

router.post("/checkout", auth, validate(orderCheckoutSchema), checkout);

router.get("/", auth, getMyOrders);

router.get("/:id", auth, getOrderDetails);

export default router;
