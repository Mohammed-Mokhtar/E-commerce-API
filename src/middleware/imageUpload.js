import multer from "multer";

import { env } from "../../config/env.service.js";
import cloudinary from "../utils/cloudinary.js";

const storage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! please upload only image "), false);
  }
};

export const uploadPhoto = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: { fileSize: env.maxFileSize },
});

const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });
};

// middleware to resize image
export const resizeAndUploadSingleImage = (folderName) => {
  return async (req, res, next) => {
    if (!req.file) return next();
    try {
      const result = await uploadToCloudinary(req.file.buffer, {
        format: "webp",
        folder: `${folderName}`,
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        transformation: [
          {
            width: 500,
            height: 500,
            crop: "pad",
            background: "white",
            quality: "auto:low",
          },
        ],
      });

      console.log(result);

      req.imageUrl = result.secure_url;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export const resizeAndUploadMultipleImage = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();
  try {
    if (req.files.image) {
      const imageResult = await uploadToCloudinary(req.files.image[0].buffer, {
        folder: "products/main",
        format: "webp",
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        transformation: [
          {
            width: 800,
            height: 800,
            crop: "pad",
            background: "white",
            quality: "auto:low",
          },
        ],
      });
      req.imageUrl = imageResult.secure_url;
    }

    if (req.files.gallery) {
      const galleryPromises = req.files.gallery.map((file) => {
        return uploadToCloudinary(file.buffer, {
          folder: "products/gallery",
          format: "webp",
          public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
          transformation: [
            {
              width: 800,
              height: 800,
              crop: "pad",
              background: "white",
              quality: "auto:low",
            },
          ],
        });
      });
      const galleryResults = await Promise.all(galleryPromises);
      req.galleryUrls = galleryResults.map((result) => result.secure_url);
    }

    next();
  } catch (err) {
    next(err);
  }
};
