import jwt from "jsonwebtoken";
import { env } from "../../config/env.service.js";
import { User } from "../database/models/user.model.js";

export const auth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization)
      return res.status(401).json({ message: "no token provided" });

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({ message: "invalid bearer token" });
    }

    const token = authorization.split(" ")[1];

    const decoded = jwt.verify(token, env.jwtSecret);

    const user = await User.findOne({ _id: decoded.id, isDeleted: false });

    if (!user) return res.status(404).json({ message: "user not found" });

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const checkRole = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role))
      return res.status(403).json({ message: "not authorized" });

    next();
  };
};
