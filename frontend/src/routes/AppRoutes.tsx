import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardHome from "../pages/Dashboard/DashboardHome";
import RecipientsPage from "../pages/Recipients/RecipientsPage";
import RecipientDetailPage from "../pages/Recipients/RecipientDetailPage";
import ImportRecipientsPage from "../pages/ImportRecipients/ImportRecipientsPage";
import AudiencePage from "../pages/Audience/AudiencePage";
import SegmentPreviewPage from "../pages/Audience/SegmentPreviewPage";
import MasterDataPage from "../pages/MasterData/MasterDataPage";
import CampaignsPage from "../pages/Campaigns/CampaignsPage";
import CampaignWizardPage from "../pages/Campaigns/CampaignWizardPage";
import CampaignMonitoringPage from "../pages/Campaigns/CampaignMonitoringPage";
import SchedulingPage from "../pages/Scheduling/SchedulingPage";
import AnalyticsDashboardPage from "../pages/Analytics/AnalyticsDashboardPage";
import TemplatesPage from "../pages/Templates/TemplatesPage";
import TeamManagementPage from "../pages/Settings/TeamManagementPage";
import ComingSoonPage from "../components/ui/ComingSoonPage";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="recipients">
          <Route index element={<RecipientsPage />} />
          <Route path=":id" element={<RecipientDetailPage />} />
        </Route>
        <Route path="import" element={<ImportRecipientsPage />} />
        <Route path="audience" element={<AudiencePage />} />
        <Route path="audience/segment/:segmentId/preview" element={<SegmentPreviewPage />} />
        <Route path="master-data" element={<MasterDataPage />} />
        <Route path="campaigns">
          <Route index element={<CampaignsPage />} />
          <Route path="wizard" element={<CampaignWizardPage />} />
          <Route path="new" element={<CampaignWizardPage />} />
          <Route path="monitoring/:id" element={<CampaignMonitoringPage />} />
          <Route path=":id/monitor" element={<CampaignMonitoringPage />} />
        </Route>
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="content-library" element={<ComingSoonPage title="Content Library" description="Content library functionality is not yet implemented." />} />
        <Route path="scheduling" element={<SchedulingPage />} />
        <Route path="analytics" element={<AnalyticsDashboardPage />} />
        <Route path="team" element={<TeamManagementPage />} />
        <Route path="settings" element={<TeamManagementPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
