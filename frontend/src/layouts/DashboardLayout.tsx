import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";
import OfflineBanner from "../components/ui/OfflineBanner";
import PWAInstallBanner from "../components/ui/PWAInstallBanner";

const pagetitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/recipients": "Recipients",
  "/import": "Import Recipients",
  "/audience": "Audience Segmentation",
  "/master-data": "Master Data",
  "/campaigns": "Campaigns",
  "/campaigns/wizard": "Create Campaign",
  "/templates": "Templates",
  "/content-library": "Content Library",
  "/scheduling": "Campaign Scheduling",
  "/analytics": "Engagement Analytics",
  "/system-flow": "System Architecture & Flow",
  "/architecture": "System Architecture & Flow",
  "/settings": "Settings",
};

const DashboardLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/campaigns/monitoring/")) {
      return "Campaign Monitoring";
    }
    if (path.includes("/recipients/") && path !== "/recipients") {
      return "Recipient Details";
    }
    if (path.includes("/audience/segment/")) {
      return "Segment Preview";
    }
    return pagetitles[path] || "Dashboard";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 left-0 w-72 max-w-xs shadow-2xl transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <OfflineBanner />
        <PWAInstallBanner />
        <TopBar
          pageTitle={getTitle()}
          onMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
