import { useState, type FormEvent } from 'react';
import {
  ExternalLink,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type HiringWindow,
  type JobAdvertisement,
  type JobApplication,
} from '../types';
import type { EmployerAuthStatus, JobFormPayload } from '../services/api';
import {
  formatDateShort,
  formatSalaryRange,
  safeExternalUrl,
} from '../utils/jobsLogic';
import { EmployerJobForm } from './EmployerJobForm';

interface EmployerStudioViewProps {
  authStatus: EmployerAuthStatus | null;
  employerJobs: JobAdvertisement[];
  employerApplications: JobApplication[];
  onSetupPasscode: (passcode: string) => Promise<void>;
  onLogin: (passcode: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onCreateJob: (payload: JobFormPayload) => Promise<void>;
  onUpdateJob: (jobId: string, payload: Partial<JobFormPayload>) => Promise<void>;
  onDeleteJob: (jobId: string) => Promise<void>;
  onUpdateApplicationStatus: (
    applicationId: string,
    status: ApplicationStatus
  ) => Promise<void>;
}

type StudioSubTab = 'listings' | 'applicants' | 'post';

export function EmployerStudioView({
  authStatus,
  employerJobs,
  employerApplications,
  onSetupPasscode,
  onLogin,
  onLogout,
  onCreateJob,
  onUpdateJob,
  onDeleteJob,
  onUpdateApplicationStatus,
}: EmployerStudioViewProps) {
  const [subTab, setSubTab] = useState<StudioSubTab>('listings');
  const [editingJob, setEditingJob] = useState<JobAdvertisement | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [applicantJobFilter, setApplicantJobFilter] = useState<string>('all');

  // Auth form state
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authStatus?.configured) {
      if (passcode.trim().length < 6) {
        setAuthError('Create a passcode with at least 6 characters.');
        return;
      }
      if (passcode !== confirmPasscode) {
        setAuthError('Passcodes do not match.');
        return;
      }
      setAuthSubmitting(true);
      try {
        await onSetupPasscode(passcode);
        setPasscode('');
        setConfirmPasscode('');
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Unable to set up passcode.');
      } finally {
        setAuthSubmitting(false);
      }
      return;
    }

