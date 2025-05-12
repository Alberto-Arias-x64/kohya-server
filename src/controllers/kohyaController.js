import { KohyaQueue } from '../utils/KohyaQueue.js';
import { paths } from '../config/config.js';
import { Logger } from '../utils/Logger.js';
import fs from 'fs/promises';
import { join } from 'path';

const logger = Logger.getInstance();
const KQ = KohyaQueue.getInstance();

export const status = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendStatus = () => {
    const KQStatus = KQ.getStatus;
    res.write(`data: ${JSON.stringify(KQStatus)}\n\n`);
  };

  // Send initial status
  sendStatus();

  // Set up interval to send status updates
  const intervalId = setInterval(sendStatus, 3000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
  });
};

export const taskInfo = async (req, res) => {
  try {
    const { id } = req.body;
    const info = KQ.getTaskInfo(id);
    
    if (info) return res.json({ info });
    
    try {
      await fs.access(join(paths.datasetsPath, id));
      return res.json({ info: { status: 'COMPLETED', position: -1 } });
    } catch {
      return res.json({ info: { status: 'NOT_FOUND', position: -1 } });
    }
  } catch (error) {
    logger.error("Error getting task info", { error: error.message, stack: error.stack });
    return res.status(500).json({ error: "Error getting task info" });
  }
};

export const train = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID is required' });

    const path = join(paths.datasetsPath, id);
    try {
      await fs.access(path);
    } catch {
      return res.status(400).json({ error: 'Path not found' });
    }

    const config = await fs.readFile(join(paths.utilsPath, 'kohya.toml'), 'utf8');
    const datasetConfig = config.replaceAll('[ID]', id);
    await fs.writeFile(join(path, 'config.toml'), datasetConfig, 'utf8');

    KQ.setTask(id);
    await new Promise(resolve => setTimeout(resolve, 100));
    const { status, position } = KQ.getTaskInfo(id);

    return res.json({ id, position, status });
  } catch (error) {
    logger.error("Error training model", { error: error.message, stack: error.stack });
    return res.status(500).json({ error: "Error training model" });
  }
};
