import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary — cattura crash di componenti figli e mostra un fallback.
 * Avvolgi sezioni critiche (pagine, widget) per evitare che un crash
 * faccia saltare l'intera app.
 *
 * Uso:
 *   <ErrorBoundary>
 *     <ComponentePotenzialmenteRotto />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In produzione: invia a Sentry / LogRocket / custom logger
    console.error("[TheraFlow ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[320px] p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-[18px] font-bold text-slate-900 mb-2">
            Qualcosa è andato storto
          </h2>
          <p className="text-[13.5px] text-slate-500 max-w-sm mb-6 leading-relaxed">
            {this.state.error?.message || "Errore sconosciuto in questo componente."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[13px] font-semibold hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={13} /> Riprova
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
