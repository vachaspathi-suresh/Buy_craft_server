const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  addressType: { type: String },
  hno: { type: String },
  street: { type: String },
  landmark: { type: String },
  city: { type: String },
  state: { type: String },
  pname: { type: String },
  contact: { type: String },
  zipcode: { type: String },
  country: { type: String },
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    max: 50,
  },
  email: {
    type: String,
    required: true,
    max: 50,
  },
  mobile: {
    type: String,
    required: true,
    max: 15,
  },
  password: {
    type: String,
    required: true,
    min: 8,
  },
  isVerified: {
    type: Boolean,
    required: true,
  },
  userType: {
    type: String,
    required: true,
  },
  cart: [
    {
      product: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Product",
      },
      quantity: Number,
    },
  ],
  fav: [{ type: mongoose.Types.ObjectId, required: true, ref: "Product" }],
  orderHistory: [
    { type: mongoose.Types.ObjectId, required: true, ref: "Order" },
  ],
  address: {
    selected: mongoose.Types.ObjectId,
    list: [{ type: addressSchema }],
  },
  account: { type: Object },
});

module.exports = mongoose.model("User", userSchema);
