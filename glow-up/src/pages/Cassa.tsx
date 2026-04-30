import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEmbedded } from "@/contexts/EmbeddedContext";
import CassaContent from "@/components/CassaContent";

/**
 * Legacy /cassa route — redirects to /report?tab=cassa
 * preserving any appointment query params.
 * In embedded mode (operator portal), renders CassaContent directly.
 */
export default function Cassa() {
  const embedded = useEmbedded();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!embedded) {
      const params = new URLSearchParams(searchParams);
      params.set("tab", "cassa");
      navigate(`/report?${params.toString()}`, { replace: true });
    }
  }, [embedded]);

  if (embedded) {
    return <CassaContent />;
  }

  return null;
}
