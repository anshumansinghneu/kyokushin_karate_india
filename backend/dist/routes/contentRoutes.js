"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contentController_1 = require("../controllers/contentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public route to get content
router.get('/', contentController_1.getAllContent);
// Admin only routes
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.restrictTo)('ADMIN'));
router.patch('/:key', contentController_1.updateContent);
router.post('/init', contentController_1.initializeContent);
exports.default = router;
