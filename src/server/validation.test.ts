import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAlertPayload,
  validateApplicationPayload,
  validateCreateJobPayload,
} from './validation';

test('validateCreateJobPayload accepts valid future job payload', () => {
  const res = validateCreateJobPayload({
    title: 'Orbital Thermal Systems Engineer',
    company: 'Solstice Aerospace',
    companyUrl: 'https://solstice.example.com',
    sector: 'Space & Smart Logistics',
    location: 'Seattle, WA',
    workMode: 'Hybrid',
    experienceLevel: 'Senior',
    salaryMin: 180000,
    salaryMax: 230000,
    currency: 'USD',
    hiringWindow: 'upcoming',
    launchDate: '2027-04-01',
    applicationDeadline: '2027-06-15',
    skills: ['Thermal Analysis', 'Python', 'Flight Hardware'],
    summary:
      'Architect next-generation radiator arrays and cryogenic thermal loops for orbital transfer craft.',
    responsibilities: ['Lead thermal modeling'],
    requirements: ['5+ years aerospace thermal engineering'],
  });
  assert.equal(res.ok, true);
  assert.equal(res.data?.title, 'Orbital Thermal Systems Engineer');
  assert.equal(res.data?.salaryMin, 180000);
});

test('validateCreateJobPayload rejects invalid deadline and javascript URLs', () => {
  const badUrl = validateCreateJobPayload({
    title: 'Grid Software Architect',
    company: 'Volt',
    companyUrl: 'javascript:alert(1)',
    sector: 'Clean Energy & Grid',
    location: 'Berlin',
    workMode: 'Remote',
    experienceLevel: 'Senior',
    salaryMin: 120000,
    salaryMax: 150000,
    launchDate: '2027-05-01',
    applicationDeadline: '2027-06-01',
    skills: ['Rust'],
    summary: 'Design distributed microgrid control planes for industrial solar storage.',
  });
  assert.equal(badUrl.ok, false);

  const badDates = validateCreateJobPayload({
    title: 'Grid Software Architect',
    company: 'Volt',
    companyUrl: 'https://volt.example.com',
    sector: 'Clean Energy & Grid',
    location: 'Berlin',
    workMode: 'Remote',
    experienceLevel: 'Senior',
    salaryMin: 120000,
    salaryMax: 150000,
    launchDate: '2027-07-01',
    applicationDeadline: '2027-06-01',
    skills: ['Rust'],
    summary: 'Design distributed microgrid control planes for industrial solar storage.',
  });
  assert.equal(badDates.ok, false);
});

test('validateApplicationPayload enforces email, safe portfolio URL, and cover note length', () => {
  const valid = validateApplicationPayload({
    jobId: 'job-1',
    fullName: 'Maya Lin',
    email: 'Maya@Example.com',
    portfolioUrl: 'https://mayalin.dev',
    yearsExperience: 6,
    coverNote: 'Built three production battery management lines with ISO compliance.',
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.data?.email, 'maya@example.com');

  const xssUrl = validateApplicationPayload({
    jobId: 'job-1',
    fullName: 'Maya Lin',
    email: 'maya@example.com',
    portfolioUrl: 'javascript:void(0)',
    yearsExperience: 6,
    coverNote: 'Built three production battery management lines with ISO compliance.',
  });
  assert.equal(xssUrl.ok, false);

  const shortNote = validateApplicationPayload({
    jobId: 'job-1',
    fullName: 'Maya Lin',
    email: 'maya@example.com',
    portfolioUrl: '',
    yearsExperience: 6,
    coverNote: 'Hi',
  });
  assert.equal(shortNote.ok, false);
});

test('validateAlertPayload requires valid email and at least one filter target', () => {
  const valid = validateAlertPayload({
    email: 'alerts@example.com',
    sector: 'Quantum Computing',
    keyword: 'cryogenics',
  });
  assert.equal(valid.ok, true);

  const missingTarget = validateAlertPayload({
    email: 'alerts@example.com',
  });
  assert.equal(missingTarget.ok, false);
});
