const HttpError = require("../models/http-error");
const transporter = require("../models/nodemailer-model.js");
const User = require("../models/user-model");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const path = require("path");
const jwt = require("jsonwebtoken");

const signInMobile = async (req, res, next) => {
  let existingUser;
  try {
    if (req.body.isVendor) {
      existingUser = await User.findOne({
        mobile: req.body.mobile,
        userType: "v",
      }).populate("fav");
    } else {
      existingUser = await User.findOne({
        mobile: req.body.mobile,
        userType: "b",
      }).populate("fav");
    }
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Signing in failed, please try again later.", 500)
    );
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash("password", 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }
  let isNew = false;
  if (!existingUser) {
    isNew = true;
    existingUser = new User({
      name: "User",
      mobile: req.body.mobile,
      email: "empty",
      password: hashedPassword,
      isVerified: false,
      userType: req.body.isVendor ? "v" : "b",
      address: { selected: null, list: [] },
      cart: [],
      fav: [],
      orderHistory: [],
      account: {},
    });

    try {
      await existingUser.save();
    } catch (err) {
      console.log(err);
      return next(
        new HttpError("Signing up failed, please try again later.", 500)
      );
    }
  }

  let token;
  let refreshToken;
  try {
    token = jwt.sign(
      { userId: existingUser.id, mobile: existingUser.mobile, purpose: "n" },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    refreshToken = jwt.sign(
      { userId: existingUser.id, mobile: existingUser.mobile, purpose: "r" },
      process.env.TOKEN_SECRET,
      { expiresIn: "365d" }
    );
  } catch (err) {
    return next(
      new HttpError("Logging in failed, please try again later.", 500)
    );
  }
  let temp = existingUser.fav.map((item) => item.id);
  res.status(201).json({
    name: existingUser.name,
    userId: existingUser.id,
    userType: existingUser.userType,
    cartCount: existingUser.cart.length,
    fav: [...temp],
    isNew: isNew,
    token: token,
    refreshToken: refreshToken,
  });
};

const signUp = async (req, res, next) => {
  let existingUser;
  try {
    existingUser = await User.findOne({
      $or: [{ email: req.body.email }, { mobile: req.body.mobile }],
    });
  } catch (err) {
    return next(
      new HttpError("Signing up failed, please try again later.", 500)
    );
  }

  if (existingUser) {
    let error;
    if (existingUser.email === req.body.email) {
      error = new HttpError(
        "Account with Email already exists, Please Login.",
        422
      );
    } else {
      error = new HttpError(
        "Account with Mobile Number already exists, Please Login.",
        422
      );
    }
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(req.body.password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }

  let newUser;

  try {
    newUser = new User({
      name: req.body.name,
      mobile: req.body.mobile,
      email: req.body.email,
      password: hashedPassword,
      isVerified: false,
      userType: req.body.isVendor ? "v" : "b",
      address: { selected: null, list: [] },
      cart: [],
      fav: [],
      orderHistory: [],
      account: {},
    });
    await newUser.save();
  } catch (err) {
    return next(
      new HttpError("Signing up failed, please try again later.", 500)
    );
  }

  let token;
  let refreshToken;
  try {
    token = jwt.sign(
      { userId: newUser.id, mobile: newUser.mobile, purpose: "n" },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    refreshToken = jwt.sign(
      { userId: newUser.id, mobile: newUser.mobile, purpose: "r" },
      process.env.TOKEN_SECRET,
      { expiresIn: "365d" }
    );
  } catch (err) {
    return next(
      new HttpError("Logging in failed, please try again later.", 500)
    );
  }

  res.status(201).json({
    name: newUser.name,
    userId: newUser.id,
    userType: newUser.userType,
    cartCount: newUser.cart.length,
    token: token,
    refreshToken: refreshToken,
  });
};

const login = async (req, res, next) => {
  let existingUser;

  try {
    existingUser = await User.findOne({
      $or: [
        { email: req.body.username },
        { mobile: "+91" + req.body.username },
      ],
    }).populate("fav");
  } catch (err) {
    return next(
      new HttpError("Logging in failed, please try again later.", 500)
    );
  }

  if (!existingUser) {
    const error = new HttpError("Invalid credentials.", 403);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(
      req.body.password,
      existingUser.password
    );
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Logging in failed, please try again later.", 500)
    );
  }

  if (!isValidPassword) {
    console.log(req.body.password);
    return next(new HttpError("Invalid credentials.", 403));
  }

  let token;
  let refreshToken;
  try {
    token = jwt.sign(
      { userId: existingUser.id, mobile: existingUser.mobile, purpose: "n" },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    refreshToken = jwt.sign(
      { userId: existingUser.id, mobile: existingUser.mobile, purpose: "r" },
      process.env.TOKEN_SECRET,
      { expiresIn: "365d" }
    );
  } catch (err) {
    return next(
      new HttpError("Logging in failed, please try again later.", 500)
    );
  }

  let temp = existingUser.fav.map((item) => item.id);
  res.status(201).json({
    name: existingUser.name,
    userId: existingUser.id,
    userType: existingUser.userType,
    cartCount: existingUser.cart.length,
    fav: [...temp],
    token: token,
    refreshToken: refreshToken,
  });
};

const refreshAuthToken = async (req, res, next) => {
  let token;
  let newToken;
  let existingUser;
  try {
    token = req.headers.authorization.split(" ")[1];
    if (!token) {
      const error = new HttpError("InvalidToken", 403);
      return next(error);
    }
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    newToken = jwt.sign(
      {
        userId: decodedToken.userId,
        mobile: decodedToken.mobile,
        purpose: "n",
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    existingUser = await User.findById(decodedToken.userId).populate("fav");
    if (!existingUser) {
      const error = new HttpError("InvalidToken", 403);
      return next(error);
    }
    console.log("Verify");
  } catch (err) {
    const error = new HttpError("InvalidToken", 403);
    return next(error);
  }
  let temp = existingUser.fav.map((item) => item.id);
  res.status(201).json({
    name: existingUser.name,
    userId: existingUser.id,
    userType: existingUser.userType,
    cartCount: existingUser.cart.length,
    fav: [...temp],
    newToken: newToken,
  });
};

const getProfile = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(
      new HttpError("Unable to Find Profile, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }

  res.status(201).json({
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    mobile: user.mobile,
    userType: user.userType,
    address: user.address,
  });
};

const getOrderHistory = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId).populate("orderHistory");
  } catch (err) {
    return next(
      new HttpError("Unable to get Order History, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }

  res.status(201).json({
    orders: [...user.orderHistory],
  });
};

const updateProfile = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(
      new HttpError("Unable to Update Profile, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  try {
    user.isVerified = user.email === req.body.email ? user.isVerified : false;
    user.name = req.body.name;
    user.email = req.body.email;
    user.address = {
      selected: req.body.address.selected,
      list: [...req.body.address.list],
    };
    await user.save();
    if (user.address.list.length === 1)
      user.address.selected = user.address.list[0];
    await user.save();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Unable to Update Profile, please try again later.", 500)
    );
  }
  res.status(201).json({
    name: user.name,
    email: user.email,
    address: user.address,
  });
};

const updateAddress = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(
      new HttpError("Unable to Update Address, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  try {
    user.address.list = [
      ...user.address.list.map((item) => {
        if (item.id === req.body.address._id) {
          return { ...req.body.address };
        }
        return item;
      }),
    ];
    if (req.body.address._id === "new")
      user.address.list.push({
        addressType: req.body.address.addressType,
        hno: req.body.address.hno,
        street: req.body.address.street,
        city: req.body.address.city,
        state: req.body.address.state,
        landmark: req.body.address.landmark,
        pname: req.body.address.pname,
        contact: req.body.address.contact,
        zipcode: req.body.address.zipcode,
        country: req.body.address.country,
      });
    await user.save();
  } catch (err) {
    return next(
      new HttpError("Unable to Update Address, please try again later.", 500)
    );
  }
  res.status(201).json({
    address: user.address,
  });
};

const updateSelectedAddress = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(
      new HttpError("Unable to Update Address, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  try {
    user.address.selected = user.address.list.find(
      (value) => value.id === req.body.addressId
    );
    await user.save();
  } catch (err) {
    return next(
      new HttpError("Unable to Update Address, please try again later.", 500)
    );
  }
  res.status(201).json({
    address: user.address,
  });
};

const verifyEmail = async (req, res, next) => {
  let existingUser;
  try {
    existingUser = await User.findById(req.userData.userId);
  } catch (err) {
    return next(
      new HttpError("Unable to verify email, please try again later.", 500)
    );
  }

  if (!existingUser) {
    const error = new HttpError("User not found.", 403);
    return next(error);
  }
  let token;
  try {
    const secret =
      process.env.TOKEN_SECRET + existingUser.mobile + existingUser.email;
    token = jwt.sign({ uid: existingUser.id }, secret, {
      expiresIn: "15m",
    });
  } catch (err) {
    return next(
      new HttpError("Unable to verify email, please try again later.", 500)
    );
  }
  const url = `${process.env.BASE_ORIGIN}/api/auth/verify-token?vuid=${existingUser.id}&vtuid=${token}`;
  console.log(url);
  const mailOptions = {
    from: "buyit.help@gmail.in",
    to: existingUser.email,
    subject: "Verify your Email",
    html: `<h1>BuyIt</h1><p>Hi ${existingUser.name},</p><p>Please verify your Email</p><a href="${url}"><button style="background-color:blue;color:white;padding:10px;border:0;margin:1% 3%;width:94%;cursor:pointer;">Verify Email</button></a><br/><p>if you ignore this message, your email will not be verified.</p><p><strong>Note::</strong>The above link is only valid for 15 minutes</p>`,
  };

  try {
    await transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        return next(
          new HttpError("Unable to verify email, please try again later.")
        );
      } else {
        res.status(200).json({ email: existingUser.email });
      }
    });
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Unable to verify email, please try again later.", 500)
    );
  }
};

const verifyToken = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.query.vuid);
  } catch (err) {
    return next(
      new HttpError("Unable to verify link, please try again later.", 500)
    );
  }
  console.log(req.query.vuid);
  if (!user) {
    const error = new HttpError("Invalid Link.", 403);
    return next(error);
  }
  try {
    const secret = process.env.TOKEN_SECRET + user.mobile + user.email;
    const decodeToken = jwt.verify(req.query.vtuid, secret);
    user.isVerified = true;
    await user.save();
    res.sendFile(path.join(__dirname, "../public", "verified.html"));
  } catch (err) {
    console.log(err.name);
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError")
      res.sendFile(path.join(__dirname, "../public", "fail.html"));
    else
      return next(
        new HttpError("Unable to verify link, please try again later.", 500)
      );
  }
};

const changePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid User, please select another.", 422));
  }

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(
      new HttpError("Unable to change password, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(
      req.body.currPassword,
      user.password
    );
  } catch (err) {
    return next(
      new HttpError("Unable to change password, please try again later.", 500)
    );
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid Current Password.", 403);
    return next(error);
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
    user.password = hashedPassword;
    user.save();
    res.status(200).json({ uid: user.id });
  } catch (err) {
    return next(
      new HttpError("Unable to change password, please try again.", 500)
    );
  }
};

const forgetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("User with Email not found.", 403));
  }

  let existingUser;
  try {
    existingUser = await User.findOne({ email: req.body.email });
  } catch (err) {
    return next(
      new HttpError("Unable to Generate link, please try again later.", 500)
    );
  }

  if (!existingUser) {
    const error = new HttpError("User with Email not found.", 403);
    return next(error);
  }
  let token;
  try {
    const secret =
      process.env.TOKEN_SECRET + existingUser.password.slice(0, 10);
    token = jwt.sign({ uid: existingUser.id }, secret, {
      expiresIn: "15m",
    });
  } catch (err) {
    return next(
      new HttpError("Unable to Generate link, please try again later.", 500)
    );
  }
  const url = `${process.env.CLIENT_ORIGIN}/auth/reset-password?rsid=${existingUser.id}&ratuid=${token}`;
  const mailOptions = {
    from: "onbeats.help@gmail.in",
    to: existingUser.email,
    subject: "Reset your password",
    html: `<h1>Onbeats</h1><p>Hi ${existingUser.username},</p><p>We got a request to reset your Onbeats password</p><a href="${url}"><button style="background-color:blue;color:white;padding:10px;border:0;margin:1% 3%;width:94%;cursor:pointer;">Reset Password</button></a><br/><p>if you ignore this message, your password will not be changed.</p><p><strong>Note::</strong>The above link is only valid for 15 minutes</p>`,
  };

  try {
    await transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        return next(
          new HttpError("Unable to Generate link, please try again later.")
        );
      } else {
        res.status(200).json({ email: existingUser.email });
      }
    });
  } catch (err) {
    return next(
      new HttpError("Unable to Generate link, please try again later.", 500)
    );
  }
};

