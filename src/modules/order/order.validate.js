import joi from "joi";

export const orderCheckoutSchema = joi.object({
  paymentMethod: joi.string().valid("cod", "card").required(),
});

export const updateOrderStatusSchema = joi.object({
  status: joi
    .string()
    .valid("pending", "processing", "shipped", "delivered", "cancelled")
    .required(),
});
