const HttpError = require("../models/http-error");
const Product = require("../models/product-model");
const User = require("../models/user-model");
const cloudinary = require("../models/cloudinary-model");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ quantity: { $gt: 0 } });
    const items = products.map((item) => {
      return {
        productId: item.id,
        name: item.name,
        origin: item.origin,
        image: item.imagelink_square,
        price: item.price,
        rating: item.average_rating,
        category: item.category,
      };
    });
    res.status(200).json({ products: [...items] });
  } catch (err) {
    return next(
      new HttpError("Unable to find Products, please try again later.", 500)
    );
  }
};

const getProductsByCatogery = async (req, res, next) => {
  try {
    const products = await Product.find({
      category: req.body.category,
      quantity: { $gt: 0 },
    });
    const items = products.map((item) => {
      return {
        productId: item.id,
        name: item.name,
        origin: item.origin,
        image: item.imagelink_square,
        price: item.price,
        rating: item.average_rating,
        category: item.category,
      };
    });
    res.status(200).json({ products: [...items] });
  } catch (err) {
    return next(
      new HttpError("Unable to find Products, please try again later.", 500)
    );
  }
};

const getProductDetail = async (req, res, next) => {
  try {
    const item = await Product.findById(req.body.productId).populate("owner");
    if (!item) {
      return next(new HttpError("Product not found", 404));
    }
    res.status(200).json({
      productId: item.id,
      name: item.name,
      origin: item.origin,
      description: item.description,
      image: item.imagelink_portrait,
      price: item.price,
      average_rating: item.average_rating,
      ratings_count: item.ratings_count,
      quantity: item.quantity,
      category: item.category,
      reviews: item.reviews,
      owner: {
        name: item.owner.name,
        email: item.owner.email,
        mobile: item.owner.mobile,
        address: item.owner.address.list.length===0?"":
          item.owner.address.list[0].hno +
          ", " +
          item.owner.address.list[0].street +
          ", " +
          item.owner.address.list[0].landmark +
          ", " +
          item.owner.address.list[0].city +
          ", " +
          item.owner.address.list[0].state +
          ", " +
          item.owner.address.list[0].country +
          ", " +
          item.owner.address.list[0].zipcode,
      },
    });
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Unable to find Product, please try again later.", 500)
    );
  }
};

const getProductVendorDetail = async (req, res, next) => {
  try {
    const item = await Product.findById(req.body.productId).populate("owner");
    if (!item) {
      return next(new HttpError("Product not found", 404));
    }
    res.status(200).json({
      productId: item.id,
      name: item.name,
      origin: item.origin,
      description: item.description,
      image: item.imagelink_portrait,
      price: item.price,
      average_rating: item.average_rating,
      ratings_count: item.ratings_count,
      quantity: item.quantity,
      category: item.category,
      reviews: item.reviews,
    });
  } catch (err) {
    return next(
      new HttpError("Unable to find Product, please try again later.", 500)
    );
  }
};

const addToCart = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId).populate("cart.product");
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Unable to Add to Cart, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  let item;
  try {
    item = await Product.findById(req.body.productId);
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Unable to Add to Cart, please try again later.", 500)
    );
  }
  if (!item) {
    return next(new HttpError("Product not found", 404));
  }
  try {
    let isP = false;
    user.cart = user.cart.map((p) => {
      if (p.product.id === item.id) {
        p.quantity = p.quantity + 1;
        isP = true;
      }
      return p;
    });
    if (!isP) user.cart.push({ product: item, quantity: 1 });
    await user.save();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Unable to Add to Cart, please try again later.", 500)
    );
  }
  let temp = user.cart.map((item) => {
    return {
      productId: item.product.id,
      name: item.product.name,
      image: item.product.imagelink_square,
      price: item.product.price,
      category: item.category,
      quantity: item.quantity,
    };
  });
  res.status(200).json({ cart: [...temp] });
};

const getCart = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId).populate("cart.product");
  } catch (err) {
    console.log(err);
    return next(
      new HttpError(
        "Unable to Get to Cart Details, please try again later.",
        500
      )
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  let temp = user.cart.map((item) => {
    return {
      productId: item.product.id,
      name: item.product.name,
      image: item.product.imagelink_square,
      price: item.product.price,
      category: item.category,
      quantity: item.quantity,
    };
  });
  res.status(200).json({ cart: [...temp] });
};

const getFav = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId).populate("fav");
  } catch (err) {
    console.log(err);
    return next(
      new HttpError(
        "Unable to Get to Favorite Details, please try again later.",
        500
      )
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  const items = user.fav.map((item) => {
    return {
      productId: item.id,
      name: item.name,
      origin: item.origin,
      description: item.description,
      image: item.imagelink_portrait,
      price: item.price,
      average_rating: item.average_rating,
      ratings_count: item.ratings_count,
      category: item.category,
    };
  });
  res.status(200).json({ fav: [...items] });
};

const addToFav = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId).populate("fav");
  } catch (err) {
    return next(
      new HttpError("Unable to Add to Fav, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  let item;
  try {
    item = await Product.findById(req.body.productId);
  } catch (err) {
    return next(
      new HttpError("Unable to Add to Fav, please try again later.", 500)
    );
  }
  if (!item) {
    return next(new HttpError("Product not found", 404));
  }
  try {
    user.fav.push(item);
    await user.save();
    const items = user.fav.map((data) => {
      return {
        productId: data.id,
        name: data.name,
        origin: data.origin,
        description: data.description,
        image: data.imagelink_portrait,
        price: data.price,
        average_rating: data.average_rating,
        ratings_count: data.ratings_count,
        category: data.category,
      };
    });
    res.status(200).json({ fav: [...items] });
  } catch (err) {
    return next(
      new HttpError("Unable to Add to Fav, please try again later.", 500)
    );
  }
};

const addProduct = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Unable to Add Product, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  if (user.userType !== "v") {
    return next(new HttpError("Invalid Authorization", 404));
  }
  let cloudinaryImage = { url: "" };
  try {
    cloudinaryImage = await cloudinary.uploader.upload(req.body.image, {
      upload_preset: "buycraft",
    });
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Unable to Add Product, please try again later.", 500)
    );
  }
  const newProduct = new Product({
    name: req.body.name,
    description: req.body.description,
    imagelink_portrait: cloudinaryImage.url,
    imagelink_square: cloudinaryImage.url,
    origin: req.body.origin,
    owner: user,
    price: req.body.price,
    quantity: req.body.quantity,
    ratings_count: 0,
    reviews: [],
    category: req.body.category,
    average_rating: 0,
  });
  try {
    await newProduct.save();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Adding Product failed, please try again later.", 500)
    );
  }
  res.status(200).json({ status: "success" });
};

