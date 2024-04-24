const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("Authentication failed!");
    }
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    req.userData = { userId: decodedToken.userId, mobile: decodedToken.mobile };
    next();
  } catch (err) {
    let error;
    if (err.name === "TokenExpiredError") {
      error = new HttpError("TokenExpired", 401);
    } else {
      error = new HttpError("InvalidToken", 403);
    }
    return next(error);
  }
};