    if (!passcode.trim()) {
      setAuthError('Enter your employer workspace passcode.');
      return;
    }
    setAuthSubmitting(true);
    try {
      await onLogin(passcode);
      setPasscode('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Incorrect passcode.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Locked / First-Run Claim Gate
  if (!authStatus?.authenticated) {
    const isFirstRun = authStatus !== null && !authStatus.configured;
    return (
      <div className="max-w-lg mx-auto py-8">
        <div className="bg-white border border-slate-200 rounded-xl p-7 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <KeyRound className="w-5 h-5" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {isFirstRun
                ? 'Set Up Employer Workspace'
                : 'Unlock Employer Studio'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isFirstRun
                ? 'Create an employer passcode to protect job publishing and candidate application records. Your passcode is hashed securely on the server.'
                : 'Enter your employer workspace passcode to publish future job advertisements, edit launch windows, and review candidate applications.'}
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="employer-passcode"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                {isFirstRun ? 'Create Workspace Passcode (min 6 chars)' : 'Employer Passcode'}
              </label>
              <input
                id="employer-passcode"
                type="password"
                autoComplete={isFirstRun ? 'new-password' : 'current-password'}
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={isFirstRun ? 'Enter a new passcode' : 'Enter passcode'}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {isFirstRun && (
              <div>
                <label
                  htmlFor="employer-passcode-confirm"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Confirm Workspace Passcode
                </label>
                <input
                  id="employer-passcode-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="Re-enter passcode"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting || authStatus === null}
              className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {authSubmitting
                ? 'Verifying...'
                : isFirstRun
                ? 'Claim & Open Employer Studio'
                : 'Unlock Employer Studio'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredApplications =
    applicantJobFilter === 'all'
      ? employerApplications
      : employerApplications.filter((a) => a.jobId === applicantJobFilter);

  const handleWindowChange = async (job: JobAdvertisement, nextWindow: HiringWindow) => {
    await onUpdateJob(job.id, { hiringWindow: nextWindow });
    setBannerMessage(`Updated "${job.title}" hiring status to ${nextWindow.replace('_', ' ')}.`);
  };

  return (
    <div className="space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-blue-700">Employer Publishing Console</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 mt-0.5">
            Employer Studio
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Publish upcoming job advertisements, control launch windows, and advance
            candidates through hiring stages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingJob(null);
              setSubTab('post');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Post New Job Ad
          </button>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 whitespace-nowrap"
          >
            <Lock className="w-4 h-4" aria-hidden="true" />
            Lock Studio
          </button>
        </div>
      </div>

      {bannerMessage && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center justify-between gap-4"
        >
          <span>{bannerMessage}</span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-emerald-800 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Segmented Sub-Navigation */}
      <div
        role="tablist"
        aria-label="Employer studio sections"
        className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'listings'}
          onClick={() => {
            setEditingJob(null);
            setSubTab('listings');
          }}
          className={`px-4 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            subTab === 'listings'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Job Advertisements ({employerJobs.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'applicants'}
          onClick={() => setSubTab('applicants')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            subTab === 'applicants'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Applicant Pipeline ({employerApplications.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'post'}
          onClick={() => setSubTab('post')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            subTab === 'post'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {editingJob ? 'Edit Advertisement' : 'Post New Job Ad'}
        </button>
      </div>

      {/* Tab 1: Manage Job Advertisements */}
      {subTab === 'listings' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3.5 px-5">Advertisement</th>
                  <th className="py-3.5 px-5">Hiring Window</th>
                  <th className="py-3.5 px-5">Launch / Close</th>
                  <th className="py-3.5 px-5 text-right">Salary Range</th>
                  <th className="py-3.5 px-5 text-right">Demand</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {employerJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 max-w-[320px]">
                      <p className="font-medium text-slate-900 truncate">{job.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {job.company} · {job.sector} · {job.location}
                      </p>
                    </td>
                    <td className="py-4 px-5">
                      <label htmlFor={`window-${job.id}`} className="sr-only">
                        Hiring window for {job.title}
                      </label>
                      <select
                        id={`window-${job.id}`}
                        value={job.hiringWindow}
                        onChange={(e) =>
                          void handleWindowChange(job, e.target.value as HiringWindow)
                        }
                        className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="upcoming">Upcoming Future</option>
                        <option value="open_now">Open Now</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {formatDateShort(job.launchDate)} →{' '}
                      {formatDateShort(job.applicationDeadline)}
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-slate-900 tabular-nums text-right whitespace-nowrap">
                      {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-slate-600 tabular-nums text-right whitespace-nowrap">
                      {job.applicantCount} applied · {job.alertCount} alerts
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      {confirmDeleteId === job.id ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteJob(job.id);
                              setConfirmDeleteId(null);
                              setBannerMessage(`Deleted "${job.title}".`);
                            }}
                            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-slate-600 hover:text-slate-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingJob(job);
                              setSubTab('post');
                            }}
                            aria-label={`Edit ${job.title}`}
                            className="p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(job.id)}
                            aria-label={`Delete ${job.title}`}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Applicant Pipeline */}
      {subTab === 'applicants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Showing{' '}
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                {filteredApplications.length}
              </span>{' '}
              candidates
            </p>
            <div className="flex items-center gap-2">
              <label
                htmlFor="applicant-job-filter"
                className="text-xs font-medium text-slate-600 whitespace-nowrap"
              >
                Filter by Role:
              </label>
              <select
                id="applicant-job-filter"
                value={applicantJobFilter}
                onChange={(e) => setApplicantJobFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Roles</option>
                {employerJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
              No candidate applications found for the selected role filter.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {filteredApplications.map((app) => {
                const safeUrl = safeExternalUrl(app.portfolioUrl);
                return (
                  <div
                    key={app.id}
                    className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-5"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">
                          {app.fullName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{app.email}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {app.yearsExperience} yrs exp
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {app.isEarlyInterest ? 'Early Pre-Registration' : 'Direct Application'}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-blue-700">
                        {app.jobTitle} ({app.company}) · Submitted{' '}
                        {formatDateShort(app.submittedAt)}
                      </p>

                      <p className="text-sm text-slate-700 leading-relaxed pt-1">
                        {app.coverNote}
                      </p>

                      {safeUrl && (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline pt-1"
                        >
                          View candidate portfolio
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label
                        htmlFor={`status-${app.id}`}
                        className="text-xs font-medium text-slate-600 whitespace-nowrap"
                      >
                        Stage:
                      </label>
                      <select
                        id={`status-${app.id}`}
                        value={app.status}
                        onChange={async (e) => {
                          const nextStatus = e.target.value as ApplicationStatus;
                          await onUpdateApplicationStatus(app.id, nextStatus);
                          setBannerMessage(
                            `Moved ${app.fullName} to "${nextStatus}".`
                          );
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Post / Edit Job Advertisement */}
      {subTab === 'post' && (
        <EmployerJobForm
          key={editingJob?.id ?? 'new-job'}
          initialJob={editingJob}
          onCancel={() => {
            setEditingJob(null);
            setSubTab('listings');
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
          }}
          onSubmit={async (payload) => {
            if (editingJob) {
              await onUpdateJob(editingJob.id, payload);
              setBannerMessage(`Saved updates to "${payload.title}".`);
            } else {
              await onCreateJob(payload);
              setBannerMessage(
                `Published "${payload.title}" to the live job board.`
              );
            }
            setEditingJob(null);
            setSubTab('listings');
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
          }}
        />
      )}
    </div>
  );
}
