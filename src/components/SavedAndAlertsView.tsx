import { useState, type FormEvent } from 'react';
import { Bell, Bookmark, Trash2 } from 'lucide-react';
import { JOB_SECTORS, type JobAdvertisement, type JobAlert, type JobSector } from '../types';
import { formatDateShort, formatSalaryRange } from '../utils/jobsLogic';

interface SavedAndAlertsViewProps {
  jobs: JobAdvertisement[];
  savedJobIds: string[];
  alerts: JobAlert[];
  onOpenJob: (job: JobAdvertisement, mode?: 'overview' | 'apply' | 'alert') => void;
  onToggleSave: (jobId: string) => Promise<void>;
  onCreateAlert: (payload: {
    email: string;
    sector?: JobSector | 'All Sectors';
    keyword?: string;
  }) => Promise<void>;
  onDeleteAlert: (alertId: string) => Promise<void>;
  onGoToExplore: () => void;
}

export function SavedAndAlertsView({
  jobs,
  savedJobIds,
  alerts,
  onOpenJob,
  onToggleSave,
  onCreateAlert,
  onDeleteAlert,
  onGoToExplore,
}: SavedAndAlertsViewProps) {
  const [email, setEmail] = useState('');
  const [sector, setSector] = useState<JobSector | 'All Sectors'>('All Sectors');
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const savedJobs = jobs.filter((j) => savedJobIds.includes(j.id));

  const handleCreateCustomAlert = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await onCreateAlert({
        email: email.trim(),
        sector,
        keyword: keyword.trim() || undefined,
      });
      setEmail('');
      setKeyword('');
      setSuccessMsg('Custom future job alert created and saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save alert.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
          Saved Roles &amp; Launch Alerts
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Shortlisted future opportunities and active launch-day reminders synced to your
          workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Saved Roles Column */}
        <section aria-labelledby="saved-roles-heading" className="lg:col-span-7 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2
              id="saved-roles-heading"
              className="font-display text-xl font-semibold text-slate-900"
            >
              Saved Roles ({savedJobs.length})
            </h2>
          </div>

          {savedJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <Bookmark className="w-7 h-7 text-slate-400 mx-auto" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-900">No saved roles yet</p>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Bookmark any open or upcoming job advertisement from the directory to
                compare salaries and launch timelines side by side.
              </p>
              <button
                type="button"
                onClick={onGoToExplore}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
              >
                Explore Job Directory
              </button>
            </div>
          ) : (
            <div
              data-testid="saved-jobs-list"
              className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200"
            >
              {savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs text-slate-500">
                      <span
                        className={
                          job.hiringWindow === 'upcoming'
                            ? 'text-amber-700 font-medium'
                            : 'text-emerald-700 font-medium'
                        }
                      >
                        {job.hiringWindow === 'upcoming'
                          ? `Launches ${formatDateShort(job.launchDate)}`
                          : 'Open Now'}
                      </span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span>{job.company}</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span>{job.location}</span>
                    </p>
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      <button
                        type="button"
                        onClick={() => onOpenJob(job, 'overview')}
                        className="text-left hover:text-blue-700"
                      >
                        {job.title}
                      </button>
                    </h3>
                    <p className="font-mono text-xs text-slate-600 tabular-nums">
                      {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)} ·{' '}
                      {job.workMode}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenJob(job, 'apply')}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap"
                    >
                      {job.hiringWindow === 'upcoming' ? 'Pre-Register' : 'Apply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onToggleSave(job.id)}
                      aria-label={`Remove ${job.title} from saved`}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Launch Alerts Column */}
        <section aria-labelledby="alerts-heading" className="lg:col-span-5 space-y-5">
          <h2
            id="alerts-heading"
            className="font-display text-xl font-semibold text-slate-900"
          >
            Future Launch Alerts ({alerts.length})
          </h2>

          {/* Create Custom Sector/Keyword Alert Form */}
          <form
            onSubmit={handleCreateCustomAlert}
            noValidate
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Create Custom Sector Watch
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Monitor upcoming future advertisements matching a specific sector or
                skill keyword.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
              >
                {error}
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800"
              >
                {successMsg}
              </div>
            )}

            <div>
              <label
                htmlFor="custom-alert-email"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Email Address *
              </label>
              <input
                id="custom-alert-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="custom-alert-sector"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Future Sector
                </label>
                <select
                  id="custom-alert-sector"
                  value={sector}
                  onChange={(e) =>
                    setSector(e.target.value as JobSector | 'All Sectors')
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="All Sectors">All Sectors</option>
                  {JOB_SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="custom-alert-keyword"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Skill / Keyword
                </label>
                <input
                  id="custom-alert-keyword"
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. FPGA, Rust"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Future Alert'}
            </button>
          </form>

          {/* Active Alerts List */}
          {alerts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-2">
              <Bell className="w-6 h-6 text-slate-400 mx-auto" aria-hidden="true" />
              <p className="text-xs text-slate-600">
                No active launch alerts yet. Set one on any upcoming role or create a
                custom watch above.
              </p>
            </div>
          ) : (
            <div
              data-testid="active-alerts-list"
              className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200"
            >
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {alert.jobTitle
                        ? `Launch reminder: ${alert.jobTitle}`
                        : `${alert.sector ?? 'All Sectors'}${
                            alert.keyword ? ` · "${alert.keyword}"` : ''
                          }`}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {alert.email} · Created {formatDateShort(alert.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onDeleteAlert(alert.id)}
                    aria-label={`Delete alert for ${alert.jobTitle ?? alert.sector ?? alert.email}`}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
