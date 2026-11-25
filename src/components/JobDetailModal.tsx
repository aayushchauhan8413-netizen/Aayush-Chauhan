import { useEffect, useState, type FormEvent } from 'react';
import {
  Bell,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ExternalLink,
  X,
} from 'lucide-react';
import type { JobAdvertisement } from '../types';
import {
  daysUntilLaunch,
  formatDateShort,
  formatQuarterLabel,
  formatSalaryRange,
  safeExternalUrl,
} from '../utils/jobsLogic';
import { EditorialImage, SECTOR_IMAGES } from './SectorImage';

interface JobDetailModalProps {
  job: JobAdvertisement | null;
  initialMode?: 'overview' | 'apply' | 'alert';
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (jobId: string) => Promise<void>;
  onSubmitApplication: (payload: {
    jobId: string;
    fullName: string;
    email: string;
    portfolioUrl: string;
    yearsExperience: number;
    coverNote: string;
  }) => Promise<void>;
  onCreateJobAlert: (payload: { email: string; jobId: string }) => Promise<void>;
}

export function JobDetailModal({
  job,
  initialMode = 'overview',
  isSaved,
  onClose,
  onToggleSave,
  onSubmitApplication,
  onCreateJobAlert,
}: JobDetailModalProps) {
  const [panelMode, setPanelMode] = useState<'overview' | 'apply' | 'alert'>(
    initialMode
  );

  // Application form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [yearsExperience, setYearsExperience] = useState('4');
  const [coverNote, setCoverNote] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);

  // Launch alert form state
  const [alertEmail, setAlertEmail] = useState('');
  const [alertError, setAlertError] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [submittingAlert, setSubmittingAlert] = useState(false);

  useEffect(() => {
    setPanelMode(initialMode);
    setApplyError(null);
    setApplySuccess(false);
    setAlertError(null);
    setAlertSuccess(false);
  }, [job?.id, initialMode]);

  useEffect(() => {
    if (!job) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [job, onClose]);

  if (!job) return null;

  const countdown = daysUntilLaunch(job.launchDate);
  const verifiedUrl = safeExternalUrl(job.companyUrl);
  const sectorAsset = SECTOR_IMAGES[job.sector];
  const isUpcoming = job.hiringWindow === 'upcoming';

  const handleApplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApplyError(null);

    if (fullName.trim().length < 2) {
      setApplyError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setApplyError('Please enter a valid email address.');
      return;
    }
    if (portfolioUrl.trim() && !safeExternalUrl(portfolioUrl.trim())) {
      setApplyError('Portfolio or LinkedIn URL must begin with http:// or https://.');
      return;
    }
    const yrs = Number(yearsExperience);
    if (!Number.isFinite(yrs) || yrs < 0 || yrs > 60) {
      setApplyError('Enter a valid number of years of experience (0–60).');
      return;
    }
    if (coverNote.trim().length < 15) {
      setApplyError('Please include a short note (at least 15 characters) about your background.');
      return;
    }

    setSubmittingApp(true);
    try {
      await onSubmitApplication({
        jobId: job.id,
        fullName: fullName.trim(),
        email: email.trim(),
        portfolioUrl: portfolioUrl.trim(),
        yearsExperience: Math.round(yrs),
        coverNote: coverNote.trim(),
      });
      setApplySuccess(true);
      setFullName('');
      setEmail('');
      setPortfolioUrl('');
      setCoverNote('');
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Unable to submit application.');
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleAlertSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlertError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(alertEmail.trim())) {
      setAlertError('Please enter a valid email address for the launch alert.');
      return;
    }
    setSubmittingAlert(true);
    try {
      await onCreateJobAlert({ email: alertEmail.trim(), jobId: job.id });
      setAlertSuccess(true);
      setAlertEmail('');
    } catch (err) {
      setAlertError(err instanceof Error ? err.message : 'Unable to create launch alert.');
    } finally {
      setSubmittingAlert(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-[1px]"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-modal-title"
        className="w-full max-w-2xl bg-white h-full overflow-y-auto border-l border-slate-200 flex flex-col"
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-xs font-medium text-slate-500 truncate">
            <span>{job.sector}</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span className={isUpcoming ? 'text-amber-700' : 'text-emerald-700'}>
              {isUpcoming
                ? `Upcoming ${formatQuarterLabel(job.launchDate)}`
                : 'Open now'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void onToggleSave(job.id)}
              aria-label={isSaved ? `Remove ${job.title} from saved` : `Save ${job.title}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                isSaved
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Bookmark className="w-4 h-4" aria-hidden="true" />
              )}
              {isSaved ? 'Saved' : 'Save role'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close job details"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Visual Sector Header */}
        <div className="relative h-44 w-full bg-slate-100 shrink-0 overflow-hidden">
          <EditorialImage
            src={sectorAsset.src}
            alt={sectorAsset.alt}
            fallbackLabel={job.sector}
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent"
          />
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <p className="text-xs font-medium text-slate-200 mb-1">
              {job.company} · {job.location} · {job.workMode}
            </p>
            <h2
              id="job-modal-title"
              className="font-display text-2xl font-semibold tracking-tight leading-snug"
            >
              {job.title}
            </h2>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Job detail sections"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={panelMode === 'overview'}
              onClick={() => setPanelMode('overview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                panelMode === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Role Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={panelMode === 'apply'}
              onClick={() => setPanelMode('apply')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                panelMode === 'apply'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isUpcoming ? 'Pre-Register Interest' : 'Apply Now'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={panelMode === 'alert'}
              onClick={() => setPanelMode('alert')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                panelMode === 'alert'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Set Launch Alert
            </button>
          </div>

          {verifiedUrl && (
            <a
              href={verifiedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
            >
              Company site
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 space-y-6">
          {/* Structured Key Facts Row */}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-200">
            <div>
              <dt className="text-xs text-slate-500">Compensation</dt>
              <dd className="mt-1 font-mono text-sm font-medium text-slate-900 tabular-nums">
                {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">
                {isUpcoming ? 'Scheduled Launch' : 'Opened On'}
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium text-slate-900 tabular-nums">
                {formatDateShort(job.launchDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Application Close</dt>
              <dd className="mt-1 font-mono text-sm font-medium text-slate-900 tabular-nums">
                {formatDateShort(job.applicationDeadline)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Demand</dt>
              <dd className="mt-1 font-mono text-sm font-medium text-slate-900 tabular-nums">
                {job.applicantCount} applied · {job.alertCount} watching
              </dd>
            </div>
          </dl>

          {panelMode === 'overview' && (
            <div className="space-y-6">
              {isUpcoming && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Future Hiring Window · {countdown.label}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Formal interviews begin {formatDateShort(job.launchDate)}. You can
                      pre-register early interest now or set an email launch alert.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPanelMode('alert')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                    Notify me
                  </button>
                </div>
              )}

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  About the Role
                </h3>
                <p className="text-sm leading-relaxed text-slate-700">{job.summary}</p>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Core Technical Skills
                </h3>
                <p className="text-sm text-slate-700">
                  {job.skills.join(' · ')}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Key Responsibilities
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {job.responsibilities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Qualifications & Experience ({job.experienceLevel})
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {job.requirements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </section>

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPanelMode('apply')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  {isUpcoming ? 'Pre-Register Early Interest' : 'Apply for This Role'}
                </button>
                <button
                  type="button"
                  onClick={() => setPanelMode('alert')}
                  className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Set Launch Alert
                </button>
              </div>
            </div>
          )}

          {panelMode === 'apply' && (
            <div>
              {applySuccess ? (
                <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-base">
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    <span>
                      {isUpcoming
                        ? 'Early interest pre-registration confirmed'
                        : 'Application submitted successfully'}
                    </span>
                  </div>
                  <p className="text-sm text-emerald-900/90 leading-relaxed">
                    Your submission for <strong>{job.title}</strong> at {job.company} has
                    been recorded and is now visible in your My Applications tracker.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800"
                  >
                    Return to Directory
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} noValidate className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {isUpcoming
                        ? 'Pre-Register Early Interest'
                        : 'Submit Your Application'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {isUpcoming
                        ? `Your profile will be placed at the front of the review queue when hiring opens on ${formatDateShort(job.launchDate)}.`
                        : `Direct submission to the hiring team at ${job.company}.`}
                    </p>
                  </div>

                  {applyError && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
                    >
                      {applyError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="apply-fullname"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Full Name *
                      </label>
                      <input
                        id="apply-fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Jordan Patel"
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="apply-email"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Email Address *
                      </label>
                      <input
                        id="apply-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jordan@example.com"
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="apply-portfolio"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Portfolio, GitHub, or LinkedIn URL
                      </label>
                      <input
                        id="apply-portfolio"
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="apply-years"
                        className="block text-xs font-medium text-slate-700 mb-1.5"
                      >
                        Years of Experience *
                      </label>
                      <input
                        id="apply-years"
                        type="number"
                        min={0}
                        max={60}
                        required
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="apply-note"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Relevant Background & Cover Note *
                    </label>
                    <textarea
                      id="apply-note"
                      rows={4}
                      required
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Briefly describe projects, systems, or domain experience relevant to this role..."
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={submittingApp}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      {submittingApp
                        ? 'Submitting...'
                        : isUpcoming
                        ? 'Submit Pre-Registration'
                        : 'Submit Application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanelMode('overview')}
                      className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {panelMode === 'alert' && (
            <div>
              {alertSuccess ? (
                <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-base">
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    <span>Launch alert scheduled</span>
                  </div>
                  <p className="text-sm text-emerald-900/90">
                    Your alert for <strong>{job.title}</strong> (scheduled for{' '}
                    {formatDateShort(job.launchDate)}) is saved under Saved &amp; Alerts.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAlertSubmit} noValidate className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Set Future Launch Alert
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Track <strong>{job.title}</strong> at {job.company}. Scheduled
                      hiring launch: {formatDateShort(job.launchDate)}.
                    </p>
                  </div>

                  {alertError && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
                    >
                      {alertError}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="alert-email-input"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Notification Email Address *
                    </label>
                    <input
                      id="alert-email-input"
                      type="email"
                      required
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={submittingAlert}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      {submittingAlert ? 'Saving Alert...' : 'Activate Launch Alert'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanelMode('overview')}
                      className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
