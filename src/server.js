import { securityMiddleware } from './middleware/security.js';
import { requestLogger } from './middleware/log.js';
import { config, paths } from './config/config.js';
import routes from './routes/indexRoute.js';
import { Logger } from './utils/Logger.js';
import express from 'express';
import { join } from 'path';

const logger = Logger.getInstance();
const app = express();

app.use(securityMiddleware);
app.use(express.json({ limit: config.maxFileSize, extended: true }));
app.use(express.static(join(paths.basePath, 'public')));
app.use(requestLogger, routes);

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
  logger.info(`Server started on port ${config.port}`);
});
 