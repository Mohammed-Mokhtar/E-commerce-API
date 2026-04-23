import joi from "joi";
import detectInjection from "../../utils/detectInjection.js";

export const addCouponSchema = joi.object({
  name: joi.string().min(2).max(20).trim().required().custom(detectInjection),
  discountValue: joi.number().min(1).max(100).required(),
  usageLimits: joi.number().min(1).required(),
  perUserLimit: joi.number().min(1).default(1).required(),
  maxAmount: joi.number().min(1).required(),
  expiresAt: joi.date().min("now").required(),
});

export const checkCouponSchema = joi.object({
  name: joi.string().min(2).max(20).trim().required().custom(detectInjection),
});

export const updateCoupon = joi.object({
  name: joi.string().min(2).max(20).trim().custom(detectInjection),
  discountValue: joi.number().min(1).max(100),
  usageLimits: joi.number().min(1),
  perUserLimit: joi.number().min(1).default(1),
  maxAmount: joi.number().min(1),
  expiresAt: joi.date().min("now"),
});
