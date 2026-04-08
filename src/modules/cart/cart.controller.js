import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { validate } from "../../utils/validation.js";
import { addItemToCartSchema, updateCartItemSchema } from "./cart.validate.js";
import {
  addItemToCart,
  getMyCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
} from "./cart.service.js";

const router = Router();

router.post("/", auth, validate(addItemToCartSchema), addItemToCart);

router.get("/", auth, getMyCart);

router.put("/:productId", auth, validate(updateCartItemSchema), updateCartItem);

router.delete("/:productId", auth, deleteCartItem);

router.delete("/", auth, clearCart);

export default router;
