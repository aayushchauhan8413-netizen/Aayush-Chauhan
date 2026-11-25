import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  ApplicationStatus,
  JobAdvertisement,
  JobAlert,
  JobApplication,
  PlatformStats,
} from '../types';
import { INITIAL_APPLICATIONS, INITIAL_JOBS, type StoredApplication } from './seedData';
import type { CreateAlertInput, CreateApplicationInput, CreateJobInput } from './validation';

interface StoredAlert extends JobAlert {
  clientId: string;
}

interface EmployerAuthRecord {
  salt: string;
  passwordHash: string;
  createdAt: string;
}

interface PersistedDatabase {
  jobs: JobAdvertisement[];
  applications: StoredApplication[];
  alerts: StoredAlert[];
  savedByClient: Record<string, string[]>;
  employerAuth: EmployerAuthRecord | null;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'horizonjobs-db.json');

// Verify DB file remains strictly within DATA_DIR
if (!DB_FILE.startsWith(DATA_DIR + path.sep)) {
  throw new Error('Database path configuration error.');
}

interface SessionRecord {
  token: string;
  createdAt: number;
  expiresAt: number;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

class HorizonStore {
  private db: PersistedDatabase;
  private sessions = new Map<string, SessionRecord>();

  constructor() {
    this.db = this.loadFromDisk();
  }

