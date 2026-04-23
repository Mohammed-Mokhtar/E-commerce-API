import { User } from "../../database/models/user.model.js";

export const getProfile = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ message: "profile retrieved successfully", profile: req.user });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, shippingAddress } = req.body;

    console.log(req.imageUrl);

    if (name !== undefined) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    if (shippingAddress !== undefined)
      req.user.shippingAddress = shippingAddress;
    if (req.imageUrl !== undefined) req.user.avatar = req.imageUrl;

    await req.user.save();
    return res
      .status(200)
      .json({ message: "profile updated successfully", profile: req.user });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    req.user.isDeleted = true;
    await req.user.save();
    return res.status(200).json({ message: "user deleted Successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "user not found" });

    if (!user.isDeleted)
      return res.status(409).json({ message: "user already exist" });

    user.isDeleted = false;
    await user.save();

    return res.status(200).json({ message: "user restored Successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", err: err.message });
  }
};

