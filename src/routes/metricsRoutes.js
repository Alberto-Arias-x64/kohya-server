import { getSystemMetrics } from '../controllers/metricsController.js';
import { Router } from 'express';

const router = Router();

router.get('/metrics', getSystemMetrics);

export default router; 