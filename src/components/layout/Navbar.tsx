import React, { useState } from 'react';
import { ShieldCheck, Search, Bell, Menu, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOffline } from '../../context/OfflineContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface NavbarProps {
  onOpenMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const {
    connectivityState,
    lastSyncTime,
    pendingCount,
    setIsQueueDrawerOpen
  } = useOffline();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/findings?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-[#080e1d]/95 backdrop-blur-md z-40 px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between border-b border-[#1E293B]">
      {/* Left items: Window Active, Last Sync, Connectivity state, Cycle info */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 text-[#8d90a0] hover:text-[#dde2f7] rounded hover:bg-[#151b2b]"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Telemetry Active Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#03b5d3] ring-4 ring-[#03b5d3]/20 animate-pulse"></div>
          <div className="flex flex-col">
            <span className="text-[11px] font-mono text-[#dde2f7] font-semibold tracking-wide">
              Assessment Window Active
            </span>
            <span className="text-[10px] font-mono text-[#8d90a0] hidden sm:block">
              Telemetry Snapshot Sealed
            </span>
          </div>
        </div>

        <div className="h-7 w-px bg-[#1E293B] hidden sm:block"></div>

        {/* Last Synchronized Indicator (Separate from Assessment Window) */}
        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] font-mono text-[#8d90a0]">
            Last sync
          </span>
          <span className="text-[11px] font-mono text-[#dde2f7]">
            {lastSyncTime || 'Not synchronized'}
          </span>
        </div>

        <div className="h-7 w-px bg-[#1E293B] hidden md:block"></div>

        {/* Connectivity State Badge (Subtle & Professional) */}
        <button
          onClick={() => setIsQueueDrawerOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-all border ${
            connectivityState === 'ONLINE'
              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/25'
              : connectivityState === 'SYNCING'
              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30 hover:bg-[#38BDF8]/25 animate-pulse'
              : 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30 hover:bg-[#f59e0b]/25'
          }`}
          title={`Network: ${connectivityState} • Click to inspect sync queue & offline status`}
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

        <div className="h-7 w-px bg-[#1E293B] hidden lg:block"></div>

        {/* Audit Period */}
        <div className="hidden lg:flex flex-col">
          <span className="text-[11px] font-mono text-[#dde2f7] tracking-tight">
            Q1-2025 Audit Period (Cycle 14)
          </span>
          <span className="text-[10px] font-mono text-[#8d90a0]">
            84 CSE Submissions Sealed
          </span>
        </div>

        <div className="h-7 w-px bg-[#1E293B] hidden xl:block"></div>

        {/* Hash Seal Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131B2E] border border-[#1E293B]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4cd7f6]" />
          <span className="text-[11px] font-mono text-[#4cd7f6] font-semibold">
            SHA-256 Verified
          </span>
        </div>
      </div>

      {/* Right items: PWA Install, Search, Alerts, Inspector Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* PWA In-App Install Prompt */}
        <PWAInstallButton />

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, CSEs, hashes..."
            className="w-40 lg:w-56 pl-8 pr-3 py-1 rounded bg-[#090D16] border border-[#1E293B] text-[12px] text-[#dde2f7] placeholder-[#8d90a0] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
          />
        </form>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-[#8d90a0] hover:text-[#dde2f7] rounded hover:bg-[#131B2E] transition-colors relative"
            title="Supervisory Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444]"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded bg-[#131B2E] border border-[#334155] shadow-xl p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] mb-2 font-mono text-[11px]">
                <span className="font-semibold text-[#dde2f7]">Supervisory Alerts</span>
                <span className="text-[#ef4444] font-semibold">2 Critical P0</span>
              </div>
              <div className="space-y-2">
                <div
                  onClick={() => {
                    navigate('/findings/FND-2025-014');
                    setShowNotifications(false);
                  }}
                  className="p-2 rounded bg-[#090D16] hover:bg-[#1A243B] cursor-pointer border border-[#ef4444]/30"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#ef4444] font-bold">FND-2025-014</span>
                    <span className="text-[#8d90a0]">Apex Interbank</span>
                  </div>
                  <div className="text-[11px] text-[#dde2f7] mt-0.5 font-medium">
                    Execution gap in escalation workflow
                  </div>
                </div>
                <div
                  onClick={() => {
                    navigate('/findings/FND-2025-012');
                    setShowNotifications(false);
                  }}
                  className="p-2 rounded bg-[#090D16] hover:bg-[#1A243B] cursor-pointer border border-[#ef4444]/30"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#ef4444] font-bold">FND-2025-012</span>
                    <span className="text-[#8d90a0]">Metro Power</span>
                  </div>
                  <div className="text-[11px] text-[#dde2f7] mt-0.5 font-medium">
                    Off-hours root token elevation without ticket
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-[#1E293B]"></div>

        {/* Inspector Profile */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-[13px] font-semibold text-[#dde2f7] tracking-tight">
              Dr. Aris Thorne
            </span>
            <span className="text-[10px] font-mono text-[#8d90a0]">
              Lead Supervisory Inspector • Oversight Team
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#1A243B] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] font-mono text-xs font-semibold shadow-inner">
            AT
          </div>
        </div>
      </div>
    </header>
  );
};
