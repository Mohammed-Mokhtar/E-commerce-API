import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.service.js";

cloudinary.config({
  cloud_name: env.cloudinaryName,
  api_key: env.cloudinaryKey,
  api_secret: env.cloudinarySecretKey,
});

export default cloudinary;
