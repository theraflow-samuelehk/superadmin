import { useT } from "../lang/LanguageContext";

export default function AnnouncementBar() {
  const { t } = useT();
  return (
    <div className="bg-ink text-cream-50 text-xs uppercase tracking-widest py-2.5 text-center font-medium">
      <span className="opacity-90">{t("announce.bar")}</span>
    </div>
  );
}
