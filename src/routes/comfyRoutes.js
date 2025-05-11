import { Router } from 'express';
import { status, generate, models } from '../controllers/comfyController.js';

const router = Router();

router.get('/comfy/status', status);
router.get('/comfy/models', models);
router.get('/comfy/generate', generate);

export default router;