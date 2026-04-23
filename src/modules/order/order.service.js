import Stripe from "stripe";

import { env } from "../../../config/env.service.js";
import { Cart } from "../../database/models/cart.model.js";
import { Coupon } from "../../database/models/coupons.model.js";
import { Order } from "../../database/models/order.model.js";
import { Product } from "../../database/models/product.model.js";

const stripe = new Stripe(env.stripeSecretKey);

const validateAndApplyCoupon = async ({ couponCode, userId, totalAmount }) => {
  if (!couponCode) return null;

  const normalizedCouponCode =
    typeof couponCode === "string" ? couponCode.trim() : couponCode;

  if (!normalizedCouponCode) return null;

  const couponDoc = await Coupon.findOne({
    name: normalizedCouponCode,
    active: true,
  });

  if (!couponDoc) {
    return {
      status: 404,
      error: "this coupon does not exist or is inactive",
    };
  }

  if (couponDoc.expiresAt && new Date() > new Date(couponDoc.expiresAt)) {
    return {
      status: 400,
      error: "this coupon has expired",
    };
  }

  const totalCouponUsage = await Order.countDocuments({
    couponId: couponDoc._id,
  });

  if (totalCouponUsage >= couponDoc.usageLimits) {
    return {
      status: 400,
      error: "this coupon has reached its usage limit",
    };
  }

  const userCouponUsage = await Order.countDocuments({
    user: userId,
    couponId: couponDoc._id,
  });

  if (userCouponUsage >= couponDoc.perUserLimit) {
    return {
      status: 400,
      error: "you have reached the usage limit for this coupon",
    };
  }

  const discountAmount = Number(
    Math.min(
      (totalAmount * couponDoc.discountValue) / 100,
      couponDoc.maxAmount,
    ).toFixed(2),
  );
  const totalAmountAfterDiscount = Number(
    Math.max(totalAmount - discountAmount, 0).toFixed(2),
  );

  return {
    couponDoc,
    discountAmount,
    totalAmountAfterDiscount,
  };
};

export const fulfillCheckout = async (sessionId) => {
  // Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
  // Find your keys at https://dashboard.stripe.com/apikeys.

  console.log("Fulfilling Checkout Session " + sessionId);

  // TODO: Make sure fulfillment hasn't already been
  // performed for this Checkout Session
  const sameSessionId = await Order.findOne({ sessionId });
  if (sameSessionId) return;

  // Retrieve the Checkout Session from the API with line_items expanded
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product"],
  });

  // Check the Checkout Session's payment_status property
  // to determine if fulfillment should be performed
  if (checkoutSession.payment_status !== "unpaid") {
    // TODO: Perform fulfillment of the line items
    const totalAmountBeforeDiscount = Number(
      (checkoutSession.amount_subtotal ?? checkoutSession.amount_total) / 100,
    );
    const totalAmountAfterDiscount = Number(checkoutSession.amount_total) / 100;
    const couponId = checkoutSession.metadata?.couponId;

    const orderData = {
      user: checkoutSession.client_reference_id,
      items: checkoutSession.line_items.data.map((line_item) => ({
        product: line_item.price.product.metadata.productId,
        quantity: line_item.quantity,
        price: Number(line_item.price.unit_amount) / 100,
      })),
      totalAmountBeforeDiscount: totalAmountBeforeDiscount,
      paymentMethod: "card",
      paymentStatus: "paid",
      orderStatus: "pending",
      shippingAddress: {
        city: checkoutSession.customer_details.address.city,
        phone: checkoutSession.customer_details.phone,
      },
      sessionId: checkoutSession.id,
    };

    if (couponId) {
      orderData.couponId = couponId;
      orderData.totalAmountAfterDiscount = totalAmountAfterDiscount;
    }

    await Order.create(orderData);
    await Cart.findOneAndDelete({ user: checkoutSession.client_reference_id });
  }
};

export const declineCheckout = async (sessionId) => {
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product"],
  });

  for (const item of checkoutSession.line_items.data) {
    const productId = item.price.product.metadata.productId;
    const quantity = item.quantity;

    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: quantity },
    });
  }

  console.log(
    `Checkout Session ${sessionId} declined/expired. Stock restored.`,
  );
};

