// src/server.ts

import express from 'express';
import aiRoutes from './routes/aiRoutes';
import errorHandler from './middleware/errorHandler';
import apiLimiter from './middleware/rateLimiter';

const app = express();

// ... other middlewares

// Apply rate limiter to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use(errorHandler);

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
