import { createContext, useContext, ReactNode } from "react";

interface EmbeddedContextValue {
  embedded: boolean;
  salonUserId?: string;
}

const EmbeddedContext = createContext<EmbeddedContextValue>({ embedded: false });

export function EmbeddedProvider({ embedded, salonUserId, children }: { embedded: boolean; salonUserId?: string; children: ReactNode }) {
  return <EmbeddedContext.Provider value={{ embedded, salonUserId }}>{children}</EmbeddedContext.Provider>;
}

export function useEmbedded() {
  return useContext(EmbeddedContext).embedded;
}

/** Returns the salon owner's user_id when in operator portal, undefined otherwise */
export function useSalonOwnerId() {
  return useContext(EmbeddedContext).salonUserId;
}
