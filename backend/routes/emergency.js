const express = require("express");
const emergencyController = require("../controllers/emergencyController");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

router.get("/:token", rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "emergency" }), emergencyController.resolve);

module.exports = router;
