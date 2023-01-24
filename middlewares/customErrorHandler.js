import createError from "http-errors";

// 404 not found error
export const notFoundHandler = (req, res, next) => {
  next(createError(404, "Your requested resource was not found"));
};

// default error handler
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const error =
    process.env.NODE_ENV === "development"
      ? err
      : err.message || "Internal server error";
  res.status(statusCode).json({
    status: statusCode,
    error,
  });
};
