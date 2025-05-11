import { Router } from 'express';
import { status } from '../controllers/homeController.js';

const router = Router();

router.get('/status', status);

export default router;