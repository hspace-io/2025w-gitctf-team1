// routes/club.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireClubStaff } = require('../middlewares/auth');
