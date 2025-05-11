import { exec } from 'child_process';
import uid from 'short-uuid';

export const status = (_req, res) => {
  return res.json({ status: 'OK' });
};

export const models = (_req, res) => {
  return res.json({ models: ['flux1-dev', 'flux1-dev-fp8', 'flux1-dev-fp16'] });
};

export const generate = (req, res) => {
  const body = req.body;
  if (!body.model || !body.prompt) return res.status(400).json({ error: 'Model and prompt are required' });
  const uuid = uid.generate();
  return res.json({ status: 'OK', id: uuid });
};
