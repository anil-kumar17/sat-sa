import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  FileCheck2,
  FolderGit2,
  Lock,
  LineChart,
  FileText,
  FileClock,
  Sliders,
  Shield,
  X,
  Database
} from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { connectivityState, pendingCount, lastSyncTime, setIsQueueDrawerOpen } = useOffline();
  const navItems = [
    {
      to: '/',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: 'LIVE',
      badgeColor: 'bg-[#151b2b] text-[#4cd7f6] border border-[#4cd7f6]/30',
      end: true
    },
    {
      to: '/portfolio',
      label: 'CSE Portfolio',
      icon: FolderGit2,
      badge: '42 Total',
      badgeColor: 'bg-[#191f2f] text-[#c3c6d7]'
    },
    {
      to: '/findings',
      label: 'Findings',
      icon: ShieldAlert,
      badge: '18 Flagged',
      badgeColor: 'bg-[#93000a]/40 text-[#ffb4ab] font-semibold border border-[#ef4444]/30'
    },
    {
      to: '/evidence',
      label: 'Evidence',
      icon: Lock,
      badge: 'Registry',
      badgeColor: 'text-[#8d90a0]'
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: LineChart,
      badge: 'Models',
      badgeColor: 'text-[#8d90a0]'
    },
    {
      to: '/assessments',
      label: 'Assessments',
      icon: FileCheck2,
      badge: 'C14',
      badgeColor: 'text-[#4cd7f6] font-mono'
    },
    {
      to: '/reports',
      label: 'Reports',
      icon: FileText,
      badge: 'Dossiers',
      badgeColor: 'text-[#8d90a0]'
    },
    {
      to: '/audit',
      label: 'Audit Trail',
      icon: FileClock,
      badge: 'SYNCED',
      badgeColor: 'text-[#03b5d3] font-semibold'
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Sliders
    }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none bg-[#080e1d] border-r border-[#1E293B]">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand / Title Header */}
        <div className="h-16 px-5 flex items-center justify-between bg-[#080e1d] border-b border-[#1E293B]/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#131B2E] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shadow-sm">
              <Shield className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base text-[#dde2f7] tracking-tight font-semibold">SAT-SA</span>
              <span className="text-[10px] font-mono text-[#8d90a0] tracking-wider uppercase">Supervisory Analytics</span>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#8d90a0] hover:text-[#dde2f7] rounded"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Section Navigation */}
        <div className="px-3 py-3 overflow-y-auto flex-1">
          <div className="px-3 py-1 mb-1.5 text-[10px] font-mono text-[#8d90a0] tracking-wider uppercase">
            Inspection Matrix
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 rounded text-xs transition-colors ${
                      isActive
                        ? 'bg-[#1A243B] text-[#dde2f7] font-semibold border-l-2 border-[#38BDF8]'
                        : 'text-[#c3c6d7] hover:bg-[#151b2b] hover:text-[#dde2f7]'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#8d90a0] group-hover:text-[#dde2f7] transition-colors" />
                    <span className="text-[13px]">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        item.badgeColor || 'text-[#8d90a0]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sensitive Supervisory Footer Card with Local Vault Sync Status */}
      <div className="p-3 m-3 rounded bg-[#131B2E] border border-[#1E293B] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connectivityState === 'ONLINE'
                  ? 'bg-[#10b981]'
                  : connectivityState === 'SYNCING'
                  ? 'bg-[#38BDF8] animate-spin'
                  : 'bg-[#f59e0b]'
              }`}
            />
            <span className="text-[10px] font-mono text-[#dde2f7] tracking-wider uppercase font-semibold">
              LOCAL VAULT // {connectivityState}
            </span>
          </div>
          {pendingCount > 0 && (
            <button
              onClick={() => setIsQueueDrawerOpen(true)}
              className="px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#ffb4ab] border border-[#ef4444]/30 text-[9px] font-mono font-bold hover:bg-[#ef4444]/30"
            >
              {pendingCount} PENDING
            </button>
          )}
        </div>
        <div className="text-[10px] font-mono text-[#8d90a0] flex items-center justify-between">
          <span>Last Sync</span>
          <span className="text-[#c3c6d7]">{lastSyncTime || '09:42 UTC'}</span>
        </div>
        <button
          onClick={() => setIsQueueDrawerOpen(true)}
          className="w-full py-1 px-2 rounded bg-[#090D16] hover:bg-[#1A243B] border border-[#1E293B] text-[10px] font-mono text-[#4cd7f6] hover:text-white flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            <span>Sync Queue</span>
          </span>
          <span className="text-[9px] text-[#8d90a0]">Inspect →</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-72 z-50">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
