/**
 * WorkspaceService — astrazione dati workspace.
 * Oggi usa mock.ts. Domani: sostituisci con fetch() verso API reale.
 * I componenti non devono cambiare — cambiano solo queste funzioni.
 */

import {
  workspaces,
  getWorkspace,
  projectsByWorkspace,
  membersByWorkspace,
  activityByWorkspace,
  type Workspace,
} from "../lib/mock";

export const WorkspaceService = {
  /** Tutti i workspace della piattaforma */
  getAll: (): Workspace[] => workspaces,

  /** Workspace per ID */
  getById: (id: string) => getWorkspace(id),

  /** Progetti di un workspace */
  getProjects: (id: string) => projectsByWorkspace(id),

  /** Membri di un workspace */
  getMembers: (id: string) => membersByWorkspace(id),

  /** Attività di un workspace */
  getActivity: (id: string) => activityByWorkspace(id),

  // -- Future API calls (esempio):
  // getAll: async (): Promise<Workspace[]> => {
  //   const res = await fetch(`${import.meta.env.VITE_API_URL}/workspaces`);
  //   return res.json();
  // },
};
