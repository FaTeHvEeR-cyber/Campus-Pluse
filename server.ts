import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { handlePlannerApiRequest } from './api/planner';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable('x-powered-by');
  app.use(express.json({ limit: '128kb' }));

  app.all('/api/planner', (req, res, next) => {
    void handlePlannerApiRequest(req, res).catch(next);
  });
  const requestErrorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : 500;
    res.status(status === 413 ? 413 : status === 400 ? 400 : 500).json({
      error: status === 413 ? 'Request body is too large' : status === 400 ? 'Invalid JSON body' : 'Unable to process request',
    });
  };
  app.use(requestErrorHandler);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'CampusPulse AI Execution Engine' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusPulse AI server listening on http://localhost:${PORT}`);
  });
}

void startServer().catch(() => {
  console.error('Unable to start CampusPulse server');
  process.exitCode = 1;
});
