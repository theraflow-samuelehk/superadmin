/**
 * i18n — sistema traduzioni TheraFlow
 *
 * Uso base:   t("nav.overview")
 * Con vars:   t("overview.workspaces_section_desc", { count: 7 })
 * Cambia lang: setLocale("en")
 *
 * Per aggiungere una lingua:
 *   1. Copia src/i18n/it.json → src/i18n/en.json (o altra lingua)
 *   2. Traduci i valori (non le chiavi)
 *   3. Importa il JSON qui sotto e aggiungilo a `translations`
 */

import it from "../i18n/it.json";
import en from "../i18n/en.json";

export type Locale = "it" | "en";

// Aggiunge qui le nuove lingue quando servono
const translations: Record<Locale, Record<string, unknown>> = { it, en };

let currentLocale: Locale = "it";

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Risolve una chiave dot-notation nel dizionario corrente.
 * Fallback: prova italiano, poi restituisce la chiave stessa.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = translations[currentLocale] ?? translations.it;

  const resolve = (obj: Record<string, unknown>, parts: string[]): string => {
    const val = (obj as Record<string, unknown>)[parts[0]];
    if (parts.length === 1) return typeof val === "string" ? val : key;
    if (val && typeof val === "object") return resolve(val as Record<string, unknown>, parts.slice(1));
    return key;
  };

  let result = resolve(dict as Record<string, unknown>, key.split("."));

  // Fallback a italiano se la chiave manca nella lingua attiva
  if (result === key && currentLocale !== "it") {
    result = resolve(translations.it as Record<string, unknown>, key.split("."));
  }

  // Sostituzione variabili: {{nome}} → valore
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
    });
  }

  return result;
}
