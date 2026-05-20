const express = require("express");
const documentController = require("../controllers/documentController");
const { requireAuth } = require("../middleware/sessionAuth");

const router = express.Router();

router.use(requireAuth);
router.get("/:id/download", documentController.download);
router.delete("/:id", documentController.remove);

module.exports = router;
