"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventController_1 = require("../controllers/eventController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public (or semi-public)
router.get('/', eventController_1.getAllEvents);
router.get('/:id', eventController_1.getEvent);
// Protected
router.use(authMiddleware_1.protect);
router.post('/', (0, authMiddleware_1.restrictTo)('ADMIN', 'INSTRUCTOR'), eventController_1.createEvent);
router.patch('/:id', (0, authMiddleware_1.restrictTo)('ADMIN', 'INSTRUCTOR'), eventController_1.updateEvent);
router.delete('/:id', (0, authMiddleware_1.restrictTo)('ADMIN'), eventController_1.deleteEvent);
router.post('/:eventId/register', eventController_1.registerForEvent);
router.post('/registrations/:registrationId/approve', (0, authMiddleware_1.restrictTo)('ADMIN'), eventController_1.approveRegistration);
exports.default = router;
