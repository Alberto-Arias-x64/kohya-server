import metricsRoutes from './metricsRoutes.js';
import comfyRoutes from './comfyRoutes.js';
import kohyaRoutes from './kohyaRoutes.js';
import homeRoutes from './homeRoutes.js';
import { Router } from 'express';

const router = Router();

router.use(homeRoutes);
router.use('/api', metricsRoutes);
router.use('/api', comfyRoutes);
router.use('/api', kohyaRoutes);

export default router;
