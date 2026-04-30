import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useT } from "../lang/LanguageContext";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useT();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Smart navigation: hash links scroll to element when on home page,
  // otherwise navigate home then scroll.
  const goTo = (target) => (e) => {
    e?.preventDefault?.();
    setOpen(false);

    if (target.startsWith("#")) {
      const id = target.slice(1);
      if (pathname === "/") {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        navigate("/" + target);
      }
      return;
    }
    navigate(target);
  };

  const navLinks = [
    { target: "/", label: t("nav.home") },
    { target: "/hush", label: t("nav.shop") },
    { target: "#science", label: t("nav.science") },
    { target: "#reviews", label: t("nav.reviews") },
  ];

  const isActive = (target) => {
    if (target.startsWith("#")) return false;
    return pathname === target;
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream-50/95 backdrop-blur-md border-b border-ink/5"
          : "bg-cream-50/80 backdrop-blur-sm"
      }`}
    >
      <div className="container-x flex items-center justify-between h-20">
        <Link to="/" className="flex items-baseline gap-2 leading-none">
          <span className="font-display text-3xl tracking-tight text-ink">HUSH</span>
          <span className="text-[10px] uppercase tracking-widest text-rosegold hidden sm:inline">
            by AromaFit
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.target}
              href={link.target.startsWith("#") ? "/" + link.target : link.target}
              onClick={goTo(link.target)}
              className={`text-sm font-medium tracking-wide transition cursor-pointer ${
                isActive(link.target) ? "text-ink" : "text-ink/70 hover:text-ink"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {/* Tiny lang switch */}
          <div className="flex items-center text-[10px] uppercase tracking-widest text-ink/40">
            <button
              onClick={() => setLang("en")}
              className={`px-1 transition ${
                lang === "en" ? "text-ink" : "hover:text-ink/70"
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
            <span className="text-ink/20">|</span>
            <button
              onClick={() => setLang("it")}
              className={`px-1 transition ${
                lang === "it" ? "text-ink" : "hover:text-ink/70"
              }`}
              aria-label="Cambia in italiano"
            >
              IT
            </button>
          </div>

          <Link to="/hush" className="btn-primary !py-3 !px-6 text-xs">
            <ShoppingBag size={16} /> {t("nav.cta")}
          </Link>
        </div>

        <button
          aria-label="Open menu"
          className="md:hidden text-ink p-2"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-cream-50 border-t border-ink/10 px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.target}
              href={link.target.startsWith("#") ? "/" + link.target : link.target}
              onClick={goTo(link.target)}
              className="block text-base font-medium text-ink cursor-pointer"
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-4 pt-2 text-[11px] uppercase tracking-widest text-ink/50">
            <button
              onClick={() => setLang("en")}
              className={lang === "en" ? "text-ink font-medium" : ""}
            >
              EN
            </button>
            <span className="text-ink/20">|</span>
            <button
              onClick={() => setLang("it")}
              className={lang === "it" ? "text-ink font-medium" : ""}
            >
              IT
            </button>
          </div>
          <Link to="/hush" className="btn-primary w-full" onClick={() => setOpen(false)}>
            <ShoppingBag size={16} /> {t("nav.cta")}
          </Link>
        </div>
      )}
    </header>
  );
}
