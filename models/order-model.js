const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  product: [
    {
      product: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Product",
      },
      quantity: Number,
    },
  ],
  cost: { type: Number },
  orderedOn: { type: Date, required: true },
  status: { type: String, required: true },
  address: {
    place: String,
    street: String,
    city: String,
    state: String,
    pname: String,
    contact: String,
    zipcode: String,
    country: String,
  },
  deleveredOn: { type: Date, required: true },
  payment: { mode: String, details: Object },
});

module.exports = mongoose.model("Order", orderSchema);
