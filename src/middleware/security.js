import { config } from '../config/config.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = [
  helmet(),
  cors(),
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: 'Too many requests from this IP, please try again later'
  })
]; 