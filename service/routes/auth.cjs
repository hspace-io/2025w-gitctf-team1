const express = require("express");
const router = express.Router();
const { authController }= require("../controller/authController.cjs");

router.post("/signUp", authController.signup);

router.post("/login", authController.login);

module.exports = router;