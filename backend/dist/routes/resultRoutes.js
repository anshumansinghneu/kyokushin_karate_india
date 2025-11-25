"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resultController_1 = require("../controllers/resultController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public
router.get('/:eventId', resultController_1.getResults);
// Protected
router.use(authMiddleware_1.protect);
router.post('/:bracketId/calculate', (0, authMiddleware_1.restrictTo)('ADMIN'), resultController_1.calculateResults);
exports.default = router;
