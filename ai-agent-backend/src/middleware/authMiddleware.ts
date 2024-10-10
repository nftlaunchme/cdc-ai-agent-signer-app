// src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';

const validApiKeys = ['your_predefined_api_key_here']; // Replace with your method of storing keys

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
};

export default authenticate;
