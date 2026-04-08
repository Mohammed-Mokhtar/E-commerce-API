import joi from "joi";
import detectInjection from "../../utils/detectInjection.js";

export const addSubcategorySchema = joi.object({
  name: joi.string().trim().min(2).max(50).custom(detectInjection).required(),
  categoryId: joi.string().trim().custom(detectInjection).required(),
  image: joi.string().optional().custom(detectInjection),
});

export const updateSubcategorySchema = joi.object({
  name: joi.string().trim().min(2).max(50).custom(detectInjection).required(),
  categoryId: joi.string().trim().custom(detectInjection).required(),
  image: joi.string().optional().custom(detectInjection),
});
