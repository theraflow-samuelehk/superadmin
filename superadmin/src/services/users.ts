/**
 * UserService — astrazione dati utenti.
 */

import { users, getUser, type User } from "../lib/mock";

export const UserService = {
  /** Tutti gli utenti */
  getAll: (): User[] => users,

  /** Utente per ID */
  getById: (id: string) => getUser(id),

  /** Super admin */
  getSuperAdmins: () => users.filter((u) => u.role === "superadmin"),

  /** Admin di workspace */
  getAdmins: () => users.filter((u) => u.role === "admin"),

  /** Staff */
  getStaff: () => users.filter((u) => u.role === "staff"),

  // -- Future API calls:
  // getAll: async (): Promise<User[]> => {
  //   const res = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
  //     headers: { Authorization: `Bearer ${getToken()}` },
  //   });
  //   return res.json();
  // },
};
