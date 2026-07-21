import { Router } from 'express';
import { createImageAndEnqueue } from '../services/imageService.js';
import { assertValidImageFile, uploadMiddleware } from '../middleware/upload.js';
import { AppError } from '../middleware/errorHandler.js';

export const uploadRouter = Router();

/**
 * @openapi
 * /upload:
 *   post:
 *     summary: Upload a vehicle image for asynchronous analysis
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       202:
 *         description: Image accepted and queued for processing
 *       400:
 *         description: Invalid upload
 */
uploadRouter.post('/', uploadMiddleware.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'Image file is required (field name: image)');
    }

    const validated = await assertValidImageFile(req.file);

    const result = await createImageAndEnqueue({
      filename: req.file.originalname,
      filepath: validated.filepath,
      mimeType: validated.mimeType,
      sizeBytes: req.file.size,
    });

    res.status(202).json({
      id: result.id,
      status: result.status,
      message: 'Image accepted and queued for processing',
    });
  } catch (err) {
    next(err);
  }
});
