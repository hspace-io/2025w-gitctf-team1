const express = require("express");
const router = express.Router();
const { authController }= require("../controller/authController.cjs");

// API 명세서에 맞춰 /signUp (대문자 U) 사용
router.post("/signUp", authController.signup);

router.post("/login", authController.login);

module.exports = router;