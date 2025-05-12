import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const basePath = join(__dirname, '..');

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  rateLimit: {
    windowMs: 1 * 60 * 1000,
    max: 100
  },
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || 'http://localhost:3000'
};

export const paths = {
  basePath,
  comfyPath: join(basePath, '..', '..', 'ComfyUI'),
  kohyaPath: join(basePath, '..', '..', 'kohya_ss'),
  datasetsPath: join(basePath, '..', '..', 'datasets'),
  utilsPath: join(basePath, '..', 'utils'),
  logsPath: join(basePath, 'logs')
};