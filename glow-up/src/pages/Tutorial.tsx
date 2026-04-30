import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import PortalTutorials from "@/components/portal/PortalTutorials";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

export default function Tutorial() {
  const { isEnabled, loading } = useFeatureFlags();

  if (!loading && !isEnabled("tutorials_portal_enabled")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <PortalTutorials />
      </div>
    </DashboardLayout>
  );
}
