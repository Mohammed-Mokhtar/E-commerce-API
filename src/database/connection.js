import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "../../config/env.service.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

let connectionPromise;

export const databaseConnection = async () => {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.mongodbUri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .then(() => {
        console.log("database connected");
        return mongoose.connection;
      })
      .catch((err) => {
        connectionPromise = undefined;
        console.error("database connection error:", err);
        throw err;
      });
  }

  return connectionPromise;
};
