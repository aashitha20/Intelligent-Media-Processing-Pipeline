import { Router } from 'express';
import { z } from 'zod';
import { getImageStatus } from '../services/imageService.js';

export const statusRouter = Router();

const idSchema = z.object({
  id: z.string().uuid(),
});

/**
 * @openapi
 * /status/{id}:
 *   get:
 *     summary: Get processing status for an uploaded image
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Current processing status
 *       404:
 *         description: Image not found
 */
statusRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = idSchema.parse(req.params);
    const status = await getImageStatus(id);
    res.json(status);
  } catch (err) {
    next(err);
  }
});
