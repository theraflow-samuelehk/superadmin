import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export function formatCurrency(n: number, currency = "€"): string {
  return currency + n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function relativeTime(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return Math.floor(diff) + "s fa";
  if (diff < 3600) return Math.floor(diff / 60) + "m fa";
  if (diff < 86400) return Math.floor(diff / 3600) + "h fa";
  if (diff < 604800) return Math.floor(diff / 86400) + "g fa";
  return Math.floor(diff / 604800) + "sett fa";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
