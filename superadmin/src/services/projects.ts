/**
 * ProjectService — astrazione dati progetti.
 */

import { projects, type Project } from "../lib/mock";

export const ProjectService = {
  /** Tutti i progetti della piattaforma */
  getAll: (): Project[] => projects,

  /** Progetti per workspace */
  getByWorkspace: (workspaceId: string) =>
    projects.filter((p) => p.workspaceId === workspaceId),

  /** Progetto per ID */
  getById: (id: string) => projects.find((p) => p.id === id),

  /** Progetti live */
  getLive: () => projects.filter((p) => p.status === "live"),

  // -- Future API calls:
  // getAll: async (): Promise<Project[]> => {
  //   const res = await fetch(`${import.meta.env.VITE_API_URL}/projects`);
  //   return res.json();
  // },
};
