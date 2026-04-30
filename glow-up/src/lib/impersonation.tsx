import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface ImpersonatedRetailer {
  id: string;         // profile id
  user_id: string;    // auth user_id of the salon owner
  salon_name: string;
}

interface ImpersonationContextType {
  impersonatedRetailer: ImpersonatedRetailer | null;
  startImpersonation: (retailer: ImpersonatedRetailer) => void;
  stopImpersonation: () => void;
  isImpersonating: boolean;
  /** Returns impersonated user_id if impersonating, otherwise null */
  effectiveUserId: string | null;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedRetailer, setImpersonatedRetailer] = useState<ImpersonatedRetailer | null>(null);
  const queryClient = useQueryClient();

  const startImpersonation = useCallback((retailer: ImpersonatedRetailer) => {
    // Clear ALL cached queries so stale data from a previous center is never shown
    queryClient.removeQueries();
    setImpersonatedRetailer(retailer);
  }, [queryClient]);

  const stopImpersonation = useCallback(() => {
    queryClient.removeQueries();
    setImpersonatedRetailer(null);
  }, [queryClient]);

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatedRetailer,
        startImpersonation,
        stopImpersonation,
        isImpersonating: impersonatedRetailer !== null,
        effectiveUserId: impersonatedRetailer?.user_id ?? null,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
