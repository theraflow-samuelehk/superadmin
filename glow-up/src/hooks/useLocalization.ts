import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface LocalizationConfig {
  timezone: string;
  currency: string;
  language: string;
}

const defaultConfig: LocalizationConfig = {
  timezone: "Europe/Rome",
  currency: "EUR",
  language: "it",
};

export function useLocalization(config: Partial<LocalizationConfig> = {}) {
  const { i18n } = useTranslation();
  const merged = { ...defaultConfig, ...config, language: i18n.language };

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString(merged.language, {
        timeZone: merged.timezone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...options,
      });
    },
    [merged.language, merged.timezone]
  );

  const formatTime = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleTimeString(merged.language, {
        timeZone: merged.timezone,
        hour: "2-digit",
        minute: "2-digit",
        ...options,
      });
    },
    [merged.language, merged.timezone]
  );

  const formatCurrency = useCallback(
    (amount: number) => {
      return new Intl.NumberFormat(merged.language, {
        style: "currency",
        currency: merged.currency,
      }).format(amount);
    },
    [merged.language, merged.currency]
  );

  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(merged.language, options).format(num);
    },
    [merged.language]
  );

  return {
    formatDate,
    formatTime,
    formatCurrency,
    formatNumber,
    language: merged.language,
    currency: merged.currency,
    timezone: merged.timezone,
  };
}
