import { KohyaQueue } from '../utils/KohyaQueue.js';
import { paths } from '../config/config.js';
import fs from 'fs/promises';
import { join } from 'path';

const KQ = KohyaQueue.getInstance();

export const status = (_req, res) => {
  res.json({ status: KQ.getStatus });
};

export const taskInfo = async (req, res) => {
  const { id } = req.body;
  const info = KQ.getTaskInfo(id);
  if (info) res.json({ info });
  if (!(await fs.access(join(paths.kohyaPath, id)))) res.json({ info: { status: 'NOT_FOUND', position: -1 } });
  res.json({ info: { status: 'COMPLETED', position: -1 } });
};

export const train = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID is required' });

    const path = join(paths.kohyaPath, id);
    if (!await fs.access(path)) return res.status(400).json({ error: 'Path not found' });

    const config = await fs.readFile(join(paths.utilsPath, 'kohya.toml'), 'utf8');
    const datasetConfig = config.replaceAll('[ID]', id);
    await fs.writeFile(join(path, 'config.toml'), datasetConfig, 'utf8');

    KQ.setTask(id);
    await new Promise(resolve => setTimeout(resolve, 100));
    const { status, position } = KQ.getTaskInfo(id);

    return res.json({ id, position, status });
  } catch (error) {
    saveLog("Error training model", error);
    return res.status(500).json({ error: "Error training model" });
  }
};
