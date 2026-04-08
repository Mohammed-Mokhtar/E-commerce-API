import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../../../config/env.service.js";
import { User } from "../../database/models/user.model.js";
import verifyEmailTemplate from "../../common/email/templates/verifyEmail.template.js";
import { sendMail } from "../../common/email/sendEmail.js";

export const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const sendVerificationLink = async (user) => {
  try {
    const token = jwt.sign({ id: user._id }, env.jwtSecret, {
      expiresIn: env.verifyTokenExpiresIn,
    });

    const verificationLink = `http://localhost:3000/api/v1/auth/verify-email/${token}`;

    await sendMail(
      user.email,
      "verify your account",
      `your activation link is ${verificationLink}`,
      verifyEmailTemplate(verificationLink),
    );
  } catch (err) {
    throw new Error(err.message);
  }
};

export const signup = async (req, res) => {
  try {
    const { name, email, phone, shippingAddress, password } = req.body;
    const existedEmail = await User.findOne({ email });
    if (existedEmail)
      return res.status(409).json({ message: "email already exist" });

    const hashedPassword = await bcrypt.hash(password, env.saltRounds);

    const addedUser = await User.create({
      name,
      email,
      password: hashedPassword,
      ...(phone ? { phone } : {}),
      ...(shippingAddress ? { shippingAddress } : {}),
    });

    await sendVerificationLink(addedUser);

    return res.status(201).json({
      message: "user created successfully verify your account to login",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existedUser = await User.findOne({ email, isDeleted: false });

    if (!existedUser)
      return res.status(401).json({ message: "email or password are wrong" });

    const matchedPassword = await bcrypt.compare(
      password,
      existedUser.password,
    );

    if (!matchedPassword)
      return res.status(401).json({ message: "email or password are wrong" });

    if (!existedUser.isVerified)
      return res
        .status(403)
        .json({ message: "you have to verify your account first" });

    const accessToken = jwt.sign({ id: existedUser._id }, env.jwtSecret, {
      expiresIn: env.accessTokenExpiresIn,
    });

    const refreshToken = jwt.sign({ id: existedUser._id }, env.jwtSecret, {
      expiresIn: env.refreshTokenExpiresIn,
    });

    return res.status(200).json({
      message: "login successfully",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ message: "something went wrong", err });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, env.jwtSecret);

    const user = await User.findOne({ _id: decoded.id, isDeleted: false });
    if (!user) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
            <h1>User not found</h1>
            <p>This verification link is no longer valid.</p>
          </body>
        </html>
      `);
    }

    if (user.isVerified) {
      return res.status(409).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
            <h1>You already verified</h1>
            <p>This verification link is no longer valid.</p>
          </body>
        </html>
      `);
    }

    user.isVerified = true;
    await user.save();
    return res.status(200).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
          <h1>Email verified successfully</h1>
          <p>You can now log in to your account.</p>
        </body>
      </html>
    `);
  } catch (err) {
    return res.status(400).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
          <h1>Verification failed</h1>
          <p>Your verification link is invalid or expired. Please request a new one.</p>
        </body>
      </html>
    `);
  }
};

export const resendVerification = async (req, res) => {
  try {
    let { email } = req.body;
    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    if (user.isVerified) {
      return res.status(409).json({ message: "account already verified" });
    }

    await sendVerificationLink(user);

    return res.status(200).json({ message: "verification email sent" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isDeleted: false });

    if (!user) return res.status(404).json({ message: "user not found" });

    let otp = generateRandomNumber(100000, 999999);

    await sendMail(user.email, "Forget Password", `Your otp is ${otp}`);

    user.otp = otp;

    await user.save();
    return res.status(200).json({ message: "otp sent successfully" });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email, isDeleted: false });
    if (!user) return res.status(404).json({ message: "user not found" });
    if (user.otp != otp)
      return res.status(400).json({ message: "otp is wrong" });
    const newHashedPassword = await bcrypt.hash(newPassword, env.saltRounds);

    user.password = newHashedPassword;
    user.otp = null;

    await user.save();
    return res.status(200).json({ message: "password reset successfully" });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong", err });
  }
};
