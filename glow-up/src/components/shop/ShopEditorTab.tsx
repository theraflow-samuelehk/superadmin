import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useShopSettings } from "@/hooks/useShopSettings";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Save, Loader2, Copy, Check, CreditCard, ShieldCheck, Eye, ExternalLink, Home, Menu, Truck, Type, Image, Plus, Trash2, GripVertical, Facebook, Instagram, Globe } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface BannerSection {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
}

interface FooterLink {
  label: string;
  url: string;
}

export default function ShopEditorTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { settings, isLoading, upsert } = useShopSettings();

  // Fetch payment key status via secure RPC (never exposes actual keys)
  const [hasStripe, setHasStripe] = useState(false);
  const [hasPaypal, setHasPaypal] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase.rpc("get_payment_keys_status", { p_user_id: user.id }).then(({ data }) => {
      if (data) {
        setHasStripe(!!(data as any).has_stripe);
        setHasPaypal(!!(data as any).has_paypal);
      }
    });
  }, [user, settings]);

  // General
  const [shopName, setShopName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [accentColor, setAccentColor] = useState("#F59E0B");
  const [buttonColor, setButtonColor] = useState("#8B5CF6");
  const [priceColor, setPriceColor] = useState("#8B5CF6");
  const [cartColor, setCartColor] = useState("#8B5CF6");
  const [filterColor, setFilterColor] = useState("#8B5CF6");
  const [heroBtnColor, setHeroBtnColor] = useState("#ffffff");
  const [heroBtnTextColor, setHeroBtnTextColor] = useState("#000000");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  // Homepage
  const [heroTitle, setHeroTitle] = useState("Il nostro Shop");
  const [heroSubtitle, setHeroSubtitle] = useState("Scopri i nostri prodotti");
  const [bannerSections, setBannerSections] = useState<BannerSection[]>([]);

  // Footer
  const [footerAbout, setFooterAbout] = useState("");
  const [footerText, setFooterText] = useState("");
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  // Shipping
  const [shippingCost, setShippingCost] = useState("");
  const [shippingTime, setShippingTime] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");

  // Payments
  const [stripeKey, setStripeKey] = useState("");
  const [paypalId, setPaypalId] = useState("");

  useEffect(() => {
    if (settings) {
      setShopName(settings.shop_name || "");
      setPrimaryColor(settings.primary_color || "#8B5CF6");
      setAccentColor(settings.accent_color || "#F59E0B");
      const si2 = settings.shipping_info || {};
      setButtonColor(si2.button_color || settings.accent_color || "#F59E0B");
      setPriceColor(si2.price_color || settings.primary_color || "#8B5CF6");
      setCartColor(si2.cart_color || settings.primary_color || "#8B5CF6");
      setFilterColor(si2.filter_color || settings.accent_color || "#8B5CF6");
      setHeroBtnColor(si2.hero_btn_color || "#ffffff");
      setHeroBtnTextColor(si2.hero_btn_text_color || "#000000");
      setLogoUrl(settings.logo_url || "");
      setHeroImageUrl(settings.hero_image_url || "");
      setIsPublished(settings.is_published);
      setHeroTitle(settings.hero_title || "Il nostro Shop");
      setHeroSubtitle(settings.hero_subtitle || "Scopri i nostri prodotti");
      setBannerSections(Array.isArray(settings.banner_sections) ? settings.banner_sections : []);
      setFooterAbout(settings.footer_about || "");
      setFooterText(settings.footer_text || "");
      setFooterLinks(Array.isArray(settings.footer_links) ? settings.footer_links : []);
      setSocialLinks(settings.social_links || {});
      const si = settings.shipping_info || {};
      setShippingCost(si.cost || "");
      setShippingTime(si.time || "");
      setShippingNotes(si.notes || "");
      setStripeKey("");
      setPaypalId("");
    }
  }, [settings]);

  const shopUrl = `${window.location.origin}/shop/${user?.id?.slice(0, 8)}`;

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const path = `${user!.id}/${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("shop-images").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from("shop-images").getPublicUrl(path);
    toast.success(t("shop.imageUploaded"));
    return data.publicUrl;
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    const url = await uploadImage(file, "logo");
    if (url) setLogoUrl(url);
    setUploadingLogo(false);
  };

  const handleHeroImageUpload = async (file: File) => {
    setUploadingHero(true);
    const url = await uploadImage(file, "hero");
    if (url) setHeroImageUrl(url);
    setUploadingHero(false);
  };

  const handleSave = () => {
    const updates: Record<string, unknown> = {
      shop_name: shopName || null,
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      primary_color: primaryColor,
      accent_color: accentColor,
      logo_url: logoUrl || null,
      hero_image_url: heroImageUrl || null,
      footer_text: footerText,
      footer_about: footerAbout || null,
      footer_links: footerLinks,
      social_links: socialLinks,
      banner_sections: bannerSections,
      shipping_info: { cost: shippingCost, time: shippingTime, notes: shippingNotes, button_color: buttonColor, price_color: priceColor, cart_color: cartColor, filter_color: filterColor, hero_btn_color: heroBtnColor, hero_btn_text_color: heroBtnTextColor },
      is_published: isPublished,
    };
    if (stripeKey.trim()) updates.stripe_secret_key = stripeKey.trim();
    if (paypalId.trim()) updates.paypal_client_id = paypalId.trim();
    upsert.mutate(updates);
    setStripeKey("");
    setPaypalId("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    toast.success(t("shop.linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  // Banner section helpers
  const addBannerSection = () => {
    setBannerSections(prev => [...prev, { id: crypto.randomUUID(), title: "", subtitle: "", image_url: "", cta_text: "", cta_link: "" }]);
  };
  const updateBanner = (id: string, field: keyof BannerSection, value: string) => {
    setBannerSections(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };
  const removeBanner = (id: string) => setBannerSections(prev => prev.filter(b => b.id !== id));

  const uploadBannerImage = async (id: string, file: File) => {
    const path = `${user!.id}/banners/${id}-${file.name}`;
    const { error } = await supabase.storage.from("shop-images").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("shop-images").getPublicUrl(path);
    updateBanner(id, "image_url", data.publicUrl);
    toast.success(t("shop.imageUploaded"));
  };

  // Footer link helpers
  const addFooterLink = () => setFooterLinks(prev => [...prev, { label: "", url: "" }]);
  const updateFooterLink = (idx: number, field: keyof FooterLink, value: string) => {
    setFooterLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };
  const removeFooterLink = (idx: number) => setFooterLinks(prev => prev.filter((_, i) => i !== idx));

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  // hasStripe and hasPaypal are set from the secure RPC above

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["publish", "homepage"]} className="space-y-3">

        {/* Pubblicazione */}
        <AccordionItem value="publish" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <span className="font-semibold">{t("shop.publishStore")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <Label>{t("shop.storeOnline")}</Label>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            {isPublished && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Input value={shopUrl} readOnly className="text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={shopUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                </Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Generale */}
        <AccordionItem value="general" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              <span className="font-semibold">{t("shop.general")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>{t("shop.shopName")}</Label>
              <Input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Nome del tuo negozio" />
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label>{t("shop.logoImage")}</Label>
              <div className="flex items-center gap-3">
                {logoUrl && <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded border bg-white p-1" />}
                <div className="flex-1">
                  <Input type="file" accept="image/*" disabled={uploadingLogo} onChange={e => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]); }} />
                </div>
                {logoUrl && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setLogoUrl("")}><Trash2 className="h-4 w-4" /></Button>}
              </div>
              <p className="text-xs text-muted-foreground">{t("shop.logoHelp")}</p>
            </div>

            {/* Hero image */}
            <div className="space-y-2">
              <Label>{t("shop.heroImage")}</Label>
              <div className="flex items-center gap-3">
                {heroImageUrl && <img src={heroImageUrl} alt="Hero" className="h-20 w-32 object-cover rounded border" />}
                <div className="flex-1">
                  <Input type="file" accept="image/*" disabled={uploadingHero} onChange={e => { if (e.target.files?.[0]) handleHeroImageUpload(e.target.files[0]); }} />
                </div>
                {heroImageUrl && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setHeroImageUrl("")}><Trash2 className="h-4 w-4" /></Button>}
              </div>
              <p className="text-xs text-muted-foreground">{t("shop.heroImageHelp")}</p>
            </div>

            {/* Colors */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("shop.primaryColor")}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                  <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("shop.accentColor")}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                  <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("shop.buttonColor")}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={buttonColor} onChange={e => setButtonColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                  <Input value={buttonColor} onChange={e => setButtonColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("shop.priceColor")}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={priceColor} onChange={e => setPriceColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                  <Input value={priceColor} onChange={e => setPriceColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("shop.heroBtnColor")}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={heroBtnColor} onChange={e => setHeroBtnColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                  <Input value={heroBtnColor} onChange={e => setHeroBtnColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("shop.heroBtnTextColor")}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={heroBtnTextColor} onChange={e => setHeroBtnTextColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                  <Input value={heroBtnTextColor} onChange={e => setHeroBtnTextColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Colore filtri categoria</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={filterColor} onChange={e => setFilterColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                  <Input value={filterColor} onChange={e => setFilterColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("shop.cartColor", "Colore carrello")}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={cartColor} onChange={e => setCartColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer border" />
                  <Input value={cartColor} onChange={e => setCartColor(e.target.value)} className="flex-1" />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Homepage */}
        <AccordionItem value="homepage" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span className="font-semibold">{t("shop.homepage")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("shop.heroTitle")}</Label>
                <Input value={heroTitle} onChange={e => setHeroTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("shop.heroSubtitle")}</Label>
                <Input value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">{t("shop.bannerSections")}</Label>
                <Button variant="outline" size="sm" onClick={addBannerSection}>
                  <Plus className="h-4 w-4 mr-1" /> {t("shop.addSection")}
                </Button>
              </div>
              {bannerSections.map((section) => (
                <Card key={section.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeBanner(section.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("shop.sectionTitle")}</Label>
                      <Input value={section.title} onChange={e => updateBanner(section.id, "title", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("shop.sectionSubtitle")}</Label>
                      <Input value={section.subtitle} onChange={e => updateBanner(section.id, "subtitle", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("shop.sectionImage")}</Label>
                    <div className="flex items-center gap-2">
                      {section.image_url && <img src={section.image_url} alt="" className="h-16 w-24 object-cover rounded" />}
                      <Input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) uploadBannerImage(section.id, e.target.files[0]); }} />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("shop.ctaText")}</Label>
                      <Input value={section.cta_text} onChange={e => updateBanner(section.id, "cta_text", e.target.value)} placeholder="Scopri di più" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("shop.ctaLink")}</Label>
                      <Input value={section.cta_link} onChange={e => updateBanner(section.id, "cta_link", e.target.value)} placeholder="catalog" />
                    </div>
                  </div>
                </Card>
              ))}
              {bannerSections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t("shop.noBannerSections")}</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Footer */}
        <AccordionItem value="footer" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Menu className="h-5 w-5" />
              <span className="font-semibold">Footer</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>{t("shop.footerAbout")}</Label>
              <Textarea value={footerAbout} onChange={e => setFooterAbout(e.target.value)} rows={3} placeholder="Chi siamo, la nostra storia..." />
            </div>
            <div className="space-y-2">
              <Label>{t("shop.footerText")}</Label>
              <Input value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="© 2026 Il mio negozio" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("shop.footerLinksTitle")}</Label>
                <Button variant="outline" size="sm" onClick={addFooterLink}>
                  <Plus className="h-4 w-4 mr-1" /> {t("common.add")}
                </Button>
              </div>
              {footerLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input value={link.label} onChange={e => updateFooterLink(idx, "label", e.target.value)} placeholder="Etichetta" className="flex-1" />
                  <Input value={link.url} onChange={e => updateFooterLink(idx, "url", e.target.value)} placeholder="https://..." className="flex-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFooterLink(idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Label>{t("shop.socialLinks")}</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input value={socialLinks.facebook || ""} onChange={e => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))} placeholder="URL Facebook" />
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input value={socialLinks.instagram || ""} onChange={e => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))} placeholder="URL Instagram" />
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input value={socialLinks.website || ""} onChange={e => setSocialLinks(prev => ({ ...prev, website: e.target.value }))} placeholder="Sito web" />
                </div>
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-muted-foreground shrink-0">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.8a4.84 4.84 0 01-1-.11z"/>
                  </svg>
                  <Input value={socialLinks.tiktok || ""} onChange={e => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))} placeholder="URL TikTok" />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Spedizione */}
        <AccordionItem value="shipping" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <span className="font-semibold">{t("shop.shipping")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("shop.shippingCost")}</Label>
                <Input type="number" step="0.01" value={shippingCost} onChange={e => setShippingCost(e.target.value)} placeholder="5.00" />
              </div>
              <div className="space-y-2">
                <Label>{t("shop.shippingTime")}</Label>
                <Input value={shippingTime} onChange={e => setShippingTime(e.target.value)} placeholder="2-4 giorni lavorativi" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("shop.shippingNotes")}</Label>
              <Textarea value={shippingNotes} onChange={e => setShippingNotes(e.target.value)} rows={2} placeholder="Note aggiuntive sulla spedizione..." />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Pagamenti */}
        <AccordionItem value="payments" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="font-semibold">{t("shop.payments")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Stripe</Label>
                <Badge variant={hasStripe ? "default" : "secondary"}>
                  {hasStripe ? t("shop.stripeConfigured") : t("shop.notConfigured")}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">{t("shop.stripeSecretKey")}</Label>
                <Input type="password" value={stripeKey} onChange={e => setStripeKey(e.target.value)} placeholder={hasStripe ? "••••••••••••••••" : "sk_live_..."} />
                <p className="text-xs text-muted-foreground">{t("shop.stripeSecretKeyHelp")}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">PayPal</Label>
                <Badge variant={hasPaypal ? "default" : "secondary"}>
                  {hasPaypal ? t("shop.paypalConfigured") : t("shop.notConfigured")}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">{t("shop.paypalClientId")}</Label>
                <Input type="password" value={paypalId} onChange={e => setPaypalId(e.target.value)} placeholder={hasPaypal ? "••••••••••••••••" : "AX..."} />
                <p className="text-xs text-muted-foreground">{t("shop.paypalClientIdHelp")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted rounded-lg">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {t("shop.paymentKeysHidden")}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={upsert.isPending}>
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}
