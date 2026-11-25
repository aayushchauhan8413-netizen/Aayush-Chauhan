import {
  APPLICATION_STATUSES,
  EXPERIENCE_LEVELS,
  JOB_SECTORS,
  WORK_MODES,
  type ApplicationStatus,
  type CurrencyCode,
  type ExperienceLevel,
  type HiringWindow,
  type JobSector,
  type WorkMode,
} from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCIES: readonly CurrencyCode[] = ['USD', 'EUR', 'GBP'];
const HIRING_WINDOWS: readonly HiringWindow[] = ['open_now', 'upcoming', 'closed'];

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function isValidEmail(email: unknown): email is string {
  return (
    typeof email === 'string' &&
    email.trim().length <= 160 &&
    EMAIL_REGEX.test(email.trim())
  );
}

export function isValidIsoDate(val: unknown): val is string {
  if (typeof val !== 'string' || !ISO_DATE_REGEX.test(val.trim())) return false;
  const parsed = Date.parse(`${val.trim()}T00:00:00.000Z`);
  return !Number.isNaN(parsed);
}

export function sanitizeOptionalHttpUrl(val: unknown): {
  valid: boolean;
  url: string;
} {
  if (val === undefined || val === null || val === '') {
    return { valid: true, url: '' };
  }
  if (typeof val !== 'string') {
    return { valid: false, url: '' };
  }
  const trimmed = val.trim();
  if (!trimmed) return { valid: true, url: '' };
  if (trimmed.length > 300) return { valid: false, url: '' };
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, url: '' };
    }
    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, url: '' };
  }
}

export interface CreateJobInput {
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

function cleanStringList(input: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(input)) return [];
  const cleaned: string[] = [];
  for (const item of input) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.length > 0) {
        cleaned.push(trimmed.slice(0, maxLen));
      }
    }
    if (cleaned.length >= maxItems) break;
  }
  return cleaned;
}

export function validateCreateJobPayload(
  body: unknown
): ValidationResult<CreateJobInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request payload.' };
  }
  const b = body as Record<string, unknown>;

  const title = typeof b.title === 'string' ? b.title.trim() : '';
  if (title.length < 3 || title.length > 120) {
    return { ok: false, error: 'Job title must be between 3 and 120 characters.' };
  }

  const company = typeof b.company === 'string' ? b.company.trim() : '';
  if (company.length < 2 || company.length > 90) {
    return { ok: false, error: 'Company name must be between 2 and 90 characters.' };
  }

  const companyUrlCheck = sanitizeOptionalHttpUrl(b.companyUrl);
  if (!companyUrlCheck.valid) {
    return {
      ok: false,
      error: 'Company URL must start with http:// or https://.',
    };
  }

  if (typeof b.sector !== 'string' || !JOB_SECTORS.includes(b.sector as JobSector)) {
    return { ok: false, error: 'Please select a valid future sector.' };
  }

  const location = typeof b.location === 'string' ? b.location.trim() : '';
  if (location.length < 2 || location.length > 100) {
    return { ok: false, error: 'Location must be between 2 and 100 characters.' };
  }

  if (typeof b.workMode !== 'string' || !WORK_MODES.includes(b.workMode as WorkMode)) {
    return { ok: false, error: 'Please select a valid work mode.' };
  }

  if (
    typeof b.experienceLevel !== 'string' ||
    !EXPERIENCE_LEVELS.includes(b.experienceLevel as ExperienceLevel)
  ) {
    return { ok: false, error: 'Please select a valid experience level.' };
  }

  const salaryMin = Number(b.salaryMin);
  const salaryMax = Number(b.salaryMax);
  if (
    !Number.isFinite(salaryMin) ||
    !Number.isFinite(salaryMax) ||
    salaryMin < 20000 ||
    salaryMax > 2000000 ||
    salaryMax < salaryMin
  ) {
    return {
      ok: false,
      error: 'Salary range must be valid numbers with maximum >= minimum.',
    };
  }

  const currency: CurrencyCode =
    typeof b.currency === 'string' && CURRENCIES.includes(b.currency as CurrencyCode)
      ? (b.currency as CurrencyCode)
      : 'USD';

  const hiringWindow: HiringWindow =
    typeof b.hiringWindow === 'string' &&
    HIRING_WINDOWS.includes(b.hiringWindow as HiringWindow)
      ? (b.hiringWindow as HiringWindow)
      : 'upcoming';

  if (!isValidIsoDate(b.launchDate)) {
    return { ok: false, error: 'Launch date must be a valid YYYY-MM-DD date.' };
  }
  if (!isValidIsoDate(b.applicationDeadline)) {
    return {
      ok: false,
      error: 'Application deadline must be a valid YYYY-MM-DD date.',
    };
  }
  if (b.applicationDeadline.trim() < b.launchDate.trim()) {
    return {
      ok: false,
      error: 'Application deadline must be on or after the launch date.',
    };
  }

  const summary = typeof b.summary === 'string' ? b.summary.trim() : '';
  if (summary.length < 20 || summary.length > 1200) {
    return {
      ok: false,
      error: 'Role summary must be between 20 and 1,200 characters.',
    };
  }

  const skills = cleanStringList(b.skills, 10, 40);
  if (skills.length === 0) {
    return { ok: false, error: 'Add at least one core skill.' };
  }

  const responsibilities = cleanStringList(b.responsibilities, 10, 240);
  const requirements = cleanStringList(b.requirements, 10, 240);

  return {
    ok: true,
    data: {
      title,
      company,
      companyUrl: companyUrlCheck.url,
      sector: b.sector as JobSector,
      location,
      workMode: b.workMode as WorkMode,
      experienceLevel: b.experienceLevel as ExperienceLevel,
      salaryMin: Math.round(salaryMin),
      salaryMax: Math.round(salaryMax),
      currency,
      hiringWindow,
      launchDate: b.launchDate.trim(),
      applicationDeadline: b.applicationDeadline.trim(),
      skills,
      summary,
      responsibilities:
        responsibilities.length > 0
          ? responsibilities
          : ['Lead core technical deliverables for the upcoming team launch.'],
      requirements:
        requirements.length > 0
          ? requirements
          : ['Demonstrated domain experience in the required skills listed above.'],
    },
  };
}

