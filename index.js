require("dotenv").config();

const userRoutes = require("./routes/user-routes");
const productRoutes = require("./routes/product-routes");
const HttpError = require("./models/http-error");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", userRoutes);
app.use("/api/product", productRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.DB_URL, { useNewUrlParser: true })
  .then(() => {
    try {
      app.listen(process.env.PORT || 5000, () => {
        console.log("Server is up and listening");
      });
    } catch (err) {
      console.error(err);
    }
  })
  .catch((err) => {
    console.log("ERROR_CONNECTING_DATABASE", err);
  });
