import joi from "joi";
import detectInjection from "../../utils/detectInjection.js";

export const orderCheckoutSchema = joi.object({
  paymentMethod: joi.string().valid("cod", "card").required(),
  coupon: joi
    .string()
    .trim()
    .min(1)
    .max(20)
    .custom(detectInjection)
    .allow("", null),
});

export const updateOrderStatusSchema = joi.object({
  status: joi
    .string()
    .valid("pending", "processing", "shipped", "delivered", "cancelled")
    .required(),
});
