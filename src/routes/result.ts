import { Router } from 'express';
import { z } from 'zod';
import { getImageResult } from '../services/imageService.js';

export const resultRouter = Router();

const idSchema = z.object({
  id: z.string().uuid(),
});

/**
 * @openapi
 * /result/{id}:
 *   get:
 *     summary: Get structured analysis results
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
 *         description: Analysis results
 *       404:
 *         description: Image not found
 *       409:
 *         description: Still processing
 *       422:
 *         description: Analysis failed
 */
resultRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = idSchema.parse(req.params);
    const result = await getImageResult(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
