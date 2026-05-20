const express = require("express");
const { requireAuth } = require("../middleware/sessionAuth");
const invitationController = require("../controllers/invitationController");

const router = express.Router();

router.use(requireAuth);
router.post("/", invitationController.create);

module.exports = router;
