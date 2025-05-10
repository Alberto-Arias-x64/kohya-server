import { securityMiddleware } from './middleware/security.js';
import homeRoutes from './routes/homeRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';
import { config } from './config/config.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));
app.use(securityMiddleware);
app.use(homeRoutes);
app.use(metricsRoutes);

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});
