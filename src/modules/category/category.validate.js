import joi from "joi";
import detectInjection from "../../utils/detectInjection.js";

export const addCategorySchema = joi.object({
  name: joi.string().trim().min(2).max(50).custom(detectInjection).required(),
  avatar: joi.string().optional().custom(detectInjection),
});

export const updateCategorySchema = joi.object({
  name: joi.string().trim().min(2).max(50).custom(detectInjection).required(),
  avatar: joi.string().optional().custom(detectInjection),
});
