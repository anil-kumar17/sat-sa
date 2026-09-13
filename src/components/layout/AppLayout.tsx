import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { SyncQueueDrawer } from '../offline/SyncQueueDrawer';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090D16] text-[#dde2f7] flex">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 w-full">
        <Navbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 pt-16 bg-[#090D16] w-full min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Global Offline Sync Queue Inspector Drawer */}
      <SyncQueueDrawer />
    </div>
  );
};

