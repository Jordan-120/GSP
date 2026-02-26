const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// Admin-only queue endpoint
router.get("/queue", authMiddleware, requireRole("Admin"), adminController.getQueue);

// Admin-only denial reasons
router.get("/denial-reasons", authMiddleware, requireRole("Admin"), adminController.getDenialReasons);

// Approve / Reject publishing
router.patch("/templates/:id/approve", authMiddleware, requireRole("Admin"), adminController.approveTemplate);
router.patch("/templates/:id/reject", authMiddleware, requireRole("Admin"), adminController.rejectTemplate);

module.exports = router;