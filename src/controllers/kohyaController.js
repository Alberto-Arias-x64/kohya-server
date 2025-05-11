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
    if (!await fs.access(path)) return res.status(400).json({ error: 'Path not found' });

    const config = await fs.readFile(join(paths.utilsPath, 'kohya.toml'), 'utf8');
    const datasetConfig = config.replaceAll('[ID]', id);
    await fs.writeFile(join(path, 'config.toml'), datasetConfig, 'utf8');

    const command = '/home/flux/kohya_ss/.venv/bin/accelerate';
    const args = [
      'launch',
      '--dynamo_backend', 'no',
      '--dynamo_mode', 'default',
      '--mixed_precision', 'bf16',
      '--num_processes', '1',
      '--num_machines', '1',
      '--num_cpu_threads_per_process', '2',
      '/home/flux/kohya_ss/sd-scripts/flux_train_network.py',
      '--config_file',
      join(path, 'config.toml')
    ];

    const kohya = spawn(command, args, { stdio: 'pipe' }); // consutar documentacion de spawn

    return res.json({ status: 'OK', id });
  } catch (error) {
    saveLog("Error training model", error);
    return res.status(500).json({ error: "Error training model" });
  }
};
