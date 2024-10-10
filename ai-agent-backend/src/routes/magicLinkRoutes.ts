// src/routes/magicLinkRoutes.ts

import express, { Request, Response } from 'express';
import crypto from 'crypto';

const router = express.Router();

// In-memory store for Magic Links (use a database in production)
const magicLinks: { [token: string]: { action: string; userId: string; createdAt: number } } = {};

/**
 * @route POST /api/magic-link/generate
 * @desc Generate a Magic Link for a specific action and user
 * @body { action: string, userId: string }
 */
router.post('/generate', (req: Request, res: Response) => {
  const { action, userId } = req.body;

  if (!action || !userId) {
    return res.status(400).json({ error: 'Action and userId are required.' });
  }

  const token = crypto.randomBytes(20).toString('hex');
  magicLinks[token] = { action, userId, createdAt: Date.now() };

  const magicLink = `http://localhost:5000/api/magic-link/execute/${token}`;
  res.json({ magicLink });
});

/**
 * @route GET /api/magic-link/execute/:token
 * @desc Execute the action associated with the Magic Link
 */
router.get('/execute/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const linkData = magicLinks[token];

  if (!linkData) {
    return res.status(400).send('Invalid or expired Magic Link.');
  }

  // Implement action execution logic here
  // For example, redirect to frontend with action details
  res.redirect(`http://localhost:3000/execute-action?token=${token}`);
});

export default router;
