import { Logger } from '../utils/Logger.js';
import { paths } from '../config/config.js';
import formidable from 'formidable';
import uuid from 'short-uuid';
import fs from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

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

      files.photos.forEach(async (file, index) => {
        if (!(/\.(jpe?g|png|webp|bmp|tiff)$/i.test(file.originalFilename))) return;
        try {
          await sharp(file.filepath)
            .resize(1024, 1024, { fit: 'cover' })
            .png()
            .toFile(join(inputDir, `${index + 1}.png`));
          await fs.writeFile(join(inputDir, `${index + 1}.txt`), id, 'utf8');
          await fs.unlink(file.filepath);
          logger.info('Processed image', { id, index: index + 1 });
        } catch (err) {
          logger.error(`Error processing image`, { error: err.message, stack: err.stack , id });
        }
      });

      return res.json({ id });
    });
  } catch (error) {
    logger.error("Error uploading images", { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Error uploading images' });
  }
};
