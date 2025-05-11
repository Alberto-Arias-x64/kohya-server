import { paths } from '../config/config.js';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import { join } from 'path';

export const status = (_req, res) => {
  res.json({ status: 'OK' });
};

export const train = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const path = join(paths.kohyaPath, id);
    if (!await fs.access(path)) return res.status(400).json({ error: 'path not found' });

    const kohya = spawn('kohya', ['--model', body.model, '--prompt', body.prompt, '--output', `./output/${body.id}.png`]);
    res.json({ status: 'OK' });
  } catch (error) {
    saveLog("Error training model", error);
    res.status(500).json({ error: "Error training model" });
  }
};
