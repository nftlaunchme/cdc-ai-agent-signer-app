// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
}

export default errorHandler;
