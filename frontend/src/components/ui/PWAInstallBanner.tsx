import { useState } from "react";
import { usePWAInstall } from "../../hooks/usePWAInstall";

export default function PWAInstallBanner() {
  const { isInstallable, installApp, dismissPrompt } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    await installApp();
    setIsInstalling(false);
  };

  return (
    <div className="border-b border-sky-200 bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 px-4 py-3 text-white shadow-sm transition-all sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/30">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold">Install Public Awareness Platform</p>
            <p className="text-xs text-sky-100">
              Install as a standalone app on your desktop or mobile device for faster access and offline shell support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition-all hover:bg-sky-50 active:scale-95 disabled:opacity-50"
          >
            {isInstalling ? "Installing..." : "Install App"}
          </button>
          <button
            onClick={dismissPrompt}
            className="rounded-lg p-1.5 text-sky-200 hover:bg-white/10 hover:text-white"
            title="Dismiss"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
