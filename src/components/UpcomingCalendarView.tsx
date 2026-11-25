import { Bell, Calendar } from 'lucide-react';
import type { JobAdvertisement } from '../types';
import {
  daysUntilLaunch,
  formatDateShort,
  formatSalaryRange,
  groupUpcomingJobsByQuarter,
} from '../utils/jobsLogic';

interface UpcomingCalendarViewProps {
  jobs: JobAdvertisement[];
  onOpenJob: (job: JobAdvertisement, mode?: 'overview' | 'apply' | 'alert') => void;
  onGoToExplore: () => void;
}

export function UpcomingCalendarView({
  jobs,
  onOpenJob,
  onGoToExplore,
}: UpcomingCalendarViewProps) {
  const groups = groupUpcomingJobsByQuarter(jobs);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-amber-700">
            Scheduled Hiring Roadmap
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
            Upcoming Future Job Calendar
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Every future job advertisement grouped chronologically by target launch
            quarter. Set a launch alert to be notified when applications formally open,
            or pre-register your interest ahead of schedule.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToExplore}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-800 whitespace-nowrap self-start sm:self-auto"
        >
          Back to Full Directory
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
          <h2 className="font-display text-lg font-semibold text-slate-900">
            No upcoming scheduled roles right now
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            All currently published job advertisements are actively open for immediate
            applications.
          </p>
          <button
            type="button"
            onClick={onGoToExplore}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Browse Open Roles
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section
              key={group.quarter}
              aria-labelledby={`quarter-${group.sortKey}`}
              className="space-y-4"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2
                  id={`quarter-${group.sortKey}`}
                  className="font-display text-xl font-semibold text-slate-900"
                >
                  {group.quarter}
                </h2>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {group.jobs.length}{' '}
                  {group.jobs.length === 1 ? 'scheduled role' : 'scheduled roles'}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
                {group.jobs.map((job) => {
                  const countdown = daysUntilLaunch(job.launchDate);
                  return (
                    <div
                      key={job.id}
                      className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-5 min-w-0 flex-1">
                        <div className="sm:w-36 shrink-0">
                          <p className="font-mono text-sm font-medium text-slate-900 tabular-nums">
                            {formatDateShort(job.launchDate)}
                          </p>
                          <p className="text-xs font-medium text-amber-700 mt-0.5 tabular-nums">
                            {countdown.label}
                          </p>
                        </div>

                        <div className="space-y-1 min-w-0">
                          <p className="text-xs text-slate-500">
                            <span className="font-medium text-slate-700">
                              {job.company}
                            </span>
                            <span aria-hidden="true" className="mx-1.5">·</span>
                            <span>{job.sector}</span>
                            <span aria-hidden="true" className="mx-1.5">·</span>
                            <span>{job.location}</span>
                            <span aria-hidden="true" className="mx-1.5">·</span>
                            <span>{job.workMode}</span>
                          </p>
                          <h3 className="font-display text-base font-semibold text-slate-900">
                            <button
                              type="button"
                              onClick={() => onOpenJob(job, 'overview')}
                              className="text-left hover:text-blue-700 transition-colors"
                            >
                              {job.title}
                            </button>
                          </h3>
                          <p className="text-xs text-slate-600 font-mono tabular-nums">
                            {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}{' '}
                            · {job.experienceLevel} · {job.alertCount} watching
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenJob(job, 'alert')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 whitespace-nowrap"
                        >
                          <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                          Set Alert
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenJob(job, 'apply')}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap"
                        >
                          Pre-Register
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
