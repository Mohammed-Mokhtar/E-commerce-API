import { Router } from "express";

import { validate } from "../../utils/validation.js";
import {
  emailSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "./auth.validate.js";
import {
  forgotPassword,
  login,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
} from "./auth.service.js";

const router = Router();

router.post("/signup", validate(signupSchema), signup);

router.post("/login", validate(loginSchema), login);

router.get("/verify-email/:token", verifyEmail);

router.post("/resend-verification", validate(emailSchema), resendVerification);

router.post("/forgot-password", validate(emailSchema), forgotPassword);

router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
