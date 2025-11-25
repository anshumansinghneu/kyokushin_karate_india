"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tournamentController_1 = require("../controllers/tournamentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.post('/:eventId/generate', (0, authMiddleware_1.restrictTo)('ADMIN'), tournamentController_1.generateBrackets);
router.get('/:eventId', tournamentController_1.getBrackets);
exports.default = router;
