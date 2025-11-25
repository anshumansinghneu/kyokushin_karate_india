"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.get('/me', authController_1.getMe);
router.patch('/updateMe', userController_1.updateMe);
router.post('/invite', (0, authMiddleware_1.restrictTo)('ADMIN', 'INSTRUCTOR'), userController_1.inviteUser);
router.route('/')
    .get((0, authMiddleware_1.restrictTo)('ADMIN', 'INSTRUCTOR'), userController_1.getAllUsers)
    .post((0, authMiddleware_1.restrictTo)('ADMIN'), userController_1.createUser);
router.route('/:id')
    .get(userController_1.getUser)
    .patch((0, authMiddleware_1.restrictTo)('ADMIN'), userController_1.updateUser)
    .delete((0, authMiddleware_1.restrictTo)('ADMIN'), userController_1.deleteUser);
router.patch('/:id/approve', (0, authMiddleware_1.restrictTo)('ADMIN', 'INSTRUCTOR'), userController_1.approveUser);
router.patch('/:id/reject', (0, authMiddleware_1.restrictTo)('ADMIN', 'INSTRUCTOR'), userController_1.rejectUser);
exports.default = router;
