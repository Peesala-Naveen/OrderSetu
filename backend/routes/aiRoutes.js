// backend/routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { generateMenuDescription } = require("../controllers/aiController");

router.post(
    "/generate-menu-description",
    protect,   // you can keep or remove while testing
    generateMenuDescription
);

module.exports = router;