const userControllers = require("../controllers/user-controllers");
const authCheck = require("../middle-wares/auth-check");

const router = require("express").Router();
const { check } = require("express-validator");

router.post("/signin", userControllers.signInMobile);
router.post("/signin-password", userControllers.login);
router.post("/refresh-token", userControllers.refreshAuthToken);
router.get("/verify-token", userControllers.verifyToken);

router.use(authCheck);

router.post("/update-profile", userControllers.updateProfile);
router.post("/update-address", userControllers.updateAddress);
router.post("/update-address-select", userControllers.updateSelectedAddress);
router.post("/get-profile", userControllers.getProfile);
router.post("/get-orders", userControllers.getOrderHistory);
router.post("/verify-email", userControllers.verifyEmail);
router.post("/change-password", userControllers.changePassword);

module.exports = router;
