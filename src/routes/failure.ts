import { Router } from 'express';
import { z } from 'zod';
import { getImageFailure } from '../services/imageService.js';

export const failureRouter = Router();

const idSchema = z.object({
  id: z.string().uuid(),
});

/**
 * @openapi
 * /failure/{id}:
 *   get:
 *     summary: Get failure details for a failed analysis
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
 *         description: Failure details
 *       404:
 *         description: Image not found
 *       409:
 *         description: Image has not failed
 */
failureRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = idSchema.parse(req.params);
    const failure = await getImageFailure(id);
    res.json(failure);
  } catch (err) {
    next(err);
  }
});
