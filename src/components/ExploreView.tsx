import type { FormEvent } from 'react';
import {
  Bell,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import {
  EXPERIENCE_LEVELS,
  JOB_SECTORS,
  WORK_MODES,
  type JobAdvertisement,
  type JobFilterState,
  type JobSector,
  type PlatformStats,
} from '../types';
import {
  daysUntilLaunch,
  filterAndSortJobs,
  formatDateShort,
  formatQuarterLabel,
  formatSalaryRange,
} from '../utils/jobsLogic';
import { EditorialImage, HERO_WORKPLACE_IMAGE, SECTOR_IMAGES } from './SectorImage';

interface ExploreViewProps {
  jobs: JobAdvertisement[];
  stats: PlatformStats | null;
  loading: boolean;
  filters: JobFilterState;
  savedJobIds: string[];
  onChangeFilters: (next: JobFilterState) => void;
  onResetFilters: () => void;
  onOpenJob: (job: JobAdvertisement, mode?: 'overview' | 'apply' | 'alert') => void;
  onToggleSave: (jobId: string) => Promise<void>;
  onGoToCalendar: () => void;
}

const SPOTLIGHT_SECTORS: {
  sector: JobSector;
  headline: string;
  description: string;
}[] = [
  {
    sector: 'Clean Energy & Grid',
    headline: 'Clean Energy & Grid',
    description: 'Solid-state storage, virtual power plants, and grid-scale electrochemistry.',
  },
  {
    sector: 'Autonomous Robotics',
    headline: 'Autonomous Robotics',
    description: 'Dexterous manipulation, real-time control loops, and field robot fleets.',
  },
  {
    sector: 'Healthcare & Bio-Engineering',
    headline: 'Healthcare & Bio-Engineering',
    description: 'Clinical genomics, precision medicine analytics, and bioreactor digital twins.',
  },
];

const QUICK_SEARCH_TERMS = [
  'AI',
  'Cybersecurity',
  'Healthcare',
  'Clean Energy',
  'Spatial',
  'Climate Finance',
  'Robotics',
  'Remote',
] as const;

export function ExploreView({
  jobs,
  stats,
  loading,
  filters,
  savedJobIds,
  onChangeFilters,
  onResetFilters,
  onOpenJob,
  onToggleSave,
  onGoToCalendar,
}: ExploreViewProps) {
  const filteredJobs = filterAndSortJobs(jobs, filters);
  const hasActiveFilters =
    filters.query.trim() !== '' ||
    filters.sector !== 'All' ||
    filters.hiringWindow !== 'all' ||
    filters.workMode !== 'All' ||
    filters.experienceLevel !== 'All';

  const scrollToDirectory = () => {
    const listEl = document.getElementById('job-directory-section');
    listEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleHeroSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    scrollToDirectory();
  };

  const handleQuickSearch = (term: string) => {
    const isSame = filters.query.trim().toLowerCase() === term.toLowerCase();
    onChangeFilters({
      ...filters,
      query: isSame ? '' : term,
      sector: 'All',
    });
    scrollToDirectory();
  };

  const handleSectorSelect = (sector: JobSector) => {
    onChangeFilters({
      ...filters,
      sector: filters.sector === sector ? 'All' : sector,
      query: '',
    });
    scrollToDirectory();
  };

  return (
    <div className="space-y-12">
      {/* Editorial 2-Column Hero */}
      <section aria-labelledby="hero-heading" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-7 sm:p-9">
            <div className="space-y-4">
              <p className="text-xs font-medium text-blue-700 tracking-tight">
                Future Hiring Pipeline &amp; Emerging Industry Job Board
              </p>
              <h1
                id="hero-heading"
                className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.12] [text-wrap:balance] max-w-2xl"
              >
                Discover upcoming job advertisements before hiring opens
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Search scheduled 2027 hiring cohorts and open roles across AI, healthcare,
                cybersecurity, clean energy, robotics, climate finance, and space
                logistics.
              </p>
            </div>

            <div className="mt-7 space-y-4">
              <form
                onSubmit={handleHeroSearchSubmit}
                role="search"
                aria-label="Search future job advertisements"
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <label htmlFor="hero-search-input" className="sr-only">
                    Search future job titles, skills, cities, or companies
                  </label>
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="hero-search-input"
                    type="search"
                    value={filters.query}
                    onChange={(e) =>
                      onChangeFilters({ ...filters, query: e.target.value })
                    }
                    placeholder="Search roles, skills, cities, or sectors..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium whitespace-nowrap shrink-0 transition-colors"
                >
                  Search Jobs ({filteredJobs.length})
                </button>
              </form>

              {/* Interactive Quick-Search Filter Controls */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
                <span className="text-slate-500 font-medium">Try searching:</span>
                {QUICK_SEARCH_TERMS.map((term) => {
                  const active =
                    filters.query.trim().toLowerCase() === term.toLowerCase();
                  return (
                    <button
                      key={term}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleQuickSearch(term)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {term}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[260px]">
            <EditorialImage
              src={HERO_WORKPLACE_IMAGE}
              alt="Engineers reviewing precision robotics hardware inside a sunlit research studio"
              fallbackLabel="Future Engineering Workplace"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Full-Width 4-Column Live KPI Strip */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          <div className="p-5">
            <dt className="text-xs font-medium text-slate-500">Active &amp; Upcoming Ads</dt>
            <dd className="mt-1.5 font-mono text-2xl font-medium text-slate-900 tabular-nums">
              {stats ? stats.totalJobs : '—'}
            </dd>
            <p className="mt-1 text-xs text-slate-500">
              {stats
                ? `${stats.openNowCount} open now · ${stats.upcomingCount} scheduled`
                : 'Loading live counts'}
            </p>
          </div>
          <div className="p-5">
            <dt className="text-xs font-medium text-slate-500">Opening Next 90 Days</dt>
            <dd className="mt-1.5 font-mono text-2xl font-medium text-slate-900 tabular-nums">
              {stats ? stats.launchingNext90Days : '—'}
            </dd>
            <p className="mt-1 text-xs text-slate-500">
              <button
                type="button"
                onClick={onGoToCalendar}
                className="text-blue-700 hover:underline font-medium"
              >
                View Q1–Q3 2027 launch calendar
              </button>
            </p>
          </div>
          <div className="p-5">
            <dt className="text-xs font-medium text-slate-500">Median Top Compensation</dt>
            <dd className="mt-1.5 font-mono text-2xl font-medium text-slate-900 tabular-nums">
              {stats && stats.medianSalaryMax > 0
                ? `$${Math.round(stats.medianSalaryMax / 1000)}k`
                : '—'}
            </dd>
            <p className="mt-1 text-xs text-slate-500">Published base salary ceilings</p>
          </div>
          <div className="p-5">
            <dt className="text-xs font-medium text-slate-500">Candidate Watchers</dt>
            <dd className="mt-1.5 font-mono text-2xl font-medium text-slate-900 tabular-nums">
              {stats ? stats.activeAlerts + stats.totalApplications : '—'}
            </dd>
            <p className="mt-1 text-xs text-slate-500">
              {stats
                ? `${stats.totalApplications} applications · ${stats.activeAlerts} alerts`
                : 'Synced live'}
            </p>
          </div>
        </dl>
      </section>

      {/* Live Job Directory (Placed directly below KPI strip for instant search visibility!) */}
      <section
        id="job-directory-section"
        aria-labelledby="directory-heading"
        className="space-y-5 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2
              id="directory-heading"
              className="font-display text-2xl font-semibold tracking-tight text-slate-900"
            >
              Job Advertisements Directory
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Showing{' '}
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                {filteredJobs.length}
              </span>{' '}
              of{' '}
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                {jobs.length}
              </span>{' '}
              verified listings
              {filters.query.trim() && (
                <span>
                  {' '}
                  matching{' '}
                  <strong className="font-semibold text-slate-900">
                    &ldquo;{filters.query.trim()}&rdquo;
                  </strong>
                </span>
              )}
            </p>
          </div>

          {/* Hiring Window Segmented Control */}
          <div
            role="group"
            aria-label="Filter by hiring window"
            className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto"
          >
            {(
              [
                { value: 'all', label: 'All Roles' },
                { value: 'upcoming', label: 'Upcoming Future' },
                { value: 'open_now', label: 'Open Now' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={filters.hiringWindow === opt.value}
                onClick={() =>
                  onChangeFilters({ ...filters, hiringWindow: opt.value })
                }
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  filters.hiringWindow === opt.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Structured Filter Bar with Direct Live Search Input */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="sm:col-span-2 lg:col-span-2">
            <label
              htmlFor="directory-search-input"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Keyword, Role, or City
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="directory-search-input"
                type="text"
                value={filters.query}
                onChange={(e) =>
                  onChangeFilters({ ...filters, query: e.target.value })
                }
                placeholder="Type any keyword (e.g. Genomics, Go, London)..."
                className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {filters.query && (
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, query: '' })}
                  aria-label="Clear search text"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="filter-sector"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Sector
            </label>
            <select
              id="filter-sector"
              value={filters.sector}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  sector: e.target.value as JobSector | 'All',
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Sectors</option>
              {JOB_SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-workmode"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Work Mode
            </label>
            <select
              id="filter-workmode"
              value={filters.workMode}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  workMode: e.target.value as JobFilterState['workMode'],
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Modes</option>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-experience"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Experience
            </label>
            <select
              id="filter-experience"
              value={filters.experienceLevel}
              onChange={(e) =>
                onChangeFilters({
                  ...filters,
                  experienceLevel: e.target.value as JobFilterState['experienceLevel'],
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Levels</option>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="filter-sort"
                className="block text-xs font-medium text-slate-600 mb-1"
              >
                Sort By
              </label>
              <select
                id="filter-sort"
                value={filters.sortBy}
                onChange={(e) =>
                  onChangeFilters({
                    ...filters,
                    sortBy: e.target.value as JobFilterState['sortBy'],
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="launch_soonest">Soonest Launch</option>
                <option value="salary_high">Highest Salary</option>
                <option value="newest">Newest Posted</option>
                <option value="most_interest">Most Interest</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                aria-label="Reset all search filters"
                className="mt-5 p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shrink-0"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Job List (Single-Elevation Architectural Rows) */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-6 animate-pulse space-y-3">
                <div className="h-3.5 w-48 bg-slate-200 rounded" />
                <div className="h-5 w-80 bg-slate-200 rounded" />
                <div className="h-4 w-full max-w-2xl bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
            <h3 className="font-display text-lg font-semibold text-slate-900">
              No job advertisements match{' '}
              {filters.query.trim() ? `"${filters.query.trim()}"` : 'your active filters'}
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Try a broader skill, city, or industry keyword (such as &ldquo;AI&rdquo;,
              &ldquo;Healthcare&rdquo;, &ldquo;Cybersecurity&rdquo;, or
              &ldquo;Remote&rdquo;), or clear your active filters.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div
            data-testid="job-directory-list"
            className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200"
          >
            {filteredJobs.map((job) => {
              const isSaved = savedJobIds.includes(job.id);
              const isUpcoming = job.hiringWindow === 'upcoming';
              const countdown = daysUntilLaunch(job.launchDate);

              return (
                <article
                  key={job.id}
                  className="p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    {/* Quiet 1-line unboxed metadata kicker */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span
                        className={`font-semibold ${
                          isUpcoming ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {isUpcoming
                          ? `Upcoming · ${formatQuarterLabel(job.launchDate)}`
                          : 'Open Now'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700">{job.company}</span>
                      <span aria-hidden="true">·</span>
                      <span>{job.sector}</span>
                      <span aria-hidden="true">·</span>
                      <span>{job.location}</span>
                      <span aria-hidden="true">·</span>
                      <span>{job.workMode}</span>
                    </div>

                    {/* Primary Title */}
                    <h3 className="font-display text-lg font-semibold text-slate-900 leading-snug">
                      <button
                        type="button"
                        onClick={() => onOpenJob(job, 'overview')}
                        className="text-left hover:text-blue-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
                      >
                        {job.title}
                      </button>
                    </h3>

                    <p className="text-sm text-slate-600 line-clamp-2 max-w-3xl">
                      {job.summary}
                    </p>

                    {/* Clean unboxed skills & timeline footer */}
                    <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="text-slate-700">
                        {job.skills.slice(0, 4).join(' / ')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {isUpcoming
                          ? `Launches ${formatDateShort(job.launchDate)} (${countdown.label})`
                          : `Closes ${formatDateShort(job.applicationDeadline)}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {job.applicantCount} applied
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Tabular Salary + Crisp Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 lg:min-w-[210px]">
                    <div className="lg:text-right">
                      <p className="font-mono text-base font-medium text-slate-900 tabular-nums">
                        {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                      </p>
                      <p className="text-xs text-slate-500">{job.experienceLevel}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void onToggleSave(job.id)}
                        aria-label={
                          isSaved ? `Remove ${job.title} from saved` : `Save ${job.title}`
                        }
                        aria-pressed={isSaved}
                        className={`p-2 rounded-lg border transition-colors ${
                          isSaved
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Bookmark className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>

                      {isUpcoming && (
                        <button
                          type="button"
                          onClick={() => onOpenJob(job, 'alert')}
                          aria-label={`Set launch alert for ${job.title}`}
                          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <Bell className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenJob(job, 'overview')}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap transition-colors"
                      >
                        {isUpcoming ? 'Inspect & Pre-Register' : 'View & Apply'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured Future Sectors Spotlight */}
      <section aria-labelledby="sectors-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              id="sectors-heading"
              className="font-display text-xl font-semibold tracking-tight text-slate-900"
            >
              Featured Future Sectors
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Select a frontier discipline to filter the job directory above.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SPOTLIGHT_SECTORS.map((item) => {
            const img = SECTOR_IMAGES[item.sector];
            const count = stats?.sectorCounts[item.sector] ?? 0;
            const isSelected = filters.sector === item.sector;
            return (
              <button
                key={item.sector}
                type="button"
                onClick={() => handleSectorSelect(item.sector)}
                className={`group text-left bg-white rounded-xl overflow-hidden border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isSelected
                    ? 'border-blue-600 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <EditorialImage
                    src={img.src}
                    alt={img.alt}
                    fallbackLabel={item.headline}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      {item.headline}
                    </h3>
                    <span className="font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap shrink-0">
                      {count} {count === 1 ? 'role' : 'roles'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
