export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      context: {
        ipAddress: req.ip,
      },
    });
    if (error) {
      return res.status(400).json({
        details: error.details.map((item) => item.message),
      });
    }

    req.body = value;

    next();
  };
};
