import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeatureFlag {
  key: string;
  is_enabled: boolean;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlags = async () => {
      const { data } = await supabase
        .from("feature_flags")
        .select("key, is_enabled")
        .is("deleted_at", null);

      const flagMap: Record<string, boolean> = {};
      (data || []).forEach((f: FeatureFlag) => {
        flagMap[f.key] = f.is_enabled;
      });
      setFlags(flagMap);
      setLoading(false);
    };
    fetchFlags();
  }, []);

  const isEnabled = (key: string): boolean => flags[key] ?? false;

  return { flags, isEnabled, loading };
}
