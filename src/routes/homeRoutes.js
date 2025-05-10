import { Router } from 'express';
import { welcome, status } from '../controllers/homeController.js';

const router = Router();

router.get('/api/status', status);

export default router; 