import joi from "joi";
import detectInjection from "../../utils/detectInjection.js";

export const addItemToCartSchema = joi.object({
  productId: joi.string().trim().required().custom(detectInjection),
  quantity: joi.number().min(1).required(),
});

export const updateCartItemSchema = joi.object({
  quantity: joi.number().min(1).required(),
});
