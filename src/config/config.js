import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  port: process.env.PORT || 3000,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },
  maxFileSize: 10 * 1024 * 1024 // 10MB
};

export const paths = {
  basePath: join(__dirname, '..'),
  comfyPath: join(basePath, '..', 'ComfyUI'),
  kohyaPath: join(basePath, '..', 'kohya_ss'),
  datasetsPath: join(basePath, '..', 'datasets'),
  utilsPath: join(basePath, 'utils'),
  logsPath: join(basePath, 'logs')
};