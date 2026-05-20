const express = require("express");
const router = express.Router();
const publicController = require("../controllers/publicController");

router.get("/status", publicController.status);
router.post("/contact", publicController.contact);
router.post("/demo-request", publicController.demoRequest);

module.exports = router;
