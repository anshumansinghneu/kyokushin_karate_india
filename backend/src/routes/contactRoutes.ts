import { Router } from 'express';
import { submitContact } from '../controllers/contactController';
import { contactLimiter } from '../middleware/rateLimiters';

const router = Router();

// Public: the website contact form.
router.post('/', contactLimiter, submitContact);

export default router;
