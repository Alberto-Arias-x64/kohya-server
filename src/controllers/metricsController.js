import { config } from '../config/config.js';
import { Logger } from '../utils/Logger.js';
import si from 'systeminformation';

const logger = Logger.getInstance();

export const getSystemMetrics = async (req, res) => {
  const allowedOrigins = config.allowedOrigins;
  const origin = req.headers.origin;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);

  let isClientConnected = true;
  let interval;

  const sendMetrics = async () => {
    if (!isClientConnected) return;

    try {
      const [cpu, mem, gpu, gpuLoad] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.graphics(),
        si.graphics().then(async (gpuInfo) => {
          const loads = [];
          for (const gpu of gpuInfo.controllers) {
            try {
              const load = await si.graphicsLoad(gpu.id);
              loads.push(load);
            } catch (error) {
              loads.push({ load: 'N/A' });
            }
          }
          return loads;
        })
      ]);

      const metrics = {
        cpu: {
          usage: cpu.currentLoad.toFixed(2),
          cores: cpu.cpus.map(core => core.load.toFixed(2))
        },
        memory: {
          total: (mem.total / (1024 * 1024 * 1024)).toFixed(2),
          used: (mem.used / (1024 * 1024 * 1024)).toFixed(2),
          free: (mem.free / (1024 * 1024 * 1024)).toFixed(2),
          usage: ((mem.used / mem.total) * 100).toFixed(2)
        },
        gpu: gpu.controllers.map((gpu, index) => ({
          model: gpu.model,
          vram: gpu.vram ? (gpu.vram / 1024).toFixed(2) : 'N/A',
          temperature: gpu.temperatureGpu || 'N/A',
          load: gpuLoad[index]?.load || 'N/A',
          memoryUsed: gpuLoad[index]?.memoryUsed || 'N/A',
          memoryTotal: gpuLoad[index]?.memoryTotal || 'N/A',
          powerDraw: gpuLoad[index]?.powerDraw || 'N/A',
          fanSpeed: gpuLoad[index]?.fanSpeed || 'N/A'
        }))
      };

      res.write(`data: ${JSON.stringify(metrics)}\n\n`);
    } catch (error) {
      logger.error('Error fetching metrics', { message: error.message, stack: error.stack });
      res.write(`data: ${JSON.stringify({ error: 'Error fetching metrics' })}\n\n`);
    }
  };

  // Send initial metrics
  await sendMetrics();

  // Set up interval for continuous updates
  interval = setInterval(sendMetrics, 2000);

  // Handle client disconnect
  req.on('close', () => {
    isClientConnected = false;
    clearInterval(interval);
  });

  // Handle client errors
  req.on('error', (error) => {
    isClientConnected = false;
    clearInterval(interval);
  });
}; 