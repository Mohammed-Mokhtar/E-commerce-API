import { Router } from "express";
import { validate } from "../../utils/validation.js";
import { checkCouponSchema } from "./coupon.validate.js";
import { Coupon } from "../../database/models/coupons.model.js";
import { auth } from "../../middleware/auth.js";
import { Order } from "../../database/models/order.model.js";

const router = Router();

router.post("/", auth, validate(checkCouponSchema), async (req, res) => {
  try {
    const { name } = req.body;
    const couponExist = await Coupon.findOne({ name, active: true });
    if (!couponExist)
      return res
        .status(404)
        .json({ message: "this coupon does not exist or is inactive" });

    if (couponExist.expiresAt && new Date() > new Date(couponExist.expiresAt)) {
      return res.status(400).json({ message: "this coupon has expired" });
    }

    const couponsUsed = await Order.countDocuments({
      user: req.user._id,
      couponId: couponExist._id,
    });

    if (couponsUsed >= couponExist.perUserLimit) {
      return res
        .status(400)
        .json({ message: "you have reached the usage limit for this coupon" });
    }

    return res.status(200).json({ message: "coupon exist", couponExist });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
});

export default router;
