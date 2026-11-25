import { useState, type FormEvent } from 'react';
import {
  EXPERIENCE_LEVELS,
  JOB_SECTORS,
  WORK_MODES,
  type CurrencyCode,
  type ExperienceLevel,
  type HiringWindow,
  type JobAdvertisement,
  type JobSector,
  type WorkMode,
} from '../types';
import type { JobFormPayload } from '../services/api';
import { safeExternalUrl } from '../utils/jobsLogic';

interface EmployerJobFormProps {
  initialJob?: JobAdvertisement | null;
  onSubmit: (payload: JobFormPayload) => Promise<void>;
  onCancel: () => void;
}

export function EmployerJobForm({
  initialJob,
  onSubmit,
  onCancel,
}: EmployerJobFormProps) {
  const [title, setTitle] = useState(initialJob?.title ?? '');
  const [company, setCompany] = useState(initialJob?.company ?? '');
  const [companyUrl, setCompanyUrl] = useState(initialJob?.companyUrl ?? '');
  const [sector, setSector] = useState<JobSector>(
    initialJob?.sector ?? 'Autonomous Robotics'
  );
  const [location, setLocation] = useState(initialJob?.location ?? '');
  const [workMode, setWorkMode] = useState<WorkMode>(
    initialJob?.workMode ?? 'Hybrid'
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    initialJob?.experienceLevel ?? 'Senior'
  );
  const [salaryMin, setSalaryMin] = useState(
    String(initialJob?.salaryMin ?? 150000)
  );
  const [salaryMax, setSalaryMax] = useState(
    String(initialJob?.salaryMax ?? 195000)
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    initialJob?.currency ?? 'USD'
  );
  const [hiringWindow, setHiringWindow] = useState<HiringWindow>(
    initialJob?.hiringWindow ?? 'upcoming'
  );
  const [launchDate, setLaunchDate] = useState(
    initialJob?.launchDate ?? '2027-03-15'
  );
  const [applicationDeadline, setApplicationDeadline] = useState(
    initialJob?.applicationDeadline ?? '2027-05-30'
  );
  const [skillsText, setSkillsText] = useState(
    initialJob ? initialJob.skills.join(', ') : ''
  );
  const [summary, setSummary] = useState(initialJob?.summary ?? '');
  const [responsibilitiesText, setResponsibilitiesText] = useState(
    initialJob ? initialJob.responsibilities.join('\n') : ''
  );
  const [requirementsText, setRequirementsText] = useState(
    initialJob ? initialJob.requirements.join('\n') : ''
  );

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('Job title must be at least 3 characters.');
      return;
    }
    if (company.trim().length < 2) {
      setError('Company name must be at least 2 characters.');
      return;
    }
    if (companyUrl.trim() && !safeExternalUrl(companyUrl.trim())) {
      setError('Company URL must begin with http:// or https://.');
      return;
    }
    if (location.trim().length < 2) {
      setError('Enter a job location (city, country, or Remote).');
      return;
    }

    const minVal = Number(salaryMin);
    const maxVal = Number(salaryMax);
    if (
      !Number.isFinite(minVal) ||
      !Number.isFinite(maxVal) ||
      minVal < 20000 ||
      maxVal < minVal
    ) {
      setError('Salary range must be valid numbers with maximum >= minimum.');
      return;
    }

    if (!launchDate || !applicationDeadline || applicationDeadline < launchDate) {
      setError('Application deadline must be on or after the launch date.');
      return;
    }

    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (skills.length === 0) {
      setError('Enter at least one skill (comma-separated).');
      return;
    }

    if (summary.trim().length < 20) {
      setError('Role summary must be at least 20 characters.');
      return;
    }

    const responsibilities = responsibilitiesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const requirements = requirementsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        company: company.trim(),
        companyUrl: companyUrl.trim(),
        sector,
        location: location.trim(),
        workMode,
        experienceLevel,
        salaryMin: Math.round(minVal),
        salaryMax: Math.round(maxVal),
        currency,
        hiringWindow,
        launchDate,
        applicationDeadline,
        skills,
        summary: summary.trim(),
        responsibilities,
        requirements,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save job advertisement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900">
            {initialJob
              ? `Edit Advertisement: ${initialJob.title}`
              : 'Publish Future Job Advertisement'}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Schedule an upcoming future hiring window or publish an immediately open
            role.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="job-title"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Role Title *
          </label>
          <input
            id="job-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Orbital Solar Grid Architect"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label
            htmlFor="job-company"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Company / Organization *
          </label>
          <input
            id="job-company"
            type="text"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Solstice Energy Labs"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label
            htmlFor="job-sector"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Future Industry Sector *
          </label>
          <select
            id="job-sector"
            value={sector}
            onChange={(e) => setSector(e.target.value as JobSector)}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {JOB_SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="job-company-url"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Company Website URL
          </label>
          <input
            id="job-company-url"
            type="url"
            value={companyUrl}
            onChange={(e) => setCompanyUrl(e.target.value)}
            placeholder="https://company.example.com"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label
            htmlFor="job-location"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Location *
          </label>
          <input
            id="job-location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Seattle, WA or Zurich, Switzerland"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="job-workmode"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Work Mode *
            </label>
            <select
              id="job-workmode"
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as WorkMode)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="job-experience"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Seniority *
            </label>
            <select
              id="job-experience"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Compensation & Hiring Window */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 border-t border-slate-100">
        <div>
          <label
            htmlFor="job-salary-min"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Salary Min *
          </label>
          <input
            id="job-salary-min"
            type="number"
            min={20000}
            step={1000}
            required
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label
            htmlFor="job-salary-max"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Salary Max *
          </label>
          <input
            id="job-salary-max"
            type="number"
            min={20000}
            step={1000}
            required
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label
            htmlFor="job-currency"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Currency
          </label>
          <select
            id="job-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="job-window"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Hiring Window *
          </label>
          <select
            id="job-window"
            value={hiringWindow}
            onChange={(e) => setHiringWindow(e.target.value as HiringWindow)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="upcoming">Upcoming Future</option>
            <option value="open_now">Open Now</option>
            <option value="closed">Closed / Archived</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="job-launch-date"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Launch Date *
          </label>
          <input
            id="job-launch-date"
            type="date"
            required
            value={launchDate}
            onChange={(e) => setLaunchDate(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="job-deadline"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Application Close Date *
          </label>
          <input
            id="job-deadline"
            type="date"
            required
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label
            htmlFor="job-skills"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Required Skills (comma-separated) *
          </label>
          <input
            id="job-skills"
            type="text"
            required
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="e.g. Power Electronics, Rust, Thermal Modeling"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="job-summary"
          className="block text-xs font-medium text-slate-700 mb-1.5"
        >
          Role Summary *
        </label>
        <textarea
          id="job-summary"
          rows={3}
          required
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Describe the upcoming team mission, technical scope, and why this future role is being opened..."
          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="job-responsibilities"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Key Responsibilities (one per line)
          </label>
          <textarea
            id="job-responsibilities"
            rows={4}
            value={responsibilitiesText}
            onChange={(e) => setResponsibilitiesText(e.target.value)}
            placeholder={'Design fault-tolerant control architecture\nLead hardware-in-the-loop verification'}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label
            htmlFor="job-requirements"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Qualifications (one per line)
          </label>
          <textarea
            id="job-requirements"
            rows={4}
            value={requirementsText}
            onChange={(e) => setRequirementsText(e.target.value)}
            placeholder={'5+ years in systems engineering\nExperience deploying production hardware'}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          {submitting
            ? 'Saving Advertisement...'
            : initialJob
            ? 'Save Changes'
            : 'Publish Job Advertisement'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
