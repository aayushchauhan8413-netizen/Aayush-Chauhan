import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { store } from './src/server/store';
import { filterAndSortJobs } from './src/utils/jobsLogic';
import type { JobFilterState } from './src/types';
import {
  isValidApplicationStatus,
  validateAlertPayload,
  validateApplicationPayload,
  validateCreateJobPayload,
} from './src/server/validation';

const PORT = 3000;

function extractBearerToken(req: Request): string | null {
  const header = req.header('authorization');
  if (!header) return null;
  const match = /^Bearer\s+([A-Za-z0-9._-]+)$/.exec(header.trim());
  return match ? match[1] : null;
}

function extractClientId(req: Request): string {
  const raw = req.header('x-client-id') ?? '';
  const cleaned = raw.trim();
  if (/^[A-Za-z0-9_-]{8,64}$/.test(cleaned)) {
    return cleaned;
  }
  return '';
}

function requireEmployerAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!store.verifySessionToken(token)) {
    res.status(401).json({ error: 'Employer authentication required.' });
    return;
  }
  next();
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '100kb' }));

  // Baseline security headers (avoid X-Frame-Options because AI Studio previews inside an iframe)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // --- Public Read APIs ---

  app.get('/api/jobs', (req, res) => {
    const includeClosed =
      req.query.includeClosed === 'true' &&
      store.verifySessionToken(extractBearerToken(req));
    const allJobs = store.listJobs(includeClosed);

    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const hasFilterQuery =
      q.trim().length > 0 ||
      typeof req.query.sector === 'string' ||
      typeof req.query.hiringWindow === 'string' ||
      typeof req.query.workMode === 'string' ||
      typeof req.query.experienceLevel === 'string';

    if (!includeClosed && hasFilterQuery) {
      const filters: JobFilterState = {
        query: q,
        sector: (typeof req.query.sector === 'string' ? req.query.sector : 'All') as JobFilterState['sector'],
        hiringWindow: (typeof req.query.hiringWindow === 'string' ? req.query.hiringWindow : 'all') as JobFilterState['hiringWindow'],
        workMode: (typeof req.query.workMode === 'string' ? req.query.workMode : 'All') as JobFilterState['workMode'],
        experienceLevel: (typeof req.query.experienceLevel === 'string' ? req.query.experienceLevel : 'All') as JobFilterState['experienceLevel'],
        sortBy: (typeof req.query.sortBy === 'string' ? req.query.sortBy : 'launch_soonest') as JobFilterState['sortBy'],
      };
      res.json({ jobs: filterAndSortJobs(allJobs, filters), total: allJobs.length });
      return;
    }

    res.json({ jobs: allJobs, total: allJobs.length });
  });

  app.get('/api/jobs/:id', (req, res) => {
    const job = store.getJobById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job advertisement not found.' });
      return;
    }
    res.json({ job });
  });

  app.get('/api/stats', (_req, res) => {
    res.json({ stats: store.getStats() });
  });

  // --- Candidate Workspace APIs (Scoped by anonymous X-Client-Id) ---

  app.post('/api/applications', (req, res) => {
    const clientId = extractClientId(req);
    if (!clientId) {
      res.status(400).json({ error: 'Missing valid client workspace header.' });
      return;
    }
    const check = validateApplicationPayload(req.body);
    if (!check.ok || !check.data) {
      res.status(400).json({ error: check.error });
      return;
    }
    const result = store.createApplication(check.data, clientId);
    if (!result.ok || !result.application) {
      res.status(409).json({ error: result.error });
      return;
    }
    res.status(201).json({ application: result.application });
  });

  app.get('/api/my-applications', (req, res) => {
    const clientId = extractClientId(req);
    if (!clientId) {
      res.json({ applications: [] });
      return;
    }
    res.json({ applications: store.listApplicationsForClient(clientId) });
  });

  app.get('/api/saved', (req, res) => {
    const clientId = extractClientId(req);
    res.json({ savedJobIds: store.getSavedJobIds(clientId) });
  });

  app.post('/api/saved', (req, res) => {
    const clientId = extractClientId(req);
    const jobId = typeof req.body?.jobId === 'string' ? req.body.jobId.trim() : '';
    if (!clientId || !jobId) {
      res.status(400).json({ error: 'Valid client workspace and jobId are required.' });
      return;
    }
    res.json({ savedJobIds: store.saveJob(clientId, jobId) });
  });

  app.delete('/api/saved/:jobId', (req, res) => {
    const clientId = extractClientId(req);
    if (!clientId) {
      res.status(400).json({ error: 'Missing valid client workspace header.' });
      return;
    }
    res.json({ savedJobIds: store.unsaveJob(clientId, req.params.jobId) });
  });

  app.get('/api/alerts', (req, res) => {
    const clientId = extractClientId(req);
    res.json({ alerts: store.listAlertsForClient(clientId) });
  });

  app.post('/api/alerts', (req, res) => {
    const clientId = extractClientId(req);
    if (!clientId) {
      res.status(400).json({ error: 'Missing valid client workspace header.' });
      return;
    }
    const check = validateAlertPayload(req.body);
    if (!check.ok || !check.data) {
      res.status(400).json({ error: check.error });
      return;
    }
    const result = store.createAlert(check.data, clientId);
    if (!result.ok || !result.alert) {
      res.status(409).json({ error: result.error });
      return;
    }
    res.status(201).json({ alert: result.alert });
  });

  app.delete('/api/alerts/:id', (req, res) => {
    const clientId = extractClientId(req);
    if (!clientId) {
      res.status(400).json({ error: 'Missing valid client workspace header.' });
      return;
    }
    const removed = store.deleteAlert(clientId, req.params.id);
    if (!removed) {
      res.status(404).json({ error: 'Alert not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // --- Employer Auth & Protected Studio APIs ---

  app.get('/api/employer/auth-status', (req, res) => {
    res.json(store.getEmployerAuthStatus(extractBearerToken(req)));
  });

  app.post('/api/employer/setup', (req, res) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    const result = store.claimEmployerPasscode(passcode);
    if (!result.ok || !result.token) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ token: result.token });
  });

  app.post('/api/employer/login', (req, res) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    const result = store.loginEmployer(passcode);
    if (!result.ok || !result.token) {
      res.status(401).json({ error: result.error });
      return;
    }
    res.json({ token: result.token });
  });

  app.post('/api/employer/logout', (req, res) => {
    store.revokeSessionToken(extractBearerToken(req));
    res.json({ ok: true });
  });

  app.post('/api/jobs', requireEmployerAuth, (req, res) => {
    const check = validateCreateJobPayload(req.body);
    if (!check.ok || !check.data) {
      res.status(400).json({ error: check.error });
      return;
    }
    const job = store.createJob(check.data);
    res.status(201).json({ job });
  });

  app.patch('/api/jobs/:id', requireEmployerAuth, (req, res) => {
    const existing = store.getJobById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Job advertisement not found.' });
      return;
    }
    const merged = { ...existing, ...(req.body && typeof req.body === 'object' ? req.body : {}) };
    const check = validateCreateJobPayload(merged);
    if (!check.ok || !check.data) {
      res.status(400).json({ error: check.error });
      return;
    }
    const updated = store.updateJob(req.params.id, check.data);
    res.json({ job: updated });
  });

  app.delete('/api/jobs/:id', requireEmployerAuth, (req, res) => {
    const deleted = store.deleteJob(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Job advertisement not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.get('/api/employer/applications', requireEmployerAuth, (_req, res) => {
    res.json({ applications: store.listAllApplicationsForEmployer() });
  });

  app.patch('/api/employer/applications/:id', requireEmployerAuth, (req, res) => {
    const status = req.body?.status;
    if (!isValidApplicationStatus(status)) {
      res.status(400).json({ error: 'Invalid application status.' });
      return;
    }
    const updated = store.updateApplicationStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }
    res.json({ application: updated });
  });

  // Reject unknown /api routes cleanly as JSON
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // --- Frontend Serving (Vite dev middleware in dev, dist/ in prod) ---
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HorizonJobs server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start HorizonJobs server:', err);
  process.exit(1);
});
