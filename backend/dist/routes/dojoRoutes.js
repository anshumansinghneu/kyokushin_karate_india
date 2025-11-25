"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dojoController_1 = require("../controllers/dojoController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.get('/', dojoController_1.getAllDojos);
router.get('/locations', dojoController_1.getDojoLocations);
router.get('/:id', dojoController_1.getDojo);
// Protected routes (Admin only)
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.restrictTo)('ADMIN'));
router.post('/', dojoController_1.createDojo);
router.patch('/:id', dojoController_1.updateDojo);
router.delete('/:id', dojoController_1.deleteDojo);
exports.default = router;
