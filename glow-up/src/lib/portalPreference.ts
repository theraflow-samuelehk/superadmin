type PortalType = "owner" | "client" | "operator";

const COOKIE_NAME = "preferred_portal";
const MAX_AGE = 31536000; // 365 days

export function setPortalPreference(portal: PortalType): void {
  try { localStorage.setItem(COOKIE_NAME, portal); } catch {}
  document.cookie = `${COOKIE_NAME}=${portal};path=/;max-age=${MAX_AGE};SameSite=Lax`;
}

export function getPortalPreference(): PortalType | null {
  try {
    const ls = localStorage.getItem(COOKIE_NAME);
    if (ls === "owner" || ls === "client" || ls === "operator") return ls;
  } catch {}
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  const val = match?.[1];
  if (val === "owner" || val === "client" || val === "operator") return val;
  return null;
}

export function clearPortalPreference(): void {
  try { localStorage.removeItem(COOKIE_NAME); } catch {}
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0;SameSite=Lax`;
}
