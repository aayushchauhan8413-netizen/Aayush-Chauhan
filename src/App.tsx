import { useCallback, useEffect, useState } from 'react';
import type {
  ActiveTab,
  ApplicationStatus,
  JobAdvertisement,
  JobAlert,
  JobApplication,
  JobFilterState,
  JobSector,
  PlatformStats,
} from './types';
import { api, type EmployerAuthStatus, type JobFormPayload } from './services/api';
import { TopBar } from './components/TopBar';
import { ExploreView } from './components/ExploreView';
import { UpcomingCalendarView } from './components/UpcomingCalendarView';
import { SavedAndAlertsView } from './components/SavedAndAlertsView';
import { MyApplicationsView } from './components/MyApplicationsView';
import { EmployerStudioView } from './components/EmployerStudioView';
import { JobDetailModal } from './components/JobDetailModal';

const DEFAULT_FILTERS: JobFilterState = {
  query: '',
  sector: 'All',
  hiringWindow: 'all',
  workMode: 'All',
  experienceLevel: 'All',
  sortBy: 'launch_soonest',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [filters, setFilters] = useState<JobFilterState>(DEFAULT_FILTERS);

  // Public & candidate data
  const [jobs, setJobs] = useState<JobAdvertisement[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'overview' | 'apply' | 'alert'>('overview');

  // Employer Studio state (Bearer token strictly kept in React memory, never localStorage)
  const [employerToken, setEmployerToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<EmployerAuthStatus | null>(null);
  const [employerJobs, setEmployerJobs] = useState<JobAdvertisement[]>([]);
  const [employerApplications, setEmployerApplications] = useState<JobApplication[]>([]);

  const refreshPublicData = useCallback(async () => {
    try {
      setLoadError(null);
      const [jobsData, statsData, savedData, alertsData, myAppsData] =
        await Promise.all([
          api.listJobs(false),
          api.getStats(),
          api.getSavedJobIds(),
          api.listAlerts(),
          api.listMyApplications(),
        ]);
      setJobs(jobsData);
      setStats(statsData);
      setSavedJobIds(savedData);
      setAlerts(alertsData);
      setMyApplications(myAppsData);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Unable to load job advertisements right now.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshEmployerData = useCallback(async (token: string | null) => {
    try {
      const status = await api.getEmployerAuthStatus(token);
      setAuthStatus(status);
      if (status.authenticated && token) {
        const [allJobs, allApps] = await Promise.all([
          api.listJobs(true, token),
          api.listEmployerApplications(token),
        ]);
        setEmployerJobs(allJobs);
        setEmployerApplications(allApps);
      } else {
        setEmployerJobs([]);
        setEmployerApplications([]);
      }
    } catch {
      setAuthStatus({ configured: false, usingEnvPasscode: false, authenticated: false });
    }
  }, []);

  useEffect(() => {
    void refreshPublicData();
  }, [refreshPublicData]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    if (activeTab === 'employer') {
      void refreshEmployerData(employerToken);
    }
  }, [activeTab, employerToken, refreshEmployerData]);

  const selectedJob =
    selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null;

  const handleOpenJob = (
    job: JobAdvertisement,
    mode: 'overview' | 'apply' | 'alert' = 'overview'
  ) => {
    setSelectedJobId(job.id);
    setModalMode(mode);
  };

  const handleToggleSave = async (jobId: string) => {
    const isCurrentlySaved = savedJobIds.includes(jobId);
    const updated = isCurrentlySaved
      ? await api.unsaveJob(jobId)
      : await api.saveJob(jobId);
    setSavedJobIds(updated);
  };

  const handleSubmitApplication = async (payload: {
    jobId: string;
    fullName: string;
    email: string;
    portfolioUrl: string;
    yearsExperience: number;
    coverNote: string;
  }) => {
    await api.submitApplication(payload);
    await refreshPublicData();
    if (employerToken) {
      await refreshEmployerData(employerToken);
    }
  };

  const handleCreateAlert = async (payload: {
    email: string;
    jobId?: string;
    sector?: JobSector | 'All Sectors';
    keyword?: string;
  }) => {
    await api.createAlert(payload);
    await refreshPublicData();
  };

  const handleDeleteAlert = async (alertId: string) => {
    await api.deleteAlert(alertId);
    await refreshPublicData();
  };

  const handleEmployerSetup = async (passcode: string) => {
    const token = await api.setupEmployerPasscode(passcode);
    setEmployerToken(token);
    await refreshEmployerData(token);
  };

  const handleEmployerLogin = async (passcode: string) => {
    const token = await api.loginEmployer(passcode);
    setEmployerToken(token);
    await refreshEmployerData(token);
  };

  const handleEmployerLogout = async () => {
    await api.logoutEmployer(employerToken);
    setEmployerToken(null);
    await refreshEmployerData(null);
  };

  const handleCreateJob = async (payload: JobFormPayload) => {
    if (!employerToken) throw new Error('Employer session expired.');
    await api.createJob(payload, employerToken);
    await Promise.all([refreshPublicData(), refreshEmployerData(employerToken)]);
  };

  const handleUpdateJob = async (
    jobId: string,
    payload: Partial<JobFormPayload>
  ) => {
    if (!employerToken) throw new Error('Employer session expired.');
    await api.updateJob(jobId, payload, employerToken);
    await Promise.all([refreshPublicData(), refreshEmployerData(employerToken)]);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!employerToken) throw new Error('Employer session expired.');
    await api.deleteJob(jobId, employerToken);
    await Promise.all([refreshPublicData(), refreshEmployerData(employerToken)]);
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    status: ApplicationStatus
  ) => {
    if (!employerToken) throw new Error('Employer session expired.');
    await api.updateApplicationStatus(applicationId, status, employerToken);
    await Promise.all([refreshPublicData(), refreshEmployerData(employerToken)]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={savedJobIds.length}
        applicationsCount={myApplications.length}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {loadError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-4"
          >
            <p className="text-sm font-medium text-red-800">{loadError}</p>
            <button
              type="button"
              onClick={() => void refreshPublicData()}
              className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === 'explore' && (
          <ExploreView
            jobs={jobs}
            stats={stats}
            loading={loading}
            filters={filters}
            savedJobIds={savedJobIds}
            onChangeFilters={setFilters}
            onResetFilters={() => setFilters(DEFAULT_FILTERS)}
            onOpenJob={handleOpenJob}
            onToggleSave={handleToggleSave}
            onGoToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'calendar' && (
          <UpcomingCalendarView
            jobs={jobs}
            onOpenJob={handleOpenJob}
            onGoToExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'saved' && (
          <SavedAndAlertsView
            jobs={jobs}
            savedJobIds={savedJobIds}
            alerts={alerts}
            onOpenJob={handleOpenJob}
            onToggleSave={handleToggleSave}
            onCreateAlert={handleCreateAlert}
            onDeleteAlert={handleDeleteAlert}
            onGoToExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'applications' && (
          <MyApplicationsView
            applications={myApplications}
            onGoToExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'employer' && (
          <EmployerStudioView
            authStatus={authStatus}
            employerJobs={employerJobs}
            employerApplications={employerApplications}
            onSetupPasscode={handleEmployerSetup}
            onLogin={handleEmployerLogin}
            onLogout={handleEmployerLogout}
            onCreateJob={handleCreateJob}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-center sm:text-left">
            <p className="font-medium text-slate-700">
              HorizonJobs · Future Job Advertisements &amp; Upcoming Hiring Pipelines
            </p>
            <span aria-hidden="true" className="hidden sm:inline text-slate-300">·</span>
            <p className="font-medium text-slate-900">Made by Bittu Chauhan</p>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('explore')}
              className="hover:text-slate-900"
            >
              Directory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className="hover:text-slate-900"
            >
              Launch Calendar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('employer')}
              className="hover:text-slate-900"
            >
              Post a Job
            </button>
          </div>
        </div>
      </footer>

      <JobDetailModal
        job={selectedJob}
        initialMode={modalMode}
        isSaved={selectedJob ? savedJobIds.includes(selectedJob.id) : false}
        onClose={() => setSelectedJobId(null)}
        onToggleSave={handleToggleSave}
        onSubmitApplication={handleSubmitApplication}
        onCreateJobAlert={handleCreateAlert}
      />
    </div>
  );
}
