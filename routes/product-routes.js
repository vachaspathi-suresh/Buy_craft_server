const productControllers = require("../controllers/product-controllers");
const authCheck = require("../middle-wares/auth-check");

const router = require("express").Router();
const { check } = require("express-validator");

router.post("/get-products", productControllers.getProducts);
router.post("/get-products-catogery", productControllers.getProductsByCatogery);
router.post("/product-detail", productControllers.getProductDetail);

router.use(authCheck);

router.post("/add-product", productControllers.addProduct);
router.post("/add-cart", productControllers.addToCart);
router.post("/add-fav", productControllers.addToFav);
router.post("/rem-fav", productControllers.removeFav);
router.post("/rem-cart", productControllers.removeCart);
router.post("/get-cart", productControllers.getCart);
router.post("/get-fav", productControllers.getFav);

router.post("/add-dproduct", productControllers.addDProducts);

module.exports = router;
