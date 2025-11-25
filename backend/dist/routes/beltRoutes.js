"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const beltController_1 = require("../controllers/beltController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.post('/promote', (0, authMiddleware_1.restrictTo)('ADMIN', 'INSTRUCTOR'), beltController_1.promoteStudent);
router.get('/history/:userId', beltController_1.getBeltHistory);
exports.default = router;
