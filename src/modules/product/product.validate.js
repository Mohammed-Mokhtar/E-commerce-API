import joi from "joi";
import detectInjection from "../../utils/detectInjection.js";

export const addProductSchema = joi.object({
  name: joi.string().trim().min(2).max(100).custom(detectInjection).required(),
  description: joi.string().trim().custom(detectInjection).optional(),
  price: joi.number().min(0).required(),
  stock: joi.number().integer().min(0).required(),
  category: joi.string().trim().custom(detectInjection).required(),
  subcategory: joi.string().trim().custom(detectInjection).required(),
  images: joi.array().items(joi.string().custom(detectInjection)).optional(),
});

export const updateProductSchema = joi.object({
  name: joi.string().trim().min(2).max(100).custom(detectInjection).optional(),
  description: joi.string().trim().custom(detectInjection).optional(),
  price: joi.number().min(0).optional(),
  stock: joi.number().integer().min(0).optional(),
  category: joi.string().trim().custom(detectInjection).optional(),
  subcategory: joi.string().trim().custom(detectInjection).optional(),
  images: joi.array().items(joi.string().custom(detectInjection)).optional(),
});

export const updateStockSchema = joi.object({
  stock: joi.number().integer().min(0).required(),
});

