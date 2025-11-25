"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const matchController_1 = require("../controllers/matchController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.get('/:id', matchController_1.getMatch);
router.post('/:matchId/start', (0, authMiddleware_1.restrictTo)('ADMIN'), matchController_1.startMatch);
router.post('/:matchId/end', (0, authMiddleware_1.restrictTo)('ADMIN'), matchController_1.endMatch);
router.patch('/:matchId/score', (0, authMiddleware_1.restrictTo)('ADMIN'), matchController_1.updateScore);
exports.default = router;
