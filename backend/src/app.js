import cors from 'cors';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import aiRoutes from './routes/aiRoutes.js';
import attachmentRoutes from './routes/attachmentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cmoRoutes from './routes/cmoRoutes.js';
import grievanceRoutes from './routes/grievanceRoutes.js';
import officerRoutes from './routes/officerRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", ...env.corsOrigins]
        }
      }
    })
  );
  app.use(
    cors((req, callback) => {
      const origin = req.header('Origin');
      const host = req.header('Host');
      const isSameOrigin =
        Boolean(origin && host) &&
        (origin === `https://${host}` || origin === `http://${host}`);

      if (
        !origin ||
        isSameOrigin ||
        env.corsOrigins.includes('*') ||
        env.corsOrigins.includes(origin)
      ) {
        return callback(null, { origin: true, credentials: true });
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // API Routes
  app.use('/api', publicRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/grievances', grievanceRoutes);
  app.use('/api/cmo', cmoRoutes);
  app.use('/api/officer', officerRoutes);
  app.use('/api/attachments', attachmentRoutes);

  // Optional single-service deployment support (serves built React frontend)
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (env.serveFrontend && fs.existsSync(path.join(frontendDist, 'index.html'))) {
    app.use(express.static(frontendDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
