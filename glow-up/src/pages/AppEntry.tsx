import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AppEntry() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    const resolveEntry = async () => {
      // Short codes are exactly 10 alphanumeric chars (not hex-only like tokens)
      const isShortCode = /^[A-Za-z0-9]{10}$/.test(token);
      if (isShortCode) {
        navigate(`/appointment-action/${token}`, { replace: true });
        return;
      }

      try {
        const edgeFnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-booking`;
        const res = await fetch(`${edgeFnUrl}?slug=${encodeURIComponent(token)}&action=info`);

        if (res.ok) {
          navigate(`/prenota/${token}`, { replace: true });
          return;
        }
      } catch {
        // fall through to appointment-action
      }

      navigate(`/appointment-action/${token}`, { replace: true });
    };

    resolveEntry();
  }, [navigate, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
