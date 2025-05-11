import { Logger } from '../utils/Logger.js';
import formidable from 'formidable';
import uuid from 'short-uuid'

const logger = Logger.getInstance();

export const uploadImages = (req, res) => {
  try {
    const form = formidable({});
    const id = uuid.generate();
    form.parse(req, (error, fields, files) => {
      if (error) {
        logger.error("Error uploading images", { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error uploading images' });
      }

      return res.json({ id });
    });
  } catch (error) {
    logger.error("Error uploading images", { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Error uploading images' });
  }
};

