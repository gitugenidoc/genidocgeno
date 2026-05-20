const express = require("express");
const parentController = require("../controllers/parentController");
const documentController = require("../controllers/documentController");
const { requireAuth, requireRole } = require("../middleware/sessionAuth");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(["PARENT"]));

router.get("/children", parentController.getChildren);
router.get("/children/:id/health-profile", parentController.getChildHealth);
router.put("/children/:id/health-profile", parentController.updateChildHealth);
router.get("/children/:id/authorizations", parentController.getAuthorizations);
router.put("/children/:id/authorizations", parentController.updateAuthorizations);
router.get("/children/:id/documents", documentController.listForStudent);
router.post("/children/:id/documents", documentController.uploadForStudent);

module.exports = router;
