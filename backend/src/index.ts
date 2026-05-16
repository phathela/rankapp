import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { handleWebhook } from './services/stripe';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Trust proxy for Railway
app.set('trust proxy', 1);

// Stripe webhook needs raw body — handle before global JSON parser
app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      if (!sig) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
      }

      const { constructWebhookEvent } = await import('./services/stripe');
      const event = constructWebhookEvent(req.body, sig);
      await handleWebhook(event);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: `Webhook error: ${error.message}` });
    }
  }
);

// Global middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Vote-specific rate limiting (max 10 per minute per IP)
const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many vote requests. Max 10 per minute.' },
});
app.use('/api/rankings/:id/vote', voteLimiter);

// Mount all routes
app.use('/api', routes);

// Serve static frontend in production
const publicPath = path.resolve(__dirname, '../../public');
app.use(express.static(publicPath));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback: serve index.html for non-API routes (production)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  const indexPath = path.resolve(publicPath, 'index.html');
  try {
    if (require('fs').existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  } catch {
    next();
  }
});

// 404 handler for API routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`RankApp backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
