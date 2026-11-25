import type {
  ApplicationStatus,
  CurrencyCode,
  ExperienceLevel,
  HiringWindow,
  JobAdvertisement,
  JobAlert,
  JobApplication,
  JobSector,
  PlatformStats,
  WorkMode,
} from '../types';

const CLIENT_ID_STORAGE_KEY = 'horizonjobs_workspace_client_id';

function getOrCreateClientId(): string {
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) {
      return existing;
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '')
        : `ws_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `ws_${Date.now()}_fallback`;
  }
}

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  employerToken?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('X-Client-Id', getOrCreateClientId());
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (employerToken) {
    headers.set('Authorization', `Bearer ${employerToken}`);
  }

  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export interface JobFormPayload {
  title: string;
  company: string;
  companyUrl: string;
  sector: JobSector;
  location: string;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  salaryMin: number;
  salaryMax: number;
  currency: CurrencyCode;
  hiringWindow: HiringWindow;
  launchDate: string;
  applicationDeadline: string;
  skills: string[];
  summary: string;
  responsibilities: string[];
  requirements: string[];
}

export interface EmployerAuthStatus {
  configured: boolean;
  usingEnvPasscode: boolean;
  authenticated: boolean;
}

export const api = {
  async listJobs(includeClosed = false, employerToken?: string | null) {
    const query = includeClosed ? '?includeClosed=true' : '';
    const data = await requestJson<{ jobs: JobAdvertisement[] }>(
      `/api/jobs${query}`,
      {},
      employerToken
    );
    return data.jobs;
  },

  async getStats() {
    const data = await requestJson<{ stats: PlatformStats }>('/api/stats');
    return data.stats;
  },

  async getSavedJobIds() {
    const data = await requestJson<{ savedJobIds: string[] }>('/api/saved');
    return data.savedJobIds;
  },

  async saveJob(jobId: string) {
    const data = await requestJson<{ savedJobIds: string[] }>('/api/saved', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    });
    return data.savedJobIds;
  },

  async unsaveJob(jobId: string) {
    const data = await requestJson<{ savedJobIds: string[] }>(
      `/api/saved/${encodeURIComponent(jobId)}`,
      { method: 'DELETE' }
    );
    return data.savedJobIds;
  },

  async listAlerts() {
    const data = await requestJson<{ alerts: JobAlert[] }>('/api/alerts');
    return data.alerts;
  },

  async createAlert(payload: {
    email: string;
    jobId?: string;
    sector?: JobSector | 'All Sectors';
    keyword?: string;
  }) {
    const data = await requestJson<{ alert: JobAlert }>('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.alert;
  },

  async deleteAlert(alertId: string) {
    await requestJson<{ ok: boolean }>(
      `/api/alerts/${encodeURIComponent(alertId)}`,
      { method: 'DELETE' }
    );
  },

  async submitApplication(payload: {
    jobId: string;
    fullName: string;
    email: string;
    portfolioUrl: string;
    yearsExperience: number;
    coverNote: string;
  }) {
    const data = await requestJson<{ application: JobApplication }>(
      '/api/applications',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return data.application;
  },

  async listMyApplications() {
    const data = await requestJson<{ applications: JobApplication[] }>(
      '/api/my-applications'
    );
    return data.applications;
  },

  // --- Employer Auth & Studio ---

  async getEmployerAuthStatus(employerToken?: string | null) {
    return requestJson<EmployerAuthStatus>(
      '/api/employer/auth-status',
      {},
      employerToken
    );
  },

  async setupEmployerPasscode(passcode: string) {
    const data = await requestJson<{ token: string }>('/api/employer/setup', {
      method: 'POST',
      body: JSON.stringify({ passcode }),
    });
    return data.token;
  },

  async loginEmployer(passcode: string) {
    const data = await requestJson<{ token: string }>('/api/employer/login', {
      method: 'POST',
      body: JSON.stringify({ passcode }),
    });
    return data.token;
  },

  async logoutEmployer(employerToken: string | null) {
    await requestJson<{ ok: boolean }>(
      '/api/employer/logout',
      { method: 'POST' },
      employerToken
    );
  },

  async createJob(payload: JobFormPayload, employerToken: string) {
    const data = await requestJson<{ job: JobAdvertisement }>(
      '/api/jobs',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      employerToken
    );
    return data.job;
  },

  async updateJob(
    jobId: string,
    payload: Partial<JobFormPayload>,
    employerToken: string
  ) {
    const data = await requestJson<{ job: JobAdvertisement }>(
      `/api/jobs/${encodeURIComponent(jobId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      employerToken
    );
    return data.job;
  },

  async deleteJob(jobId: string, employerToken: string) {
    await requestJson<{ ok: boolean }>(
      `/api/jobs/${encodeURIComponent(jobId)}`,
      { method: 'DELETE' },
      employerToken
    );
  },

  async listEmployerApplications(employerToken: string) {
    const data = await requestJson<{ applications: JobApplication[] }>(
      '/api/employer/applications',
      {},
      employerToken
    );
    return data.applications;
  },

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    employerToken: string
  ) {
    const data = await requestJson<{ application: JobApplication }>(
      `/api/employer/applications/${encodeURIComponent(applicationId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      employerToken
    );
    return data.application;
  },
};
