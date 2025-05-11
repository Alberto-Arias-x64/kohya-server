import { status, train } from '../controllers/kohyaController.js';
import { Router } from 'express';

const router = Router();

router.get('/kohya/status', status);
router.post('/kohya/train', train);

export default router;