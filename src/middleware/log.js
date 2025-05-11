import { Logger } from '../utils/Logger.js';
import uuid from 'short-uuid'

const logger = Logger.getInstance();

export const requestLogger = async (req, res, next) => {
  if (req.url.includes('/api/kohya/taskInfo')) return next();
  const startTime = Date.now();
  const requestId = uuid.generate();

  // Log request start
  await logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    headers: req.headers
  });

  // Capture response data
  const originalJson = res.json;

  res.json = function (body) {
    res.json = originalJson;
    const responseTime = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      requestId,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      responseSize: JSON.stringify(body)?.length || 0,
      responseType: 'json',
      responseBody: body
    });

    return originalJson.call(this, body);
  };

  // Log errors
  res.on('error', async (error) => {
    await logger.error('Request error', {
      requestId,
      error: error.message,
      stack: error.stack
    });
  });

  next();
};
