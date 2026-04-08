import joi from "joi";
import detectInjection from "../../utils/detectInjection.js";

export const signupSchema = joi.object({
  name: joi.string().min(2).max(100).required().custom(detectInjection),
  email: joi
    .string()
    .lowercase()
    .trim()
    .email()
    .required()
    .custom(detectInjection),
  phone: joi
    .string()
    .trim()
    .min(10)
    .max(20)
    .custom(detectInjection),
  shippingAddress: joi.object({
    city: joi.string().trim().min(2).max(50).required().custom(detectInjection),
  }),
  password: joi
    .string()
    .min(6)
    .max(50)
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$")),
});

export const loginSchema = joi.object({
  email: joi
    .string()
    .lowercase()
    .trim()
    .email()
    .required()
    .custom(detectInjection),
  password: joi
    .string()
    .min(6)
    .max(50)
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$")),
});

export const emailSchema = joi.object({
  email: joi
    .string()
    .lowercase()
    .trim()
    .email()
    .required()
    .custom(detectInjection),
});

export const resetPasswordSchema = joi.object({
  email: joi
    .string()
    .lowercase()
    .trim()
    .email()
    .required()
    .custom(detectInjection),
  otp: joi.number().min(100000).max(999999).required().custom(detectInjection),
  newPassword: joi
    .string()
    .min(6)
    .max(50)
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$")),
});
