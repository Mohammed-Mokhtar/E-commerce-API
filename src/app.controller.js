import express from "express";
import helmet from "helmet";
import Stripe from "stripe";
import cors from "cors";

import { env } from "../config/env.service.js";
import { databaseConnection } from "./database/connection.js";

import authRouter from "./modules/auth/auth.controller.js";
import userRouter from "./modules/user/users.controller.js";
import categoryRouter from "./modules/category/category.controller.js";
import subcategoryRouter from "./modules/subcategory/subcategory.controller.js";
import productRouter from "./modules/product/product.controller.js";
import cartRouter from "./modules/cart/cart.controller.js";
import orderRouter from "./modules/order/order.controller.js";
import adminOrderRouter from "./modules/order/admin.order.controller.js";
import adminCouponRouter from "./modules/coupon/admin.coupon.controller.js";
import couponRouter from "./modules/coupon/coupon.controller.js";

import {
  declineCheckout,
  fulfillCheckout,
} from "./modules/order/order.service.js";

const stripe = new Stripe(env.stripeSecretKey);

export const bootstrap = () => {
  const app = express();

  app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      let event;

      if (env.webhookSigningSecret) {
        const signature = req.headers["stripe-signature"];

        try {
          event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            env.webhookSigningSecret,
          );
        } catch (err) {
          console.log("Webhook signature verification failed.", err.message);
          return res.sendStatus(400);
        }
      } else {
        event = JSON.parse(req.body.toString());
      }

      try {
        if (
          event.type === "checkout.session.completed" ||
          event.type === "checkout.session.async_payment_succeeded"
        ) {
          await fulfillCheckout(event.data.object.id);
        } else if (
          event.type === "checkout.session.expired" ||
          event.type === "checkout.session.async_payment_failed"
        ) {
          await declineCheckout(event.data.object.id);
        }
      } catch (err) {
        console.log("Webhook processing failed.", err.message);
        return res.sendStatus(500);
      }

      return res.sendStatus(200);
    },
  );

  app.use(express.json());
  app.use(helmet());
  app.use(cors({ origin: "http://localhost:3000" }));

  databaseConnection();

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/categories", categoryRouter);
  app.use("/api/v1/subcategories", subcategoryRouter);
  app.use("/api/v1/products", productRouter);
  app.use("/api/v1/cart", cartRouter);
  app.use("/api/v1/admin/orders", adminOrderRouter);
  app.use("/api/v1/orders", orderRouter);
  app.use("/api/v1/admin/coupons", adminCouponRouter);
  app.use("/api/v1/coupons", couponRouter);

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error";

    if (statusCode >= 500) {
      console.error(err);
    }

    return res.status(statusCode).json({ message });
  });

  app.listen(env.port, () => {
    console.log(`listening on port ${env.port}`);
  });
};

