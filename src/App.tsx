/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OfflineProvider } from './context/OfflineContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Findings } from './pages/Findings';
import { FindingInvestigation } from './pages/FindingInvestigation';
import { Portfolio } from './pages/Portfolio';
import { EvidenceRegistry } from './pages/EvidenceRegistry';
import { Analytics } from './pages/Analytics';
import { Assessments } from './pages/Assessments';
import { Reports } from './pages/Reports';
import { AuditTrail } from './pages/AuditTrail';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <OfflineProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="findings" element={<Findings />} />
            <Route path="findings/:findingId" element={<FindingInvestigation />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="evidence" element={<EvidenceRegistry />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="assessments" element={<Assessments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit" element={<AuditTrail />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </OfflineProvider>
  );
}


