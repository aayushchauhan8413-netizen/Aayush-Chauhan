import { ExternalLink, FileText } from 'lucide-react';
import type { ApplicationStatus, JobApplication } from '../types';
import { formatDateShort, safeExternalUrl } from '../utils/jobsLogic';

interface MyApplicationsViewProps {
  applications: JobApplication[];
  onGoToExplore: () => void;
}

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  New: 'text-slate-700',
  Reviewing: 'text-blue-700',
  Interviewing: 'text-amber-700',
  Shortlisted: 'text-emerald-700',
  Declined: 'text-red-700',
};

export function MyApplicationsView({
  applications,
  onGoToExplore,
}: MyApplicationsViewProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            My Applications &amp; Pre-Registrations
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Live hiring status for roles you have applied to or pre-registered early
            interest for from this workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToExplore}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium whitespace-nowrap self-start sm:self-auto"
        >
          Browse More Roles
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
          <h2 className="font-display text-lg font-semibold text-slate-900">
            No applications submitted yet
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Apply to an open advertisement or pre-register early interest for an upcoming
            2027 role to track employer review status here.
          </p>
          <button
            type="button"
            onClick={onGoToExplore}
            className="mt-1 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            Explore Future Roles
          </button>
        </div>
      ) : (
        <div
          data-testid="my-applications-list"
          className="bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3.5 px-5">Role &amp; Organization</th>
                  <th className="py-3.5 px-5">Submission Type</th>
                  <th className="py-3.5 px-5">Submitted On</th>
                  <th className="py-3.5 px-5">Pipeline Stage</th>
                  <th className="py-3.5 px-5 text-right">Profile Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {applications.map((app) => {
                  const safeUrl = safeExternalUrl(app.portfolioUrl);
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70">
                      <td className="py-4 px-5">
                        <p className="font-medium text-slate-900">{app.jobTitle}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {app.company} · {app.email}
                        </p>
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-700 whitespace-nowrap">
                        {app.isEarlyInterest
                          ? 'Early-Interest Pre-Registration'
                          : 'Direct Application'}
                      </td>
                      <td className="py-4 px-5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateShort(app.submittedAt)}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${STATUS_STYLE[app.status]}`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {safeUrl ? (
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                          >
                            Portfolio
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
