import test from 'node:test';
import assert from 'node:assert/strict';
import type { JobAdvertisement, JobFilterState } from '../types';
import {
  daysUntilLaunch,
  filterAndSortJobs,
  formatQuarterLabel,
  formatSalaryRange,
  groupUpcomingJobsByQuarter,
  safeExternalUrl,
} from './jobsLogic';

const sampleJobs: JobAdvertisement[] = [
  {
    id: 'job-1',
    title: 'Solid-State Battery Process Architect',
    company: 'Helios Grid Labs',
    companyUrl: 'https://heliosgrid.example.com',
    sector: 'Clean Energy & Grid',
    location: 'Zurich, Switzerland',
    workMode: 'Hybrid',
    experienceLevel: 'Senior',
    salaryMin: 165000,
    salaryMax: 210000,
    currency: 'USD',
    hiringWindow: 'upcoming',
    launchDate: '2027-02-15',
    applicationDeadline: '2027-04-30',
    skills: ['Electrochemistry', 'Process Scaling', 'Thermal Modeling'],
    summary: 'Lead pilot production lines for solid-state cells.',
    responsibilities: ['Design pilot line'],
    requirements: ['7+ years in battery manufacturing'],
    postedAt: '2026-11-20T10:00:00.000Z',
    applicantCount: 14,
    alertCount: 38,
  },
  {
    id: 'job-2',
    title: 'Quantum Error Correction Scientist',
    company: 'QuantaCore Systems',
    companyUrl: 'https://quantacore.example.com',
    sector: 'Quantum Computing',
    location: 'Boston, MA',
    workMode: 'On-site',
    experienceLevel: 'Staff / Principal',
    salaryMin: 210000,
    salaryMax: 265000,
    currency: 'USD',
    hiringWindow: 'open_now',
    launchDate: '2026-11-10',
    applicationDeadline: '2027-01-31',
    skills: ['Surface Codes', 'C++', 'Cryogenics'],
    summary: 'Develop fault-tolerant decoding architectures.',
    responsibilities: ['Build real-time decoders'],
    requirements: ['PhD or equivalent research track record'],
    postedAt: '2026-11-24T12:00:00.000Z',
    applicantCount: 29,
    alertCount: 12,
  },
  {
    id: 'job-3',
    title: 'Humanoid Manipulation Control Engineer',
    company: 'Kinetix Autonomy',
    companyUrl: 'https://kinetix.example.com',
    sector: 'Autonomous Robotics',
    location: 'San Francisco, CA',
    workMode: 'Hybrid',
    experienceLevel: 'Mid-Level',
    salaryMin: 155000,
    salaryMax: 195000,
    currency: 'USD',
    hiringWindow: 'upcoming',
    launchDate: '2027-05-10',
    applicationDeadline: '2027-07-01',
    skills: ['Whole-Body Control', 'Rust', 'MuJoCo'],
    summary: 'Build tactile grasping controllers.',
    responsibilities: ['Deploy manipulation policies'],
    requirements: ['3+ years robotics control'],
    postedAt: '2026-11-18T09:00:00.000Z',
    applicantCount: 9,
    alertCount: 21,
  },
  {
    id: 'job-closed',
    title: 'Archived Role',
    company: 'OldCo',
    companyUrl: 'https://oldco.example.com',
    sector: 'Space & Smart Logistics',
    location: 'Remote',
    workMode: 'Remote',
    experienceLevel: 'Entry',
    salaryMin: 90000,
    salaryMax: 110000,
    currency: 'USD',
    hiringWindow: 'closed',
    launchDate: '2026-01-01',
    applicationDeadline: '2026-06-01',
    skills: ['CAD'],
    summary: 'Closed listing.',
    responsibilities: ['None'],
    requirements: ['None'],
    postedAt: '2026-01-01T00:00:00.000Z',
    applicantCount: 0,
    alertCount: 0,
  },
];

const defaultFilters: JobFilterState = {
  query: '',
  sector: 'All',
  hiringWindow: 'all',
  workMode: 'All',
  experienceLevel: 'All',
  sortBy: 'launch_soonest',
};

test('formatSalaryRange formats USD and EUR cleanly', () => {
  assert.equal(formatSalaryRange(155000, 195000, 'USD'), '$155k – $195k');
  assert.equal(formatSalaryRange(92500, 115000, 'EUR'), '€92.5k – €115k');
});

test('daysUntilLaunch calculates exact future day delta and past status', () => {
  const ref = new Date('2026-11-25T12:00:00.000Z');
  const future = daysUntilLaunch('2026-12-05', ref);
  assert.equal(future.days, 10);
  assert.equal(future.isPast, false);
  assert.equal(future.label, 'Opens in 10 days');

  const tomorrow = daysUntilLaunch('2026-11-26', ref);
  assert.equal(tomorrow.label, 'Opens tomorrow');

  const open = daysUntilLaunch('2026-11-20', ref);
  assert.equal(open.isPast, true);
  assert.equal(open.label, 'Applications open');
});

test('formatQuarterLabel converts ISO dates to quarter labels', () => {
  assert.equal(formatQuarterLabel('2027-02-15'), 'Q1 2027');
  assert.equal(formatQuarterLabel('2027-05-10'), 'Q2 2027');
  assert.equal(formatQuarterLabel('2027-10-01'), 'Q4 2027');
});

test('safeExternalUrl accepts http/https and rejects javascript/data schemes', () => {
  assert.equal(
    safeExternalUrl('https://example.com/careers'),
    'https://example.com/careers'
  );
  assert.equal(safeExternalUrl('javascript:alert(1)'), null);
  assert.equal(safeExternalUrl('data:text/html,<h1>x</h1>'), null);
  assert.equal(safeExternalUrl('not-a-url'), null);
});

test('filterAndSortJobs excludes closed jobs, filters by search/sector/window, and sorts', () => {
  const allActive = filterAndSortJobs(sampleJobs, defaultFilters);
  assert.equal(allActive.length, 3);
  assert.equal(allActive[0].id, 'job-1'); // upcoming, soonest launchDate

  const quantumOnly = filterAndSortJobs(sampleJobs, {
    ...defaultFilters,
    query: 'surface codes',
  });
  assert.equal(quantumOnly.length, 1);
  assert.equal(quantumOnly[0].id, 'job-2');

  const multiToken = filterAndSortJobs(sampleJobs, {
    ...defaultFilters,
    query: 'zurich hybrid battery',
  });
  assert.equal(multiToken.length, 1);
  assert.equal(multiToken[0].id, 'job-1');

  const noMatch = filterAndSortJobs(sampleJobs, {
    ...defaultFilters,
    query: 'nonexistent-role-xyz',
  });
  assert.equal(noMatch.length, 0);

  const bySalary = filterAndSortJobs(sampleJobs, {
    ...defaultFilters,
    sortBy: 'salary_high',
  });
  assert.equal(bySalary[0].id, 'job-2');
  assert.equal(bySalary[1].id, 'job-1');
});

test('groupUpcomingJobsByQuarter groups upcoming jobs chronologically', () => {
  const groups = groupUpcomingJobsByQuarter(sampleJobs);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].quarter, 'Q1 2027');
  assert.equal(groups[0].jobs[0].id, 'job-1');
  assert.equal(groups[1].quarter, 'Q2 2027');
  assert.equal(groups[1].jobs[0].id, 'job-3');
});
