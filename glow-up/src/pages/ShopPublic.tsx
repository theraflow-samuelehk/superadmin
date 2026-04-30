import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShoppingCart, Package, Plus, Minus, Trash2, Store, Loader2, CreditCard, Banknote, CheckCircle2, Search, ArrowLeft, Truck, Facebook, Instagram, Globe, Menu, X } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

type ShopView = "home" | "catalog" | "product";

export default function ShopPublic({ embeddedSlug }: { embeddedSlug?: string }) {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const slug = embeddedSlug || urlSlug;
  const isEmbedded = !!embeddedSlug;
  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "pickup">("pickup");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "in_store">("in_store");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [view, setView] = useState<ShopView>("home");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Shipping address
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingProvince, setShippingProvince] = useState("");

  useEffect(() => {
    if (searchParams.get("success") === "true") setOrderSuccess(true);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["public_shop", slug],
    queryFn: async () => {
      // Use secure RPCs that exclude sensitive columns (stripe keys, cost prices)
      const { data: shops, error: shopError } = await supabase
        .rpc("get_public_shop_settings");
      if (shopError) throw shopError;
      const shopList = (shops || []) as unknown as any[];
      const shop = shopList.find(s => s.user_id?.startsWith(slug));
      if (!shop) return null;
      const { data: products, error: prodError } = await supabase
        .rpc("get_public_shop_products", { p_user_id: shop.user_id });
      if (prodError) throw prodError;
      return { shop, products: (products || []) as unknown as any[] };
    },
    enabled: !!slug,
  });

  const categories = useMemo(() => {
    if (!data?.products) return [];
    const cats = [...new Set(data.products.map((p: any) => p.category).filter(Boolean))];
    return cats as string[];
  }, [data?.products]);

  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    let results = data.products as any[];
    if (selectedCategory) results = results.filter((p: any) => p.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((p: any) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (p.tags || []).some((t: string) => t.toLowerCase().includes(q))
      );
    }
    return results;
  }, [data?.products, selectedCategory, searchQuery]);

  const selectedProduct = data?.products?.find((p: any) => p.id === selectedProductId);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) { toast.error("Quantità massima raggiunta"); return prev; }
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.sale_price, quantity: 1, image_url: product.image_url }];
    });
    toast.success(`${product.name} aggiunto al carrello`);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== productId) return i;
      const newQty = i.quantity + delta;
      return newQty > 0 ? { ...i, quantity: newQty } : i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.product_id !== productId));
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const shippingInfo = data?.shop?.shipping_info || {};
  const shippingCost = deliveryMethod === "shipping" ? parseFloat(shippingInfo.cost || "0") : 0;
  const orderTotal = cartTotal + shippingCost;

  const handleCheckout = async () => {
    if (!customerName.trim()) { toast.error("Inserisci il tuo nome"); return; }
    if (deliveryMethod === "shipping" && (!shippingAddress.trim() || !shippingCity.trim() || !shippingZip.trim())) {
      toast.error("Completa l'indirizzo di spedizione"); return;
    }
    setSubmitting(true);
    try {
      const shop = data!.shop;
      const shippingData = deliveryMethod === "shipping" ? {
        name: shippingName || customerName,
        address: shippingAddress,
        city: shippingCity,
        zip: shippingZip,
        province: shippingProvince,
      } : null;

      if (paymentMethod === "stripe" && deliveryMethod === "shipping") {
        const res = await supabase.functions.invoke("shop-checkout", {
          body: {
            salonUserId: shop.user_id, items: cart, customerName,
            customerEmail: customerEmail || null, customerPhone: customerPhone || null,
            deliveryMethod, shippingAddress: shippingData,
            successUrl: `${window.location.origin}/shop/${slug}?success=true`,
            cancelUrl: `${window.location.origin}/shop/${slug}?canceled=true`,
          },
        });
        if (res.error) throw new Error(res.error.message);
        const resData = res.data as { url?: string; error?: string };
        if (resData.error) throw new Error(resData.error);
        if (resData.url) { window.location.href = resData.url; return; }
      } else {
        // Route through edge function for secure order creation
        const res = await supabase.functions.invoke("shop-checkout", {
          body: {
            salonUserId: shop.user_id, items: cart, customerName,
            customerEmail: customerEmail || null, customerPhone: customerPhone || null,
            deliveryMethod, shippingAddress: shippingData,
            paymentMethod: "in_store",
          },
        });
        if (res.error) throw new Error(res.error.message);
        const resData = res.data as { error?: string };
        if (resData.error) throw new Error(resData.error);
        setOrderSuccess(true);
      }
      setCart([]);
      setCheckoutOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Errore nell'invio dell'ordine");
    } finally {
      setSubmitting(false);
    }
  };

  const openProduct = (id: string) => { setSelectedProductId(id); setView("product"); };

  if (isLoading) return <div className="h-full overflow-auto flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data?.shop) return (
    <div className="h-full overflow-auto flex items-center justify-center bg-background">
      <div className="text-center space-y-3"><Store className="h-12 w-12 mx-auto text-muted-foreground" /><h1 className="text-xl font-semibold">Shop non trovato</h1></div>
    </div>
  );
  if (orderSuccess) return (
    <div className="h-full overflow-auto flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
        <h1 className="text-2xl font-bold">Ordine confermato!</h1>
        <p className="text-muted-foreground max-w-sm">Grazie per il tuo acquisto. Ti contatteremo per il ritiro o la consegna.</p>
        <Button onClick={() => { setOrderSuccess(false); if (!isEmbedded) window.history.replaceState({}, '', `/shop/${slug}`); }}>Torna allo Shop</Button>
      </div>
    </div>
  );

  const { shop, products } = data;
  const bannerSections = Array.isArray(shop.banner_sections) ? shop.banner_sections : [];
  const footerLinks = Array.isArray(shop.footer_links) ? shop.footer_links : [];
  const socialLinks = shop.social_links || {};
  const btnColor = (shop.shipping_info as any)?.button_color || shop.accent_color || shop.primary_color;
  const priceColor = (shop.shipping_info as any)?.price_color || shop.primary_color;
  const cartColor = (shop.shipping_info as any)?.cart_color || shop.primary_color;

  return (
    <div className="h-full overflow-auto flex flex-col" style={{ "--shop-primary": shop.primary_color, "--shop-accent": shop.accent_color, "--shop-btn": btnColor } as any}>
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14 relative">
          <div className="flex items-center gap-2 sm:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2">
            <button onClick={() => { setView("home"); setSelectedProductId(null); setMobileMenuOpen(false); }} className="flex items-center gap-2 font-bold text-lg" style={{ color: shop.primary_color }}>
              {shop.logo_url ? <img src={shop.logo_url} alt="" className="h-20 w-20 object-contain rounded-lg -my-4" /> : (shop.shop_name || "")}
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <button onClick={() => { setView("home"); setSelectedProductId(null); }} className="hover:underline hidden sm:block">Home</button>
            <button onClick={() => { setView("catalog"); setSelectedProductId(null); setSelectedCategory(null); }} className="hover:underline hidden sm:block">Catalogo</button>
            {categories.slice(0, 3).map(cat => (
              <button key={cat} onClick={() => { setView("catalog"); setSelectedCategory(cat); }} className="hover:underline hidden md:block">{cat}</button>
            ))}
            <button onClick={() => setCheckoutOpen(true)} className="relative flex items-center gap-1 font-medium" style={{ color: cartColor }}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full text-xs text-white" style={{ backgroundColor: cartColor }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t bg-white px-4 py-3 space-y-2">
            <button onClick={() => { setView("home"); setSelectedProductId(null); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 rounded-lg hover:bg-muted text-sm font-medium">Home</button>
            <button onClick={() => { setView("catalog"); setSelectedProductId(null); setSelectedCategory(null); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 rounded-lg hover:bg-muted text-sm font-medium">Catalogo</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => { setView("catalog"); setSelectedCategory(cat); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 rounded-lg hover:bg-muted text-sm text-muted-foreground">{cat}</button>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-1">
        {/* HOME VIEW */}
        {view === "home" && (
          <>
            {/* Hero */}
            <div className="relative p-8 sm:p-16 text-center overflow-hidden" style={{
              background: shop.hero_image_url
                ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url(${shop.hero_image_url}) center/cover no-repeat`
                : `linear-gradient(135deg, ${shop.primary_color}, ${shop.accent_color})`
            }}>
              <h1 className="text-3xl sm:text-5xl font-bold text-white relative z-10">{shop.hero_title}</h1>
              <p className="text-white/80 mt-3 text-lg relative z-10">{shop.hero_subtitle}</p>
              <Button className="mt-6 relative z-10 border-0 hover:opacity-90" onClick={() => { setView("catalog"); setSelectedCategory(null); }} style={{ backgroundColor: (shop.shipping_info as any)?.hero_btn_color || "#ffffff", color: (shop.shipping_info as any)?.hero_btn_text_color || "#000000" }}>
                Esplora il catalogo
              </Button>
            </div>

            {/* Banner sections */}
            {bannerSections.map((section: any, idx: number) => (
              <div key={idx} className={`max-w-6xl mx-auto px-4 py-8 ${idx % 2 === 0 ? "" : "bg-muted/30"}`}>
                <div className={`flex flex-col ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-6 items-center`}>
                  {section.image_url && (
                    <div className="md:w-1/2">
                      <img src={section.image_url} alt={section.title} className="rounded-xl w-full h-64 object-cover" />
                    </div>
                  )}
                  <div className={`${section.image_url ? "md:w-1/2" : "w-full text-center"} space-y-3`}>
                    {section.title && <h2 className="text-2xl font-bold">{section.title}</h2>}
                    {section.subtitle && <p className="text-muted-foreground">{section.subtitle}</p>}
                    {section.cta_text && (
                      <Button
                        onClick={() => {
                          if (section.cta_link === "catalog") {
                            setView("catalog");
                          } else if (section.cta_link && (section.cta_link.startsWith("http://") || section.cta_link.startsWith("https://"))) {
                            window.open(section.cta_link, "_blank", "noopener,noreferrer");
                          } else if (section.cta_link) {
                            window.location.href = section.cta_link;
                          }
                        }}
                        style={{ backgroundColor: btnColor }}
                        className="text-white"
                      >
                        {section.cta_text}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Featured products */}
            <div className="max-w-6xl mx-auto px-4 py-8">
              <h2 className="text-2xl font-bold mb-6">Prodotti in evidenza</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {products.slice(0, 8).map((product: any) => (
                  <ProductCard key={product.id} product={product} shop={shop} onAdd={addToCart} onClick={() => openProduct(product.id)} />
                ))}
              </div>
              {products.length > 8 && (
                <div className="text-center mt-6">
                  <Button variant="outline" onClick={() => { setView("catalog"); setSelectedCategory(null); }}>Vedi tutti i prodotti</Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* CATALOG VIEW */}
        {view === "catalog" && (
          <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => { setView("home"); setSelectedCategory(null); setSearchQuery(""); }}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold flex-1">Catalogo</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cerca prodotti..." className="pl-9" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
                  style={selectedCategory === null ? { backgroundColor: (shop.shipping_info as any)?.filter_color || shop.accent_color || btnColor, color: "#fff", borderColor: "transparent" } : {}}
                >
                  Tutti
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
                    style={selectedCategory === cat ? { backgroundColor: (shop.shipping_info as any)?.filter_color || shop.accent_color || btnColor, color: "#fff", borderColor: "transparent" } : {}}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16"><Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">Nessun prodotto trovato</p></div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} shop={shop} onAdd={addToCart} onClick={() => openProduct(product.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCT VIEW */}
        {view === "product" && selectedProduct && (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <Button variant="ghost" onClick={() => setView("catalog")} className="gap-2"><ArrowLeft className="h-4 w-4" /> Torna al catalogo</Button>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center aspect-square">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-contain" />
                ) : (
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                )}
              </div>
              <div className="space-y-4">
                <div>
                  {selectedProduct.category && <Badge variant="secondary">{selectedProduct.category}</Badge>}
                  <h1 className="text-3xl font-bold mt-2">{selectedProduct.name}</h1>
                  {selectedProduct.brand && <p className="text-muted-foreground">{selectedProduct.brand}</p>}
                </div>
                <p className="text-3xl font-bold" style={{ color: priceColor }}>€{Number(selectedProduct.sale_price).toFixed(2)}</p>
                <Button className="w-full text-white" size="lg" onClick={() => addToCart(selectedProduct)} style={{ backgroundColor: btnColor }}>
                  <Plus className="h-5 w-5 mr-2" /> Aggiungi al carrello
                </Button>
                {selectedProduct.description && <p className="text-muted-foreground leading-relaxed">{selectedProduct.description}</p>}
                {(selectedProduct.tags || []).length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {selectedProduct.tags.map((tag: string) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{selectedProduct.quantity > 5 ? "Disponibile" : `Solo ${selectedProduct.quantity} rimasti`}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto" style={{ backgroundColor: `${shop.primary_color}08` }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <div className="flex justify-center">{shop.logo_url ? <img src={shop.logo_url} alt={shop.shop_name || "Shop"} className="h-20 w-20 object-contain rounded-lg" /> : <h3 className="font-bold text-lg">{shop.shop_name || "Il nostro Shop"}</h3>}</div>
              {shop.footer_about && <p className="text-sm text-muted-foreground">{shop.footer_about}</p>}
            </div>
            {footerLinks.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Link utili</h4>
                <ul className="space-y-1">
                  {footerLinks.map((link: any, i: number) => (
                    <li key={i}><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-3">
              {(socialLinks.facebook || socialLinks.instagram || socialLinks.website || socialLinks.tiktok) && (
                <>
                  <h4 className="font-semibold">Seguici</h4>
                  <div className="flex gap-3">
                    {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"><Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>}
                    {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>}
                    {socialLinks.website && <a href={socialLinks.website} target="_blank" rel="noopener noreferrer"><Globe className="h-5 w-5 text-muted-foreground hover:text-foreground" /></a>}
                    {socialLinks.tiktok && <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-muted-foreground hover:text-foreground"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52V6.8a4.84 4.84 0 01-1-.11z"/></svg></a>}
                  </div>
                </>
              )}
            </div>
          </div>
          {shop.footer_text && <p className="text-xs text-muted-foreground mt-6 pt-4 border-t text-center">{shop.footer_text}</p>}
        </div>
      </footer>

      {/* Cart FAB */}
      {cart.length > 0 && !checkoutOpen && (
        <button onClick={() => setCheckoutOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg text-white font-medium hover:scale-105 transition-transform"
          style={{ backgroundColor: btnColor }}>
          <ShoppingCart className="h-5 w-5" />
          <span>{cartCount} — €{cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Il tuo carrello</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Il carrello è vuoto</p>
            ) : (
              <>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {cart.map(item => (
                    <div key={item.product_id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted-foreground/10 flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground/40" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">€{item.price.toFixed(2)} cad.</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product_id, -1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product_id, 1)}><Plus className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product_id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery method */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Consegna</Label>
                  <RadioGroup value={deliveryMethod} onValueChange={v => setDeliveryMethod(v as "shipping" | "pickup")} className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${deliveryMethod === "pickup" ? "border-primary bg-primary/5" : ""}`}>
                      <RadioGroupItem value="pickup" />
                      <Banknote className="h-5 w-5" />
                      <div><p className="font-medium text-sm">Ritira in negozio</p><p className="text-xs text-muted-foreground">Pagamento al ritiro</p></div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${deliveryMethod === "shipping" ? "border-primary bg-primary/5" : ""}`}>
                      <RadioGroupItem value="shipping" />
                      <Truck className="h-5 w-5" />
                      <div>
                        <p className="font-medium text-sm">Spedizione</p>
                        <p className="text-xs text-muted-foreground">
                          {shippingInfo.time || "Tempi variabili"}
                          {shippingInfo.cost ? ` — €${parseFloat(shippingInfo.cost).toFixed(2)}` : ""}
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Shipping address (only if shipping) */}
                {deliveryMethod === "shipping" && (
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                    <Label className="font-medium text-sm">Indirizzo di spedizione</Label>
                    <Input value={shippingName} onChange={e => setShippingName(e.target.value)} placeholder="Nome e cognome" />
                    <Input value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} placeholder="Indirizzo *" />
                    <div className="grid grid-cols-3 gap-2">
                      <Input value={shippingCity} onChange={e => setShippingCity(e.target.value)} placeholder="Città *" />
                      <Input value={shippingZip} onChange={e => setShippingZip(e.target.value)} placeholder="CAP *" />
                      <Input value={shippingProvince} onChange={e => setShippingProvince(e.target.value)} placeholder="Prov." />
                    </div>
                    {shippingInfo.notes && <p className="text-xs text-muted-foreground">{shippingInfo.notes}</p>}
                  </div>
                )}

                {/* Payment method (only for shipping) */}
                {deliveryMethod === "shipping" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Pagamento</Label>
                    <RadioGroup value={paymentMethod} onValueChange={v => setPaymentMethod(v as "stripe" | "in_store")} className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === "stripe" ? "border-primary bg-primary/5" : ""}`}>
                        <RadioGroupItem value="stripe" />
                        <CreditCard className="h-5 w-5" />
                        <div><p className="font-medium text-sm">Paga online con Carta</p></div>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === "in_store" ? "border-primary bg-primary/5" : ""}`}>
                        <RadioGroupItem value="in_store" />
                        <Banknote className="h-5 w-5" />
                        <div><p className="font-medium text-sm">Contrassegno</p></div>
                      </label>
                    </RadioGroup>
                  </div>
                )}

                {/* Customer info */}
                <div className="space-y-3">
                  <Label className="font-medium text-sm">I tuoi dati</Label>
                  <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome *" />
                  <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email" />
                  <Input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Telefono" />
                </div>

                {/* Total */}
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm"><span>Subtotale</span><span>€{cartTotal.toFixed(2)}</span></div>
                  {shippingCost > 0 && <div className="flex justify-between text-sm"><span>Spedizione</span><span>€{shippingCost.toFixed(2)}</span></div>}
                  <div className="flex justify-between font-bold text-lg"><span>Totale</span><span>€{orderTotal.toFixed(2)}</span></div>
                </div>
              </>
            )}
          </div>
          {cart.length > 0 && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Annulla</Button>
              <Button onClick={handleCheckout} disabled={submitting} style={{ backgroundColor: btnColor }} className="text-white">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {deliveryMethod === "pickup" ? "Invia ordine" : paymentMethod === "stripe" ? "Paga ora" : "Conferma ordine"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductCard({ product, shop, onAdd, onClick }: { product: any; shop: any; onAdd: (p: any) => void; onClick: () => void }) {
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${shop.primary_color}10, ${shop.accent_color}10)` }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground/30" />
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-medium line-clamp-1">{product.name}</h3>
        {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
        <span className="text-lg font-bold" style={{ color: (shop.shipping_info as any)?.price_color || shop.primary_color }}>€{Number(product.sale_price).toFixed(2)}</span>
        {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
        <Button size="sm" className="w-full text-white" onClick={e => { e.stopPropagation(); onAdd(product); }} style={{ backgroundColor: (shop.shipping_info as any)?.button_color || shop.accent_color || shop.primary_color }}>
          <Plus className="h-4 w-4 mr-1" /> Aggiungi
        </Button>
      </CardContent>
    </Card>
  );
}