export interface CreateApplicationInput {
  jobId: string;
  fullName: string;
  email: string;
  portfolioUrl: string;
  yearsExperience: number;
  coverNote: string;
}

export function validateApplicationPayload(
  body: unknown
): ValidationResult<CreateApplicationInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid application payload.' };
  }
  const b = body as Record<string, unknown>;

  const jobId = typeof b.jobId === 'string' ? b.jobId.trim() : '';
  if (!jobId || jobId.length > 80) {
    return { ok: false, error: 'A valid job reference is required.' };
  }

  const fullName = typeof b.fullName === 'string' ? b.fullName.trim() : '';
  if (fullName.length < 2 || fullName.length > 100) {
    return { ok: false, error: 'Full name must be between 2 and 100 characters.' };
  }

  if (!isValidEmail(b.email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  const urlCheck = sanitizeOptionalHttpUrl(b.portfolioUrl);
  if (!urlCheck.valid) {
    return {
      ok: false,
      error: 'Portfolio or LinkedIn URL must start with http:// or https://.',
    };
  }

  const yearsExperience = Number(b.yearsExperience);
  if (!Number.isFinite(yearsExperience) || yearsExperience < 0 || yearsExperience > 60) {
    return {
      ok: false,
      error: 'Years of experience must be a number between 0 and 60.',
    };
  }

  const coverNote = typeof b.coverNote === 'string' ? b.coverNote.trim() : '';
  if (coverNote.length < 15 || coverNote.length > 2000) {
    return {
      ok: false,
      error: 'Please write a brief note (at least 15 characters) explaining your fit.',
    };
  }

  return {
    ok: true,
    data: {
      jobId,
      fullName,
      email: b.email.trim().toLowerCase(),
      portfolioUrl: urlCheck.url,
      yearsExperience: Math.round(yearsExperience),
      coverNote,
    },
  };
}

export interface CreateAlertInput {
  email: string;
  jobId?: string;
  sector?: JobSector | 'All Sectors';
  keyword?: string;
}

export function validateAlertPayload(body: unknown): ValidationResult<CreateAlertInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid alert payload.' };
  }
  const b = body as Record<string, unknown>;

  if (!isValidEmail(b.email)) {
    return { ok: false, error: 'Enter a valid email address for launch alerts.' };
  }

  const jobId =
    typeof b.jobId === 'string' && b.jobId.trim().length > 0
      ? b.jobId.trim().slice(0, 80)
      : undefined;

  const keyword =
    typeof b.keyword === 'string' && b.keyword.trim().length > 0
      ? b.keyword.trim().slice(0, 80)
      : undefined;

  let sector: JobSector | 'All Sectors' | undefined;
  if (b.sector === 'All Sectors') {
    sector = 'All Sectors';
  } else if (typeof b.sector === 'string' && JOB_SECTORS.includes(b.sector as JobSector)) {
    sector = b.sector as JobSector;
  }

  if (!jobId && !sector && !keyword) {
    return {
      ok: false,
      error: 'Select a specific job, sector, or keyword to monitor.',
    };
  }

  return {
    ok: true,
    data: {
      email: b.email.trim().toLowerCase(),
      jobId,
      sector,
      keyword,
    },
  };
}

export function isValidApplicationStatus(val: unknown): val is ApplicationStatus {
  return (
    typeof val === 'string' &&
    APPLICATION_STATUSES.includes(val as ApplicationStatus)
  );
}
