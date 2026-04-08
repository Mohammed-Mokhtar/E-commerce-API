import bcrypt from "bcrypt";
import mongoose from "mongoose";

import { env } from "../config/env.service.js";
import { User } from "../src/database/models/user.model.js";

import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const createAdmin = async () => {
  try {
    await mongoose.connect(env.mongodbUri);

    const email = env.adminEmail;
    const plainPassword = env.adminPassword;

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(plainPassword, env.saltRounds);

    await User.create({
      name: "Admin",
      email,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });

    console.log("Admin user created successfully");
  } catch (error) {
    console.log("Failed to create admin user:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
