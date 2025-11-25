import express from 'express';
import { getAllEvents, getEvent, createEvent, registerForEvent, approveRegistration, updateEvent, deleteEvent } from '../controllers/eventController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public (or semi-public)
router.get('/', getAllEvents);
router.get('/:id', getEvent);

// Protected
router.use(protect);

router.post('/', restrictTo('ADMIN', 'INSTRUCTOR'), createEvent);
router.patch('/:id', restrictTo('ADMIN', 'INSTRUCTOR'), updateEvent);
router.delete('/:id', restrictTo('ADMIN'), deleteEvent);

router.post('/:eventId/register', registerForEvent);
router.post('/registrations/:registrationId/approve', restrictTo('ADMIN'), approveRegistration);

export default router;
