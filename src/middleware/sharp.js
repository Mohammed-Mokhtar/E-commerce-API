import sharp from "sharp";

export const resizePhotoUser = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `user-${req.user._id}-${Date.now()}.jpeg`;

    req.file.buffer = await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toBuffer();

    next();
  } catch (err) {
    next(err);
  }
};
