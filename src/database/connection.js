import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "../../config/env.service.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

export const databaseConnection = () => {
  mongoose
    .connect(env.mongodbUri)
    .then(() => {
      console.log("database connected");
    })
    .catch((err) => {
      console.log("database connection error:", err);
    });
};
