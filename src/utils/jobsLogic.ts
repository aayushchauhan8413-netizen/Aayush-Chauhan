import type { CurrencyCode, JobAdvertisement, JobFilterState } from '../types';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatSalaryRange(
  min: number,
  max: number,
  currency: CurrencyCode = 'USD'
): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? '$';
  const formatK = (val: number) => {
    if (val >= 1000) {
      const k = val / 1000;
      return `${sym}${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return `${sym}${val.toLocaleString('en-US')}`;
  };
  return `${formatK(min)} – ${formatK(max)}`;
}

export function formatDateShort(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export interface LaunchCountdown {
  days: number;
  label: string;
  isPast: boolean;
}

export function daysUntilLaunch(
  launchDateIso: string,
  referenceDate: Date = new Date()
): LaunchCountdown {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(launchDateIso);
  if (!match) {
    return { days: 0, label: 'Scheduled', isPast: false };
  }
  const targetUtc = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  const refUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );
  const diffDays = Math.round((targetUtc - refUtc) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { days: diffDays, label: 'Applications open', isPast: true };
  }
  if (diffDays === 1) {
    return { days: 1, label: 'Opens tomorrow', isPast: false };
  }
  if (diffDays < 30) {
    return { days: diffDays, label: `Opens in ${diffDays} days`, isPast: false };
  }
  const months = Math.floor(diffDays / 30);
  const remDays = diffDays % 30;
  if (remDays === 0) {
    return {
      days: diffDays,
      label: `Opens in ${months} ${months === 1 ? 'month' : 'months'}`,
      isPast: false,
    };
  }
  return {
    days: diffDays,
    label: `Opens in ${diffDays} days`,
    isPast: false,
  };
}

export function formatQuarterLabel(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return 'Scheduled';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const quarter = Math.floor((month - 1) / 3) + 1;
  return `Q${quarter} ${year}`;
}

export function safeExternalUrl(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function filterAndSortJobs(
  jobs: readonly JobAdvertisement[],
  filters: JobFilterState
): JobAdvertisement[] {
  const query = filters.query.trim().toLowerCase();

  const filtered = jobs.filter((job) => {
    if (job.hiringWindow === 'closed') return false;

    if (filters.hiringWindow !== 'all' && job.hiringWindow !== filters.hiringWindow) {
      return false;
    }
    if (filters.sector !== 'All' && job.sector !== filters.sector) {
      return false;
    }
    if (filters.workMode !== 'All' && job.workMode !== filters.workMode) {
      return false;
    }
    if (
      filters.experienceLevel !== 'All' &&
      job.experienceLevel !== filters.experienceLevel
    ) {
      return false;
    }

    if (query) {
      const searchable = [
        job.title,
        job.company,
        job.sector,
        job.location,
        job.workMode,
        job.experienceLevel,
        job.summary,
        ...job.skills,
      ]
        .join(' ')
        .toLowerCase();
      const tokens = query.split(/\s+/).filter(Boolean);
      const matchesAll = tokens.every((tok) => searchable.includes(tok));
      if (!matchesAll) {
        return false;
      }
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'salary_high':
        return b.salaryMax - a.salaryMax || b.salaryMin - a.salaryMin;
      case 'newest':
        return Date.parse(b.postedAt) - Date.parse(a.postedAt);
      case 'most_interest':
        return (
          b.applicantCount +
          b.alertCount -
          (a.applicantCount + a.alertCount)
        );
      case 'launch_soonest':
      default: {
        // Put open_now sorted by soonest deadline, upcoming sorted by soonest launchDate
        if (a.hiringWindow !== b.hiringWindow) {
          return a.hiringWindow === 'upcoming' ? -1 : 1;
        }
        return a.launchDate.localeCompare(b.launchDate);
      }
    }
  });
}

export interface QuarterGroup {
  quarter: string;
  sortKey: string;
  jobs: JobAdvertisement[];
}

export function groupUpcomingJobsByQuarter(
  jobs: readonly JobAdvertisement[]
): QuarterGroup[] {
  const upcoming = jobs
    .filter((j) => j.hiringWindow === 'upcoming')
    .sort((a, b) => a.launchDate.localeCompare(b.launchDate));

  const map = new Map<string, QuarterGroup>();

  for (const job of upcoming) {
    const label = formatQuarterLabel(job.launchDate);
    const match = /^(\d{4})-(\d{2})/.exec(job.launchDate);
    const sortKey = match
      ? `${match[1]}-Q${Math.floor((Number(match[2]) - 1) / 3) + 1}`
      : '9999-Q4';

    const existing = map.get(label);
    if (existing) {
      existing.jobs.push(job);
    } else {
      map.set(label, { quarter: label, sortKey, jobs: [job] });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey)
  );
}