const removeFav = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId).populate("fav");
  } catch (err) {
    return next(
      new HttpError("Unable to Remove from Fav, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  try {
    const temp = user.fav.filter((item) => item.id !== req.body.productId);
    user.fav = [...temp];
    await user.save();
    const items = user.fav.map((data) => {
      return {
        productId: data.id,
        name: data.name,
        origin: data.origin,
        description: data.description,
        image: data.imagelink_portrait,
        price: data.price,
        average_rating: data.average_rating,
        ratings_count: data.ratings_count,
        category: data.category,
      };
    });
    res.status(200).json({ fav: [...items] });
  } catch (err) {
    return next(
      new HttpError("Unable to Remove from Fav, please try again later.", 500)
    );
  }
};

const removeCart = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId).populate("cart.product");
  } catch (err) {
    return next(
      new HttpError("Unable to Remove from Cart, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  try {
    let temp = user.cart.filter(
      (item) => item.product.id !== req.body.productId || item.quantity > 1
    );
    temp = temp.map((item) => {
      if (item.product.id === req.body.productId)
        return { product: item.product, quantity: item.quantity - 1 };
      return item;
    });
    user.cart = [...temp];
    await user.save();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Unable to Remove from Cart, please try again later.", 500)
    );
  }
  let temp = user.cart.map((item) => {
    return {
      productId: item.product.id,
      name: item.product.name,
      image: item.product.imagelink_square,
      price: item.product.price,
      category: item.category,
      quantity: item.quantity,
    };
  });
  res.status(200).json({ cart: [...temp] });
};

/************************************************************testCase Dummy Data******************************************************/

const addDProducts = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Unable to Add Product, please try again later.", 500)
    );
  }
  if (!user) {
    return next(new HttpError("User not found", 404));
  }
  if (user.userType !== "v") {
    return next(new HttpError("Invalid Authorization", 404));
  }
  fetch("https://fakestoreapi.com/products")
    .then((res) => res.json())
    .then((json) => {
      json.map(async (p, i) => {
        if (i < 20) {
          const newProduct = new Product({
            name: p.title,
            description: p.description,
            imagelink_portrait:
              "https://i.pinimg.com/originals/9b/cb/ba/9bcbbaade70032a4456eb072782e6a62.jpg",
            imagelink_square:
              "https://i.pinimg.com/originals/9b/cb/ba/9bcbbaade70032a4456eb072782e6a62.jpg",
            origin: i % 2 === 0 ? "Assam" : "Meghalaya",
            owner: user,
            price: p.price,
            quantity: 1,
            ratings_count: p.rating.count,
            reviews: [],
            category: p.category,
            average_rating: p.rating.rate,
          });
          try {
            await newProduct.save();
          } catch (err) {
            console.log(err);
            return next(
              new HttpError(
                "Adding Product failed, please try again later.",
                500
              )
            );
          }
        }
      });
    });
  // const newProduct = new Product({
  //   name: req.body.name,
  //   description: req.body.description,
  //   imagelink_portrait: req.body.image_p,
  //   imagelink_square: req.body.image_s,
  //   origin: req.body.origin,
  //   owner: user,
  //   price: req.body.price,
  //   quantity: req.body.quantity,
  //   ratings_count: 0,
  //   reviews: [],
  //   category: req.body.category,
  //   average_rating: 0,
  // });
  try {
    // await newProduct.save();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Adding Product failed, please try again later.", 500)
    );
  }
  res.status(200).json({ status: "success" });
};

exports.getProducts = getProducts;
exports.getProductsByCatogery = getProductsByCatogery;
exports.getProductDetail = getProductDetail;
exports.addToCart = addToCart;
exports.addProduct = addProduct;
exports.addToFav = addToFav;
exports.removeCart = removeCart;
exports.removeFav = removeFav;
exports.getCart = getCart;
exports.getFav = getFav;

exports.addDProducts = addDProducts;