export const checkout = async (req, res) => {
  try {
    const { paymentMethod, coupon } = req.body;

    if (!req.user.shippingAddress?.city || !req.user.phone) {
      return res.status(400).json({
        message:
          "Please update your shipping address in your profile before checkout",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.productId",
    );

    if (!cart || !cart.items.length) {
      return res.status(404).json({ message: "cart is empty" });
    }

    const couponData = await validateAndApplyCoupon({
      couponCode: coupon,
      userId: req.user._id,
      totalAmount: cart.totalPrice,
    });

    if (couponData?.error) {
      return res.status(couponData.status).json({ message: couponData.error });
    }

    const totalAfterDiscount = couponData
      ? couponData.totalAmountAfterDiscount
      : cart.totalPrice;

    if (paymentMethod === "cod") {
      const orderData = {
        user: req.user._id,
        items: cart.items.map((item) => ({
          product: item.productId._id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmountBeforeDiscount: cart.totalPrice,
        paymentMethod: "cod",
        paymentStatus: "pending",
        orderStatus: "pending",
        shippingAddress: {
          city: req.user.shippingAddress.city,
          phone: req.user.phone,
        },
      };

      if (couponData) {
        orderData.couponId = couponData.couponDoc._id;
        orderData.totalAmountAfterDiscount = totalAfterDiscount;
      }

      const order = await Order.create(orderData);

      await Cart.findByIdAndDelete(cart._id);

      return res.status(201).json({
        message: "Order created successfully with Cash on Delivery",
        order,
      });
    }

    const line_items = cart.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "egp",
        product_data: {
          name: item.name,
          description: item.productId?.description,
          images: item.productId?.images,
          metadata: { productId: item.productId._id.toString() },
        },
        unit_amount: Math.round(item.price * 100),
      },
    }));

    const stripeSessionPayload = {
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      name_collection: {
        individual: {
          enabled: true,
        },
      },
      shipping_address_collection: {
        allowed_countries: ["EG"],
      },
      success_url: `${req.protocol}://${req.get("host")}/api/v1/order/success`,
      cancel_url: `${req.protocol}://${req.get("host")}/api/v1/order/cancel`,
      customer_email: req.user.email,
      client_reference_id: req.user.id,
      line_items,
      mode: "payment",
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 2,
      metadata: couponData
        ? {
            couponId: couponData.couponDoc._id.toString(),
          }
        : undefined,
    };

    if (couponData) {
      stripeSessionPayload.discounts = [{ coupon: couponData.couponDoc.name }];
    } else {
      stripeSessionPayload.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(stripeSessionPayload);

    for (const item of cart.items) {
      if (item.productId.stock == 0)
        return res.status(400).json({
          message: `${item.productId.name} is out of stock remove it from cart and continue`,
        });
      if (item.quantity > item.productId.stock) {
        return res.status(400).json({
          message: `Only ${item.productId.stock} units of ${item.productId.name} are available`,
        });
      }

      item.productId.stock -= item.quantity;
      await item.productId.save();
    }

    return res.status(200).json({
      message: "checkout session created",
      url: session.url,
      session,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort("-createdAt")
      .populate("items.product");

    return res
      .status(200)
      .json({ message: "orders retrieved successfully", orders });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: req.user.id })
      .populate("items.product")
      .populate("user", "name email");

    if (!order) return res.status(404).json({ message: "order not found" });

    const orderUserId = order.user?._id ?? order.user;
    const isOwner = String(orderUserId) === String(req.user._id);

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "not authorized" });
    }

    return res
      .status(200)
      .json({ message: "order retrieved successfully", order });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort("-createdAt")
      .populate("items.product")
      .populate("user", "name email");

    return res
      .status(200)
      .json({ message: "orders retrieved successfully", orders });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "order not found" });

    order.orderStatus = status;

    if (status === "delivered" && order.paymentMethod === "cod") {
      order.paymentStatus = "paid";
    }

    await order.save();

    return res.status(200).json({
      message: "order status updated successfully",
      order,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

