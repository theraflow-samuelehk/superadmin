import type { SlotConfig } from "./ReminderConfigPanel";

export const GLOW_UP_APP_BASE_URL = "https://glow-up.it/app";

export const DEFAULT_SLOTS: SlotConfig[] = [
  { key: "morning", label: "Mattina", hour: 8, enabled: true, isNextDay: false, aptStartHour: 8, aptEndHour: 13 },
  { key: "midday", label: "Mezzogiorno", hour: 12, enabled: true, isNextDay: false, aptStartHour: 13, aptEndHour: 17 },
  { key: "afternoon", label: "Pomeriggio", hour: 16, enabled: true, isNextDay: false, aptStartHour: 17, aptEndHour: 24 },
  { key: "evening", label: "Sera", hour: 19, enabled: true, isNextDay: true },
];

/**
 * Time ranges for each slot: appointments in [startHour, endHour)
 * Evening slot = all of tomorrow
 */
export function getSlotTimeRange(slot: SlotConfig, allSlots: SlotConfig[]): { startHour: number; endHour: number } | null {
  if (slot.isNextDay) return null; // all day

  // Use explicit aptStartHour/aptEndHour if defined
  if (slot.aptStartHour != null && slot.aptEndHour != null) {
    return { startHour: slot.aptStartHour, endHour: slot.aptEndHour };
  }

  // Legacy fallback: derive from slot positions
  const enabledToday = allSlots
    .filter(s => s.enabled && !s.isNextDay)
    .sort((a, b) => a.hour - b.hour);
  const idx = enabledToday.findIndex(s => s.key === slot.key);
  if (idx === -1) return null;
  const startHour = slot.aptStartHour ?? slot.hour;
  const nextSlot = enabledToday[idx + 1];
  const endHour = slot.aptEndHour ?? (nextSlot ? nextSlot.hour : 24);
  return { startHour, endHour };
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "39" + cleaned.substring(1);
  if (!cleaned.startsWith("+") && !cleaned.startsWith("39")) cleaned = "39" + cleaned;
  cleaned = cleaned.replace("+", "");
  const normalizedMessage = decodeUrlEncodedChunks(message);
  // Use api.whatsapp.com instead of wa.me to preserve emoji characters
  return `https://api.whatsapp.com/send/?phone=${cleaned}&text=${encodeURIComponent(normalizedMessage)}`;
}

export function buildSmsUrl(phone: string, message: string): string {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "+39" + cleaned.substring(1);
  if (!cleaned.startsWith("+")) cleaned = "+39" + cleaned;
  return `sms:${cleaned}?body=${encodeURIComponent(message)}`;
}

export function decodeUrlEncodedChunks(text: string): string {
  return text.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
    try {
      return decodeURIComponent(match);
    } catch {
      return match;
    }
  });
}

export function buildAppointmentActionUrl(appointmentId: string): string {
  return `${GLOW_UP_APP_BASE_URL}/${appointmentId}`;
}

export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  // 1. Resolve conditional blocks: {{#field}}content{{/field}}
  let result = template.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_match, field, content) => {
      const value = vars[field];
      return value && value.trim() !== "" ? content : "";
    }
  );
  // 2. Replace variables
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  // 3. Decode percent-encoded chunks so templates can contain emoji URL codes like %E2%9C%85
  result = decodeUrlEncodedChunks(result);
  // 4. Clean up multiple blank lines left by removed conditionals
  result = result.replace(/\n{3,}/g, "\n\n").trim();
  return result;
}