  private loadFromDisk(): PersistedDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw) as Partial<PersistedDatabase>;
        if (Array.isArray(parsed.jobs) && Array.isArray(parsed.applications)) {
          return {
            jobs: parsed.jobs,
            applications: parsed.applications,
            alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
            savedByClient:
              parsed.savedByClient && typeof parsed.savedByClient === 'object'
                ? parsed.savedByClient
                : {},
            employerAuth: parsed.employerAuth ?? null,
          };
        }
      }
    } catch {
      // Fall back to clean seed initialization if file is missing or malformed
    }

    const seeded: PersistedDatabase = {
      jobs: INITIAL_JOBS.map((j) => ({ ...j })),
      applications: INITIAL_APPLICATIONS.map((a) => ({ ...a })),
      alerts: [],
      savedByClient: {},
      employerAuth: null,
    };
    this.persist(seeded);
    return seeded;
  }

  private persist(target: PersistedDatabase = this.db): void {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpFile = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(target, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  // --- Employer Auth (scrypt + timingSafeEqual + in-memory Bearer tokens) ---

  private getEnvPasscode(): string {
    return (process.env.EMPLOYER_ADMIN_PASSCODE ?? '').trim();
  }

  public getEmployerAuthStatus(bearerToken: string | null): {
    configured: boolean;
    usingEnvPasscode: boolean;
    authenticated: boolean;
  } {
    const envPasscode = this.getEnvPasscode();
    const configured = envPasscode.length > 0 || this.db.employerAuth !== null;
    return {
      configured,
      usingEnvPasscode: envPasscode.length > 0,
      authenticated: this.verifySessionToken(bearerToken),
    };
  }

  public claimEmployerPasscode(passcode: string): {
    ok: boolean;
    token?: string;
    error?: string;
  } {
    if (this.getEnvPasscode().length > 0 || this.db.employerAuth !== null) {
      return {
        ok: false,
        error: 'Employer workspace passcode is already configured. Please unlock with your passcode.',
      };
    }
    const trimmed = passcode.trim();
    if (trimmed.length < 6 || trimmed.length > 100) {
      return {
        ok: false,
        error: 'Passcode must be between 6 and 100 characters.',
      };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(trimmed, salt, 64).toString('hex');
    this.db.employerAuth = {
      salt,
      passwordHash: derived,
      createdAt: new Date().toISOString(),
    };
    this.persist();
    const token = this.issueSessionToken();
    return { ok: true, token };
  }

  public loginEmployer(passcode: string): {
    ok: boolean;
    token?: string;
    error?: string;
  } {
    const trimmed = passcode.trim();
    if (!trimmed) {
      return { ok: false, error: 'Enter your employer passcode.' };
    }

    const envPasscode = this.getEnvPasscode();
    if (envPasscode.length > 0) {
      const a = crypto.createHash('sha256').update(trimmed).digest();
      const b = crypto.createHash('sha256').update(envPasscode).digest();
      if (!crypto.timingSafeEqual(a, b)) {
        return { ok: false, error: 'Incorrect employer passcode.' };
      }
      return { ok: true, token: this.issueSessionToken() };
    }

    if (!this.db.employerAuth) {
      return {
        ok: false,
        error: 'Employer passcode has not been set up yet.',
      };
    }

    const derived = crypto.scryptSync(trimmed, this.db.employerAuth.salt, 64);
    const stored = Buffer.from(this.db.employerAuth.passwordHash, 'hex');
    if (derived.length !== stored.length || !crypto.timingSafeEqual(derived, stored)) {
      return { ok: false, error: 'Incorrect employer passcode.' };
    }

    return { ok: true, token: this.issueSessionToken() };
  }

  private issueSessionToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    this.sessions.set(token, {
      token,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
    return token;
  }

  public verifySessionToken(token: string | null): boolean {
    if (!token) return false;
    const record = this.sessions.get(token);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      this.sessions.delete(token);
      return false;
    }
    return true;
  }

  public revokeSessionToken(token: string | null): void {
    if (token) {
      this.sessions.delete(token);
    }
  }

  // --- Jobs ---

  public listJobs(includeClosed = false): JobAdvertisement[] {
    const jobs = includeClosed
      ? this.db.jobs
      : this.db.jobs.filter((j) => j.hiringWindow !== 'closed');
    return jobs.map((j) => ({ ...j }));
  }

  public getJobById(id: string): JobAdvertisement | undefined {
    const found = this.db.jobs.find((j) => j.id === id);
    return found ? { ...found } : undefined;
  }

  public createJob(input: CreateJobInput): JobAdvertisement {
    const job: JobAdvertisement = {
      id: `job-${crypto.randomUUID().slice(0, 8)}`,
      ...input,
      postedAt: new Date().toISOString(),
      applicantCount: 0,
      alertCount: 0,
    };
    this.db.jobs.unshift(job);
    this.persist();
    return { ...job };
  }

  public updateJob(
    id: string,
    patch: Partial<CreateJobInput>
  ): JobAdvertisement | null {
    const index = this.db.jobs.findIndex((j) => j.id === id);
    if (index === -1) return null;
    const updated: JobAdvertisement = {
      ...this.db.jobs[index],
      ...patch,
    };
    this.db.jobs[index] = updated;
    this.persist();
    return { ...updated };
  }

  public deleteJob(id: string): boolean {
    const prevLen = this.db.jobs.length;
    this.db.jobs = this.db.jobs.filter((j) => j.id !== id);
    if (this.db.jobs.length === prevLen) return false;
    // Remove deleted job from saved lists
    for (const clientId of Object.keys(this.db.savedByClient)) {
      this.db.savedByClient[clientId] = this.db.savedByClient[clientId].filter(
        (savedId) => savedId !== id
      );
    }
    this.persist();
    return true;
  }

  // --- Applications ---

  public createApplication(
    input: CreateApplicationInput,
    clientId: string
  ): { ok: boolean; application?: JobApplication; error?: string } {
    const job = this.db.jobs.find((j) => j.id === input.jobId);
    if (!job) {
      return { ok: false, error: 'Selected job advertisement was not found.' };
    }
    if (job.hiringWindow === 'closed') {
      return { ok: false, error: 'This job advertisement is no longer accepting submissions.' };
    }

    const duplicate = this.db.applications.find(
      (a) => a.jobId === input.jobId && a.email === input.email
    );
    if (duplicate) {
      return {
        ok: false,
        error: 'An application with this email has already been submitted for this role.',
      };
    }

    const stored: StoredApplication = {
      id: `app-${crypto.randomUUID().slice(0, 8)}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      fullName: input.fullName,
      email: input.email,
      portfolioUrl: input.portfolioUrl,
      yearsExperience: input.yearsExperience,
      coverNote: input.coverNote,
      isEarlyInterest: job.hiringWindow === 'upcoming',
      status: 'New',
      submittedAt: new Date().toISOString(),
      clientId,
    };

    this.db.applications.unshift(stored);
    job.applicantCount += 1;
    this.persist();

    const { clientId: _omit, ...publicApp } = stored;
    return { ok: true, application: publicApp };
  }

  public listApplicationsForClient(clientId: string): JobApplication[] {
    if (!clientId) return [];
    return this.db.applications
      .filter((a) => a.clientId === clientId)
      .map(({ clientId: _omit, ...rest }) => rest);
  }

  public listAllApplicationsForEmployer(): JobApplication[] {
    return this.db.applications.map(({ clientId: _omit, ...rest }) => rest);
  }

  public updateApplicationStatus(
    id: string,
    status: ApplicationStatus
  ): JobApplication | null {
    const found = this.db.applications.find((a) => a.id === id);
    if (!found) return null;
    found.status = status;
    this.persist();
    const { clientId: _omit, ...rest } = found;
    return rest;
  }

  // --- Saved Jobs ---

  public getSavedJobIds(clientId: string): string[] {
    if (!clientId) return [];
    const ids = this.db.savedByClient[clientId] ?? [];
    const existing = new Set(this.db.jobs.map((j) => j.id));
    return ids.filter((id) => existing.has(id));
  }

  public saveJob(clientId: string, jobId: string): string[] {
    if (!this.db.jobs.some((j) => j.id === jobId)) {
      return this.getSavedJobIds(clientId);
    }
    const list = this.db.savedByClient[clientId] ?? [];
    if (!list.includes(jobId)) {
      this.db.savedByClient[clientId] = [jobId, ...list];
      this.persist();
    }
    return this.getSavedJobIds(clientId);
  }

  public unsaveJob(clientId: string, jobId: string): string[] {
    const list = this.db.savedByClient[clientId] ?? [];
    const next = list.filter((id) => id !== jobId);
    this.db.savedByClient[clientId] = next;
    this.persist();
    return this.getSavedJobIds(clientId);
  }

  // --- Future Launch Alerts ---

  public listAlertsForClient(clientId: string): JobAlert[] {
    if (!clientId) return [];
    return this.db.alerts
      .filter((a) => a.clientId === clientId)
      .map(({ clientId: _omit, ...rest }) => rest);
  }

  public createAlert(
    input: CreateAlertInput,
    clientId: string
  ): { ok: boolean; alert?: JobAlert; error?: string } {
    let jobTitle: string | undefined;
    if (input.jobId) {
      const job = this.db.jobs.find((j) => j.id === input.jobId);
      if (!job) {
        return { ok: false, error: 'Target job advertisement was not found.' };
      }
      jobTitle = job.title;
      const exists = this.db.alerts.find(
        (a) => a.clientId === clientId && a.jobId === input.jobId && a.email === input.email
      );
      if (exists) {
        return {
          ok: false,
          error: 'You already have a launch alert active for this role.',
        };
      }
      job.alertCount += 1;
    }

    const stored: StoredAlert = {
      id: `alt-${crypto.randomUUID().slice(0, 8)}`,
      email: input.email,
      jobId: input.jobId,
      jobTitle,
      sector: input.sector,
      keyword: input.keyword,
      createdAt: new Date().toISOString(),
      clientId,
    };

    this.db.alerts.unshift(stored);
    this.persist();
    const { clientId: _omit, ...publicAlert } = stored;
    return { ok: true, alert: publicAlert };
  }

  public deleteAlert(clientId: string, alertId: string): boolean {
    const target = this.db.alerts.find(
      (a) => a.id === alertId && a.clientId === clientId
    );
    if (!target) return false;
    if (target.jobId) {
      const job = this.db.jobs.find((j) => j.id === target.jobId);
      if (job && job.alertCount > 0) {
        job.alertCount -= 1;
      }
    }
    this.db.alerts = this.db.alerts.filter((a) => a.id !== alertId);
    this.persist();
    return true;
  }

  // --- Platform Stats ---

  public getStats(): PlatformStats {
    const activeJobs = this.db.jobs.filter((j) => j.hiringWindow !== 'closed');
    const openNowCount = activeJobs.filter((j) => j.hiringWindow === 'open_now').length;
    const upcomingJobs = activeJobs.filter((j) => j.hiringWindow === 'upcoming');

    const nowMs = Date.now();
    const ninetyDaysMs = nowMs + 90 * 24 * 60 * 60 * 1000;
    const launchingNext90Days = upcomingJobs.filter((j) => {
      const ts = Date.parse(`${j.launchDate}T00:00:00.000Z`);
      return !Number.isNaN(ts) && ts >= nowMs && ts <= ninetyDaysMs;
    }).length;

    const salaries = activeJobs.map((j) => j.salaryMax).sort((a, b) => a - b);
    const medianSalaryMax =
      salaries.length === 0
        ? 0
        : salaries[Math.floor(salaries.length / 2)];

    const sectorCounts: Record<string, number> = {};
    let totalAlertsFromJobs = 0;
    for (const j of activeJobs) {
      sectorCounts[j.sector] = (sectorCounts[j.sector] ?? 0) + 1;
      totalAlertsFromJobs += j.alertCount;
    }

    return {
      totalJobs: activeJobs.length,
      openNowCount,
      upcomingCount: upcomingJobs.length,
      launchingNext90Days,
      medianSalaryMax,
      totalApplications: this.db.applications.length,
      activeAlerts: totalAlertsFromJobs,
      sectorCounts,
    };
  }
}

export const store = new HorizonStore();
