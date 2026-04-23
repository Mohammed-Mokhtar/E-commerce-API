import joi from "joi";
import detectInjection from "../../utils/detectInjection.js";

export const updateProfileSchema = joi.object({
  name: joi.string().trim().min(3).max(50).custom(detectInjection),
  phone: joi.string().trim().min(10).max(20).custom(detectInjection),
  city: joi.string().trim().min(2).max(50).custom(detectInjection),
});

