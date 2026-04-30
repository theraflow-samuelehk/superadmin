import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

export interface GuideStep {
  description: string;
  query: string;
  mode?: "click" | "interact";
}

interface SpotlightCtx {
  steps: GuideStep[];
  currentStep: number;
  startGuide: (steps: GuideStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  dismiss: () => void;
  requestDismiss: () => void;
  confirmDismiss: () => void;
  cancelDismiss: () => void;
  showDismissConfirm: boolean;
  onGuideEndRef: React.MutableRefObject<(() => void) | null>;
  // Legacy single highlight
  targetId: string | null;
  highlight: (id: string) => void;
}

const Ctx = createContext<SpotlightCtx>({
  steps: [],
  currentStep: 0,
  startGuide: () => {},
  nextStep: () => {},
  prevStep: () => {},
  dismiss: () => {},
  requestDismiss: () => {},
  confirmDismiss: () => {},
  cancelDismiss: () => {},
  showDismissConfirm: false,
  onGuideEndRef: { current: null },
  targetId: null,
  highlight: () => {},
});

export function SpotlightProvider({ children }: { children: ReactNode }) {
  const [steps, setSteps] = useState<GuideStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);
  const onGuideEndRef = useRef<(() => void) | null>(null);

  const fireGuideEnd = useCallback(() => {
    onGuideEndRef.current?.();
  }, []);

  const startGuide = useCallback((newSteps: GuideStep[]) => {
    setSteps(newSteps);
    setCurrentStep(0);
    setTargetId(null);
    setShowDismissConfirm(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= steps.length) {
        setSteps([]);
        setTimeout(fireGuideEnd, 100);
        return 0;
      }
      return next;
    });
  }, [steps.length, fireGuideEnd]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const dismiss = useCallback(() => {
    setSteps([]);
    setCurrentStep(0);
    setTargetId(null);
    setShowDismissConfirm(false);
  }, []);

  const requestDismiss = useCallback(() => {
    if (steps.length > 0) {
      setShowDismissConfirm(true);
    } else {
      setSteps([]);
      setCurrentStep(0);
      setTargetId(null);
    }
  }, [steps.length]);

  const confirmDismiss = useCallback(() => {
    setSteps([]);
    setCurrentStep(0);
    setTargetId(null);
    setShowDismissConfirm(false);
    setTimeout(fireGuideEnd, 100);
  }, [fireGuideEnd]);

  const cancelDismiss = useCallback(() => {
    setShowDismissConfirm(false);
  }, []);

  const highlight = useCallback((id: string) => {
    setTargetId(id);
    setSteps([]);
    setShowDismissConfirm(false);
  }, []);

  return (
    <Ctx.Provider value={{ steps, currentStep, startGuide, nextStep, prevStep, dismiss, requestDismiss, confirmDismiss, cancelDismiss, showDismissConfirm, onGuideEndRef, targetId, highlight }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSpotlight() {
  return useContext(Ctx);
}
