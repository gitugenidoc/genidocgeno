const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/sessionAuth");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();

router.post("/login", rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "login" }), authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", rateLimit({ windowMs: 60_000, max: 5, keyPrefix: "forgot" }), authController.forgotPassword);
router.post("/reset-password", rateLimit({ windowMs: 60_000, max: 5, keyPrefix: "reset" }), authController.resetPassword);
router.post("/accept-invitation", rateLimit({ windowMs: 60_000, max: 5, keyPrefix: "invite" }), authController.acceptInvitation);
router.get("/me", requireAuth, authController.me);
router.get("/permissions", requireAuth, authController.permissions);

module.exports = router;
