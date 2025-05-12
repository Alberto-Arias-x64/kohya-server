import { config } from '../config/config.js';
import { Logger } from '../utils/Logger.js';
import { exec } from 'child_process';
import si from 'systeminformation';
import { promisify } from 'util';

const execAsync = promisify(exec);
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

  const getNvidiaInfo = async () => {
    try {
      const query = [
        'utilization.gpu',
        'memory.total',
        'memory.used',
        'memory.free',
        'temperature.gpu',
        'power.draw',
        'fan.speed'
      ].join(',');

      const { stdout } = await execAsync(`nvidia-smi --query-gpu=${query} --format=csv,noheader,nounits`);

      const gpus = stdout.trim().split('\n').map(line => {
        const [
          gpu_util,
          memory_total,
          memory_used,
          memory_free,
          temperature,
          power_draw,
          fan_speed
        ] = line.split(',').map(v => v.trim());

        return {
          gpu_util: Number(gpu_util),
          memory_total: Number(memory_total),
          memory_used: Number(memory_used),
          memory_free: Number(memory_free),
          temperature: Number(temperature),
          power_draw: Number(power_draw),
          fan_speed: Number(fan_speed),
          processes: [] // opcional, puedes mejorar esto con nvidia-smi pmon
        };
      });

      return { gpus };
    } catch (error) {
      logger.error('Error fetching NVIDIA info', { message: error.message });
      return null;
    }
  };

  const sendMetrics = async () => {
    if (!isClientConnected) return;

    try {
      const [cpu, mem, gpu, gpuLoad, nvidiaInfo] = await Promise.all([
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
        }),
        getNvidiaInfo()
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
        gpu: gpu.controllers.map((gpu, index) => {
          const nvidiaGpu = nvidiaInfo?.gpus?.[index] || {};
          return {
            model: gpu.model,
            vram: gpu.vram ? (gpu.vram / 1024).toFixed(2) : 'N/A',
            temperature: nvidiaGpu.temperature || gpu.temperatureGpu || 'N/A',
            load: nvidiaGpu.gpu_util ?? gpuLoad[index]?.load ?? 'N/A',
            memoryUsed: nvidiaGpu.memory_used ?? 'N/A',
            memoryTotal: nvidiaGpu.memory_total ?? 'N/A',
            powerDraw: nvidiaGpu.power_draw ?? 'N/A',
            fanSpeed: nvidiaGpu.fan_speed ?? 'N/A',
            processes: nvidiaGpu.processes || []
          };
        })
      };

      res.write(`data: ${JSON.stringify(metrics)}\n\n`);
    } catch (error) {
      logger.error('Error fetching metrics', { message: error.message, stack: error.stack });
      res.write(`data: ${JSON.stringify({ error: 'Error fetching metrics' })}\n\n`);
    }
  };

  await sendMetrics();
  interval = setInterval(sendMetrics, 2000);

  req.on('close', () => {
    isClientConnected = false;
    clearInterval(interval);
  });

  req.on('error', (error) => {
    isClientConnected = false;
    clearInterval(interval);
  });
};