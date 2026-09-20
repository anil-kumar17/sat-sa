import React, { useEffect, useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  FileCheck2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useOffline } from '../../context/OfflineContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import {
  findingsRepository,
  submissionRepository,
  normalizedRecordRepository
} from '../../repositories';

interface NavbarProps {
  onOpenMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] =
    useState(false);

  const [findingCount, setFindingCount] = useState(0);
  const [submissionCount, setSubmissionCount] =
    useState(0);
  const [entityCount, setEntityCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);

  const navigate = useNavigate();

  const {
    connectivityState,
    lastSyncTime,
    pendingCount,
    setIsQueueDrawerOpen
  } = useOffline();

  useEffect(() => {
    let mounted = true;

    const loadWorkspaceSummary = async () => {
      try {
        const [
          findings,
          submissions,
          records
        ] = await Promise.all([
          findingsRepository.getAll(),
          submissionRepository.getAll(),
          normalizedRecordRepository.getAll()
        ]);

        if (!mounted) return;

        const entities = new Set(
          records
            .map(record => record.entityCode)
            .filter(Boolean)
        );

        setFindingCount(findings.length);
        setSubmissionCount(submissions.length);
        setEntityCount(entities.size);
        setRecordCount(records.length);
      } catch (error) {
        console.warn(
          'Failed to load workspace summary:',
          error
        );

        if (!mounted) return;

        setFindingCount(0);
        setSubmissionCount(0);
        setEntityCount(0);
        setRecordCount(0);
      }
    };

    loadWorkspaceSummary();

    const refreshInterval = window.setInterval(
      loadWorkspaceSummary,
      5000
    );

    const handleWindowFocus = () => {
      loadWorkspaceSummary();
    };

    const handlePageShow = () => {
      loadWorkspaceSummary();
    };

    window.addEventListener(
      'focus',
      handleWindowFocus
    );

    window.addEventListener(
      'pageshow',
      handlePageShow
    );

    return () => {
      mounted = false;

      window.clearInterval(refreshInterval);

      window.removeEventListener(
        'focus',
        handleWindowFocus
      );

      window.removeEventListener(
        'pageshow',
        handlePageShow
      );
    };
  }, []);

  const handleSearch = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (query) {
      navigate(
        `/findings?q=${encodeURIComponent(query)}`
      );
    }
  };

  const openFindings = () => {
    setShowNotifications(false);
    navigate('/findings');
  };

  const hasEvidence =
    submissionCount > 0 && recordCount > 0;

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-[#080e1d]/95 backdrop-blur-md z-40 px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between border-b border-[#1E293B]">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 text-[#8d90a0] hover:text-[#dde2f7] rounded hover:bg-[#151b2b]"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full ${
              connectivityState === 'ONLINE'
                ? 'bg-[#03b5d3]'
                : connectivityState === 'SYNCING'
                ? 'bg-[#38BDF8] animate-pulse'
                : 'bg-[#f59e0b]'
            } ring-4 ${
              connectivityState === 'ONLINE'
                ? 'ring-[#03b5d3]/20'
                : connectivityState === 'SYNCING'
                ? 'ring-[#38BDF8]/20'
                : 'ring-[#f59e0b]/20'
            }`}
          />

          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-[#dde2f7] font-semibold tracking-wide">
              Supervisory Workspace
            </span>

            <span className="text-[10px] font-mono text-[#8d90a0] hidden sm:block">
              Local evidence context
            </span>
          </div>
        </div>

        <div className="h-7 w-px bg-[#1E293B] hidden sm:block" />

        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] font-mono text-[#8d90a0]">
            Last sync
          </span>

          <span className="text-[11px] font-mono text-[#dde2f7]">
            {lastSyncTime || 'Not synchronized'}
          </span>
        </div>

        <div className="h-7 w-px bg-[#1E293B] hidden md:block" />

        <button
          onClick={() => setIsQueueDrawerOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-all border ${
            connectivityState === 'ONLINE'
              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/25'
              : connectivityState === 'SYNCING'
              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30 hover:bg-[#38BDF8]/25 animate-pulse'
              : 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30 hover:bg-[#f59e0b]/25'
          }`}
          title={`Network: ${connectivityState} • Click to inspect local sync status`}
        >
          {connectivityState === 'ONLINE' ? (
            <Wifi className="w-3 h-3" />
          ) : connectivityState === 'SYNCING' ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}

          <span>{connectivityState}</span>

          {pendingCount > 0 && (
            <span className="ml-0.5 px-1 py-0.2 rounded bg-[#ef4444] text-white text-[9px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <div className="h-7 w-px bg-[#1E293B] hidden lg:block" />

        <div className="hidden lg:flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[#8d90a0]">
              Assessment Context
            </span>

            <span className="text-[11px] font-mono text-[#dde2f7]">
              {submissionCount} submission
              {submissionCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[#8d90a0]">
              Represented Entities
            </span>

            <span className="text-[11px] font-mono text-[#dde2f7]">
              {entityCount}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-[#8d90a0]">
              Findings
            </span>

            <span className="text-[11px] font-mono text-[#dde2f7]">
              {findingCount}
            </span>
          </div>
        </div>

        <div className="h-7 w-px bg-[#1E293B] hidden xl:block" />

        <div
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded border ${
            hasEvidence
              ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'
              : 'bg-[#131B2E] border-[#1E293B] text-[#8d90a0]'
          }`}
        >
          {hasEvidence ? (
            <FileCheck2 className="w-3 h-3" />
          ) : (
            <Database className="w-3 h-3" />
          )}

          <span className="text-[10px] font-mono font-semibold">
            {hasEvidence
              ? 'Evidence Available'
              : 'No Evidence Loaded'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        <PWAInstallButton />

        <form
          onSubmit={handleSearch}
          className="relative hidden md:block"
        >
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8d90a0]" />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search findings..."
            className="w-40 lg:w-56 pl-8 pr-3 py-1 rounded bg-[#090D16] border border-[#1E293B] text-[12px] text-[#dde2f7] placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
          />
        </form>

        <div className="relative">
          <button
            onClick={() =>
              setShowNotifications(
                !showNotifications
              )
            }
            className="p-2 text-[#8d90a0] hover:text-[#dde2f7] rounded hover:bg-[#131B2E] transition-colors relative"
            title="Supervisory Findings"
            aria-label="Supervisory Findings"
          >
            <Bell className="w-4 h-4" />

            {findingCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded bg-[#131B2E] border border-[#334155] shadow-xl p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] mb-2 font-mono text-[11px]">
                <span className="font-semibold text-[#dde2f7]">
                  Supervisory Findings
                </span>

                <span className="text-[#8d90a0] font-semibold">
                  {findingCount} stored
                </span>
              </div>

              {findingCount > 0 ? (
                <button
                  onClick={openFindings}
                  className="w-full text-left p-3 rounded bg-[#090D16] hover:bg-[#1A243B] border border-[#1E293B] transition-colors"
                >
                  <div className="text-[10px] font-mono text-[#4cd7f6] font-bold">
                    FINDINGS REGISTRY
                  </div>

                  <div className="text-[11px] text-[#dde2f7] mt-1 font-medium">
                    {findingCount} persisted finding
                    {findingCount === 1
                      ? ''
                      : 's'} available for supervisory review.
                  </div>

                  <div className="text-[10px] text-[#8d90a0] mt-2 font-mono">
                    Open Findings Management →
                  </div>
                </button>
              ) : (
                <div className="p-3 rounded bg-[#090D16] border border-[#1E293B]">
                  <div className="text-[10px] font-mono text-[#8d90a0]">
                    NO PERSISTED FINDINGS
                  </div>

                  <div className="text-[11px] text-[#dde2f7] mt-1">
                    No findings are currently available in the local vault.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-[#1E293B]" />

        <div className="flex items-center gap-2.5">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-[13px] font-semibold text-[#dde2f7] tracking-tight">
              Supervisory Review
            </span>

            <span className="text-[10px] font-mono text-[#8d90a0]">
              Human decision workflow
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#1A243B] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] font-mono text-xs font-semibold shadow-inner">
            SR
          </div>
        </div>
      </div>
    </header>
  );
};