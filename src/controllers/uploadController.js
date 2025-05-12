import { Logger } from '../utils/Logger.js';
import { paths } from '../config/config.js';
import formidable from 'formidable';
import uuid from 'short-uuid';
import fs from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { spawn } from 'child_process';

const logger = Logger.getInstance();

export const uploadImages = (req, res) => {
  try {
    const form = formidable({ multiples: true });
    const id = uuid.generate();
    form.parse(req, async (error, _fields, files) => {
      if (error) {
        logger.error("Error uploading images", { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error uploading images' });
      }
      const inputDir = join(paths.datasetsPath, id, 'input', `1_${id}`);
      await fs.mkdir(inputDir, { recursive: true });
      await fs.mkdir(join(paths.datasetsPath, id, 'output'), { recursive: true });

      const processPromises = files.photos.map(async (file, index) => {
        if (!(/\.(jpe?g|png|webp|bmp|tiff)$/i.test(file.originalFilename))) {
          logger.warn('Invalid file type skipped', { filename: file.originalFilename });
          return;
        }

        try {
          await sharp(file.filepath)
            .resize(1024, 1024, { fit: 'cover' })
            .png()
            .toFile(join(inputDir, `${index + 1}.png`));
          logger.info('Processed image', { id, index: index + 1 });
        } catch (err) {
          logger.error(`Error processing image`, { error: err.message, stack: err.stack, id });
        }
      });

      await Promise.all(processPromises);

      const captionCommand = '/home/flux/kohya_ss/.venv/bin/python3';
      const captionArgs = [
        '/home/flux/kohya_ss/sd-scripts/finetune/make_captions.py',
        '--batch_size', '1',
        '--num_beams', '1',
        '--top_p', '0.9',
        '--max_length', '20',
        '--min_length', '5',
        '--beam_search',
        '--caption_extension', '.txt',
        inputDir,
        '--caption_weights', 'https://storage.googleapis.com/sfr-vision-language-research/BLIP/models/model_large_caption.pth'
      ];

      const captionProcess = spawn(captionCommand, captionArgs);

      captionProcess.on('error', (error) => {
        logger.error('Error generating captions:', { error: error.message, stack: error.stack });
      });

      captionProcess.on('close', async (code) => {
        logger.info(`Caption generation completed with code ${code}`);
        
        try {
          const files = await fs.readdir(inputDir);
          const txtFiles = files.filter(file => file.endsWith('.txt'));
          
          for (const txtFile of txtFiles) {
            const filePath = join(inputDir, txtFile);
            const content = await fs.readFile(filePath, 'utf-8');
            const newContent = `${id} ${content}`;
            await fs.writeFile(filePath, newContent, 'utf-8');
          }
        } catch (error) {
          logger.error('Error updating caption files:', { error: error.message, stack: error.stack });
        }
        
        return res.json({ id });
      });
    });
  } catch (error) {
    logger.error("Error uploading images", { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Error uploading images' });
  }
};
