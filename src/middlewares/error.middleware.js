const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    // mongoose vali error jab id galat dalte hai params mai
    statusCode = 400;
    message = "Invalid Id";
  }

  // dupli keys k lea h yeh vlaaa
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered. Please use another one.";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export { errorHandler };
