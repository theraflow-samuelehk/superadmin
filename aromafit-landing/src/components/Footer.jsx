import { Link } from "react-router-dom";
import { useT } from "../lang/LanguageContext";

export default function Footer() {
  const { t } = useT();
  return (
    <footer className="bg-ink text-cream-100/80 mt-32">
      <div className="container-x py-20">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <div className="font-display text-4xl text-cream-50">HUSH</div>
            <div className="text-xs uppercase tracking-widest text-rosegold-light mt-2">
              {t("footer.tagline")}
            </div>
            <p className="mt-6 text-sm leading-relaxed max-w-xs">
              {t("footer.about")}
            </p>
          </div>

          <div>
            <h4 className="text-cream-50 text-sm uppercase tracking-widest font-medium mb-5">
              {t("footer.shop")}
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/hush" className="hover:text-rosegold-light">{t("footer.shop.diffuser")}</Link></li>
              <li><Link to="/hush" className="hover:text-rosegold-light">{t("footer.shop.mint")}</Link></li>
              <li><Link to="/hush" className="hover:text-rosegold-light">{t("footer.shop.citrus")}</Link></li>
              <li><Link to="/hush" className="hover:text-rosegold-light">{t("footer.shop.spice")}</Link></li>
              <li><Link to="/hush" className="hover:text-rosegold-light">{t("footer.shop.discovery")}</Link></li>
              <li><Link to="/hush" className="hover:text-rosegold-light">{t("footer.shop.refills")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-cream-50 text-sm uppercase tracking-widest font-medium mb-5">
              {t("footer.about.h")}
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#science" className="hover:text-rosegold-light">{t("footer.about.science")}</a></li>
              <li><a href="#how" className="hover:text-rosegold-light">{t("footer.about.how")}</a></li>
              <li><a href="#reviews" className="hover:text-rosegold-light">{t("footer.about.reviews")}</a></li>
              <li><a href="#faq" className="hover:text-rosegold-light">{t("footer.about.faq")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-cream-50 text-sm uppercase tracking-widest font-medium mb-5">
              {t("footer.newsletter.h")}
            </h4>
            <p className="text-sm mb-4">{t("footer.newsletter.body")}</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder={t("footer.newsletter.placeholder")}
                className="flex-1 bg-cream-50/10 border border-cream-50/20 rounded-full px-4 py-2.5 text-sm text-cream-50 placeholder:text-cream-50/40 focus:outline-none focus:border-rosegold-light"
              />
              <button className="bg-rosegold text-cream-50 rounded-full px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-rosegold-dark transition">
                {t("footer.newsletter.cta")}
              </button>
            </form>
            <div className="flex gap-5 mt-6 text-xs uppercase tracking-widest">
              <a href="#" className="hover:text-rosegold-light">Instagram</a>
              <a href="#" className="hover:text-rosegold-light">TikTok</a>
            </div>
          </div>
        </div>

        <div className="border-t border-cream-50/10 mt-16 pt-8 flex flex-col md:flex-row justify-between gap-4 text-xs text-cream-100/50">
          <div>© {new Date().getFullYear()} HUSH by AromaFit, Inc. {t("footer.copyright")}</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-cream-50">{t("footer.legal.privacy")}</a>
            <a href="#" className="hover:text-cream-50">{t("footer.legal.terms")}</a>
            <a href="#" className="hover:text-cream-50">{t("footer.legal.shipping")}</a>
          </div>
        </div>

        <p className="text-[10px] text-cream-100/40 mt-8 leading-relaxed max-w-3xl">
          {t("footer.disclaimer")}
        </p>
      </div>
    </footer>
  );
}
