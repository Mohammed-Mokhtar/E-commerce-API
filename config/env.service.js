import dotenv from "dotenv";

dotenv.config({ path: "./config/.env", quiet: true });

export const env = {
  port: process.env.PORT,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  verifyTokenExpiresIn: process.env.VERIFY_TOKEN_EXPIRES_IN,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  mailUser: process.env.MAIL_USER,
  mailPass: process.env.MAIL_PASS,
  mailFrom: process.env.MAIL_FROM,
  saltRounds: Number(process.env.SALT_ROUNDS),
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  webhookSigningSecret: process.env.WEBHOOK_SIGNING_SECRET,
  cloudinaryKey: process.env.CLOUDINARY_API_KEY,
  cloudinarySecretKey: process.env.CLOUDINARY_API_SECRET,
  cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME,
  maxFileSize: process.env.MAX_FILE_SIZE,
};
