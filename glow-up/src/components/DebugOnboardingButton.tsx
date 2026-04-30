import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function DebugOnboardingButton() {
  const { user } = useAuth();
  const [resetting, setResetting] = useState(false);

  if (!user) return null;

  const handleReset = async () => {
    setResetting(true);
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_phase: 0 } as any)
      .eq("user_id", user.id);
    setResetting(false);
    if (error) { toast.error(error.message); return; }
    localStorage.setItem(`debug_onboarding_replay_${user.id}`, "1");
    localStorage.removeItem(`agenda_tour_seen_${user.id}`);
    window.dispatchEvent(new CustomEvent("glowup:onboarding-debug-reset"));
    toast.success("Onboarding riavviato!");
  };

  return (
    <button
      onClick={handleReset}
      disabled={resetting}
      className="fixed bottom-20 left-3 z-[9000] h-8 w-8 rounded-full bg-muted/80 border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
      title="Debug: riavvia onboarding"
    >
      {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}
