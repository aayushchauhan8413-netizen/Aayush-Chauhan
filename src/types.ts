export type JobSector =
  | 'AI & Software Systems'
  | 'Autonomous Robotics'
  | 'Clean Energy & Grid'
  | 'Healthcare & Bio-Engineering'
  | 'Cybersecurity & Digital Trust'
  | 'Quantum Computing'
  | 'Spatial & XR Design'
  | 'Climate Finance & Policy'
  | 'Space & Smart Logistics'
  | 'AI Safety & Governance';

export const JOB_SECTORS: readonly JobSector[] = [
  'AI & Software Systems',
  'Autonomous Robotics',
  'Clean Energy & Grid',
  'Healthcare & Bio-Engineering',
  'Cybersecurity & Digital Trust',
  'Quantum Computing',
  'Spatial & XR Design',
  'Climate Finance & Policy',
  'Space & Smart Logistics',
  'AI Safety & Governance',
] as const;

export type WorkMode = 'Remote' | 'Hybrid' | 'On-site';
export const WORK_MODES: readonly WorkMode[] = ['Remote', 'Hybrid', 'On-site'] as const;

export type ExperienceLevel = 'Entry' | 'Mid-Level' | 'Senior' | 'Staff / Principal';
export const EXPERIENCE_LEVELS: readonly ExperienceLevel[] = [
  'Entry',
  'Mid-Level',
  'Senior',
  'Staff / Principal',
] as const;

export type HiringWindow = 'open_now' | 'upcoming' | 'closed';

export type ApplicationStatus =
  | 'New'
  | 'Reviewing'
  | 'Interviewing'
  | 'Shortlisted'
  | 'Declined';

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'New',
  'Reviewing',
  'Interviewing',
  'Shortlisted',
  'Declined',
] as const;

export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

export interface JobAdvertisement {
  id: string;
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
  launchDate: string; // YYYY-MM-DD
  applicationDeadline: string; // YYYY-MM-DD
  skills: string[];
  summary: string;
  responsibilities: string[];
  requirements: string[];
  postedAt: string; // ISO string
  applicantCount: number;
  alertCount: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  fullName: string;
  email: string;
  portfolioUrl: string;
  yearsExperience: number;
  coverNote: string;
  isEarlyInterest: boolean;
  status: ApplicationStatus;
  submittedAt: string;
}

export interface JobAlert {
  id: string;
  email: string;
  jobId?: string;
  jobTitle?: string;
  sector?: JobSector | 'All Sectors';
  keyword?: string;
  createdAt: string;
}

export interface PlatformStats {
  totalJobs: number;
  openNowCount: number;
  upcomingCount: number;
  launchingNext90Days: number;
  medianSalaryMax: number;
  totalApplications: number;
  activeAlerts: number;
  sectorCounts: Record<string, number>;
}

export interface JobFilterState {
  query: string;
  sector: JobSector | 'All';
  hiringWindow: 'all' | 'open_now' | 'upcoming';
  workMode: WorkMode | 'All';
  experienceLevel: ExperienceLevel | 'All';
  sortBy: 'launch_soonest' | 'salary_high' | 'newest' | 'most_interest';
}

export type ActiveTab =
  | 'explore'
  | 'calendar'
  | 'saved'
  | 'applications'
  | 'employer';
