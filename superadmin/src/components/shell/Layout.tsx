import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { create } from "zustand";
import type { User, Workspace } from "../../lib/mock";

interface ImpersonationState {
  user: User | null;
  workspace: Workspace | null;
  enter: (user: User, workspace: Workspace) => void;
  exit: () => void;
}

export const useImpersonation = create<ImpersonationState>((set) => ({
  user: null,
  workspace: null,
  enter: (user, workspace) => set({ user, workspace }),
  exit: () => set({ user: null, workspace: null }),
}));

export function Layout() {
  const { user, workspace, exit } = useImpersonation();

  return (
    <div className="flex min-h-screen text-ink-100 selection:bg-acid selection:text-ink-950">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ImpersonationBanner user={user} workspace={workspace} onExit={exit} />
        <Topbar />
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
