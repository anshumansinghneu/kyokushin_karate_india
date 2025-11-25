"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const recognitionController_1 = require("../controllers/recognitionController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public route to get current champions
router.get('/', recognitionController_1.getCurrentMonthRecognitions);
// Admin only routes
router.post('/', authMiddleware_1.protect, (0, authMiddleware_1.restrictTo)('ADMIN'), recognitionController_1.assignRecognition);
router.delete('/:id', authMiddleware_1.protect, (0, authMiddleware_1.restrictTo)('ADMIN'), recognitionController_1.removeRecognition);
exports.default = router;
