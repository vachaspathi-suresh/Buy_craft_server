const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, ref: "Song" },
  rating: {
    type: Number,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    max: 100,
  },
  origin: {
    type: String,
    required: true,
    max: 50,
  },
  description: {
    type: String,
    required: true,
  },
  imagelink_square: {
    type: String,
    required: true,
  },
  imagelink_portrait: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  average_rating: {
    type: Number,
    required: true,
  },
  ratings_count: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  owner: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  reviews: [{ type: reviewSchema }],
},{collection:'productNew'});

module.exports = mongoose.model("Product", productSchema);
