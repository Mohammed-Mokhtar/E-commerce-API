import { Router } from "express";
import { auth, checkRole } from "../../middleware/auth.js";
import { Coupon } from "../../database/models/coupons.model.js";
import { validate } from "../../utils/validation.js";
import { addCouponSchema, updateCoupon } from "./coupon.validate.js";
import Stripe from "stripe";
import { env } from "../../../config/env.service.js";

const stripe = new Stripe(env.stripeSecretKey);

const router = Router();

router.post(
  "/",
  auth,
  checkRole("admin"),
  validate(addCouponSchema),
  async (req, res) => {
    try {
      const {
        name,
        discountValue,
        usageLimits,
        perUserLimit,
        maxAmount,
        expiresAt,
      } = req.body;

      const stripeCoupon = await stripe.coupons.create({
        id: name,
        percent_off: discountValue,
        duration: "once",
        redeem_by: Math.floor(new Date(expiresAt).getTime() / 1000),
      });

      const stripePromoCode = await stripe.promotionCodes.create({
        promotion: {
          type: "coupon",
          coupon: stripeCoupon.id,
        },
        code: name,
      });

      const couponAdded = await Coupon.create({
        name,
        discountValue,
        usageLimits,
        perUserLimit,
        maxAmount,
        expiresAt,
      });

      res.status(201).json({ message: "coupon added", couponAdded });
    } catch (err) {
      res
        .status(500)
        .json({ message: "something went wrong", err: err.message });
    }
  },
);

router.get("/", auth, checkRole("admin"), async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json({ message: "coupons found", coupons });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
});

router.delete("/:id", auth, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCoupon = await Coupon.findById(id);
    if (!deletedCoupon)
      return res.status(404).json({ message: "coupon not found" });
    if (!deletedCoupon.active)
      return res
        .status(400)
        .json({ message: "this coupon already deactivated" });

    deletedCoupon.active = false;
    await deletedCoupon.save();
    res.status(200).json({ message: "coupon deactivated", deletedCoupon });
  } catch (err) {
    res.status(500).json({ message: "something went wrong", err: err.message });
  }
});

router.patch(
  "/:id",
  auth,
  checkRole("admin"),
  validate(updateCoupon),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        discountValue,
        usageLimits,
        perUserLimit,
        maxAmount,
        expiresAt,
      } = req.body;

      const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!updatedCoupon)
        return res.status(404).json({ message: "coupon not found" });

      res.status(200).json({ message: "coupon updated", updatedCoupon });
    } catch (err) {
      res
        .status(500)
        .json({ message: "something went wrong", err: err.message });
    }
  },
);

router.patch("/activate/:id", auth, checkRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) return res.status(404).json({ message: "coupon not found" });
    if (coupon.active)
      return res.status(400).json({ message: "this coupon already active" });

    coupon.active = true;
    await coupon.save();
    res.status(200).json({ message: "coupon activated", coupon });
  } catch (err) {
    res.status(500).json({ message: "something went wrong", err: err.message });
  }
});

export default router;
