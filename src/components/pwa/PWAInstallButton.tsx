import React, { useState } from 'react';
import { Download, MonitorCheck, X } from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installPWA } = useOffline();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If running in standalone or already installed
  if (isInstalled) {
    return (
      <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-[10px] font-mono text-[#10b981]" title="Running as installed Progressive Web App">
        <MonitorCheck className="w-3.5 h-3.5 text-[#10b981]" />
        <span>PWA Active</span>
      </div>
    );
  }

  // Desktop / Chromium / Android install prompt
  if (isInstallable) {
    return (
      <button
        onClick={installPWA}
        className="px-2.5 py-1 rounded bg-[#131B2E] hover:bg-[#1A243B] text-[#4cd7f6] hover:text-white border border-[#38BDF8]/40 hover:border-[#38BDF8] text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all shadow-xs"
        title="Install SAT-SA as a desktop/mobile application with offline capabilities"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install PWA</span>
      </button>
    );
  }

  // iOS Safari guidance
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="px-2 py-1 rounded bg-[#131B2E] text-[#8d90a0] hover:text-[#dde2f7] border border-[#1E293B] text-[10px] font-mono"
          title="Install SAT-SA on iOS Home Screen"
        >
          Install iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded bg-[#131B2E] border border-[#1E293B] p-5 shadow-2xl space-y-3 font-mono text-xs text-[#dde2f7]">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                <span className="font-semibold text-sm">Install SAT-SA on iOS</span>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-[#8d90a0] hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-[#8d90a0] font-sans leading-relaxed">
                To install SAT-SA for full offline access on iPhone / iPad:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#c3c6d7] font-sans">
                <li>Tap the <strong>Share</strong> button in Safari's toolbar.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-[#2563eb] text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