const verifyResetToken = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.body.uid);
  } catch (err) {
    return next(
      new HttpError("Unable to verify link, please try again later.", 500)
    );
  }

  if (!user) {
    const error = new HttpError("Invalid Link.", 403);
    return next(error);
  }
  try {
    const secret = process.env.TOKEN_SECRET + user.password.slice(0, 10);
    const decodeToken = jwt.verify(req.body.token, secret);
    res.status(200).json({ uid: decodeToken.uid });
  } catch (err) {
    return next(
      new HttpError("Unable to verify link, please try again later.", 500)
    );
  }
};
const resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid Password", 422));
  }

  let user;
  try {
    user = await User.findById(req.body.uid);
  } catch (err) {
    return next(
      new HttpError("Unable to change password, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }

  try {
    const secret = process.env.TOKEN_SECRET + user.password.slice(0, 10);
    jwt.verify(req.body.token, secret);
  } catch (err) {
    return next(
      new HttpError("Unable to verify link, please try again later.", 500)
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
    user.password = hashedPassword;
    user.save();
    res.status(200).json({ uid: user.id });
  } catch (err) {
    return next(
      new HttpError("Unable to change password, please try again.", 500)
    );
  }
};

exports.signInMobile = signInMobile;
exports.login = login;
exports.refreshAuthToken = refreshAuthToken;
exports.updateProfile = updateProfile;
exports.getOrderHistory = getOrderHistory;
exports.getProfile = getProfile;
exports.updateAddress = updateAddress;
exports.updateSelectedAddress = updateSelectedAddress;
exports.verifyEmail = verifyEmail;
exports.verifyToken = verifyToken;
exports.changePassword = changePassword;
