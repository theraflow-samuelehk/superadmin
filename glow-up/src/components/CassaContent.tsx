import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Plus, Minus, Trash2, CreditCard, Banknote, Receipt, ShoppingBag, ChevronDown, Search, Package, TrendingUp, Hash, Star, Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useClients } from "@/hooks/useClients";
import ClientFormDialog from "@/components/ClientFormDialog";
import type { ClientInsert } from "@/hooks/useClients";
import { useTransactions, type TransactionItem, type PaymentMethod } from "@/hooks/useTransactions";
import { useProducts } from "@/hooks/useProducts";
import { useServices } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, endOfDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

interface CartItem extends TransactionItem {}

export default function CassaContent() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { clients, createClient } = useClients();
  const { products, addMovement } = useProducts();
  const { services } = useServices();
  const { tenantUserId } = useTenantUserId();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeClients = clients.filter((c) => !c.deleted_at);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogTab, setCatalogTab] = useState("products");

  const retailProducts = useMemo(
    () => products.filter((p) => !p.deleted_at && p.product_type === "retail" && p.quantity > 0),
    [products]
  );

  const packageServices = useMemo(
    () => services.filter((s) => !s.deleted_at && s.is_package),
    [services]
  );

  const filteredProducts = useMemo(() => {
    if (!catalogSearch.trim()) return retailProducts;
    const q = catalogSearch.toLowerCase();
    return retailProducts.filter((p) => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
  }, [retailProducts, catalogSearch]);

  const filteredServices = useMemo(() => {
    if (!catalogSearch.trim()) return packageServices;
    const q = catalogSearch.toLowerCase();
    return packageServices.filter((s) => s.name.toLowerCase().includes(q));
  }, [packageServices, catalogSearch]);

  const today = new Date();
  const todayRange = useMemo(() => ({
    from: startOfDay(today).toISOString(),
    to: endOfDay(today).toISOString(),
  }), []);

  const { transactions, isLoading, createTransaction, todaySummary } = useTransactions(todayRange);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [clientComboOpen, setClientComboOpen] = useState(false);

  useEffect(() => {
    const aptId = searchParams.get("appointment_id");
    const clientId = searchParams.get("client_id");
    const serviceId = searchParams.get("service_id");
    const serviceName = searchParams.get("service_name");
    const servicePrice = searchParams.get("service_price");

    if (aptId && serviceName && servicePrice) {
      setAppointmentId(aptId);
      setSelectedClient(clientId || "");
      setCart([{
        name: serviceName,
        price: Number(servicePrice),
        qty: 1,
        service_id: serviceId || undefined,
      }]);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const addProductToCart = (product: { id: string; name: string; sale_price: number; quantity: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.qty >= product.quantity) return prev;
        return prev.map((i) => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { name: product.name, price: product.sale_price, qty: 1, product_id: product.id }];
    });
  };

  const addServiceToCart = (svc: typeof packageServices[0]) => {
    const price = svc.is_package ? (svc.package_price ?? svc.price) : svc.price;
    setCart((prev) => {
      const existing = prev.find((i) => i.service_id === svc.id);
      if (existing) {
        return prev.map((i) => i.service_id === svc.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { name: svc.name, price, qty: 1, service_id: svc.id }];
    });
  };

  const getItemKey = (item: CartItem) => item.product_id || item.service_id || item.name;

  const updateQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (getItemKey(i) === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (key: string) => setCart((prev) => prev.filter((i) => getItemKey(i) !== key));

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const handleCheckout = async (method: PaymentMethod) => {
    if (cart.length === 0) return;

    // Check if any cart item is a package service
    const packageItems = cart.filter(item => {
      if (!item.service_id) return false;
      const svc = services.find(s => s.id === item.service_id);
      return svc?.is_package;
    });

    // If selling a package, require a client
    if (packageItems.length > 0 && (!selectedClient || selectedClient === "none")) {
      toast.error(t("packages.selectClientForPackage"));
      return;
    }

    await createTransaction.mutateAsync({
      client_id: selectedClient || null,
      appointment_id: appointmentId || undefined,
      items: cart,
      subtotal,
      discount_percent: discount,
      discount_amount: discountAmount,
      total,
      payment_method: method,
    });

    for (const item of cart) {
      if (item.product_id) {
        await addMovement.mutateAsync({
          product_id: item.product_id,
          movement_type: "sale",
          quantity: item.qty,
          notes: t("inventory.autoDeducted"),
        });
      }
    }

    // Create client_packages for package services
    for (const item of packageItems) {
      const svc = services.find(s => s.id === item.service_id);
      if (!svc || !tenantUserId) continue;
      for (let i = 0; i < item.qty; i++) {
        await supabase.from("client_packages").insert({
          client_id: selectedClient,
          user_id: tenantUserId,
          name: svc.name,
          service_id: svc.id,
          total_sessions: svc.package_sessions ?? 1,
          used_sessions: 0,
          price: svc.package_price ?? svc.price,
          status: "active",
        });
      }
      toast.success(t("packages.packageCreated"));
      queryClient.invalidateQueries({ queryKey: ["client_packages"] });
    }

    setCart([]);
    setDiscount(0);
    setSelectedClient("");
    setAppointmentId(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-serif font-semibold text-foreground">{t("pos.title")}</h2>
        <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={clientComboOpen}
              className="w-full sm:w-72 justify-between rounded-xl bg-card shadow-card border-border/50 font-normal">
              {selectedClient && selectedClient !== "none"
                ? activeClients.find(c => c.id === selectedClient)
                  ? `${activeClients.find(c => c.id === selectedClient)!.first_name} ${activeClients.find(c => c.id === selectedClient)!.last_name}`
                  : t("pos.selectClient")
                : selectedClient === "none"
                  ? t("pos.walkIn")
                  : t("pos.selectClient")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <Command>
              <CommandInput placeholder={t("clients.searchClient")} />
              <CommandList>
                <CommandEmpty>{t("common.noResults")}</CommandEmpty>
                <CommandGroup>
                  <CommandItem onSelect={() => { setSelectedClient("none"); setClientComboOpen(false); }}>
                    <Check className={cn("mr-2 h-4 w-4", selectedClient === "none" ? "opacity-100" : "opacity-0")} />
                    {t("pos.walkIn")}
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => { setShowClientDialog(true); setClientComboOpen(false); }}
                    className="text-primary font-medium">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("pos.newClient")}
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  {activeClients.map((c) => (
                    <CommandItem key={c.id} value={`${c.first_name} ${c.last_name}`}
                      onSelect={() => { setSelectedClient(c.id); setClientComboOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", selectedClient === c.id ? "opacity-100" : "opacity-0")} />
                      {c.first_name} {c.last_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Catalogo Prodotti */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("pos.searchCatalog", "Cerca...")}
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="pl-10 rounded-xl bg-card shadow-card border-border/50 h-11"
            />
          </div>

          <Tabs value={catalogTab} onValueChange={setCatalogTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="products" className="gap-1.5">
                <Package className="h-3.5 w-3.5" />
                {t("pos.products", "Prodotti")}
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-1.5">
                <Star className="h-3.5 w-3.5" />
                {t("pos.packages", "Pacchetti")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addProductToCart(p)}
                    className="group relative p-4 rounded-2xl bg-card border border-border/40 shadow-card hover:shadow-glow hover:scale-[1.02] hover:border-primary/30 active:scale-[0.98] transition-all duration-200 text-left gradient-border"
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {p.name}
                      </p>
                      {p.brand && (
                        <p className="text-[11px] text-muted-foreground truncate">{p.brand}</p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="bg-primary/10 text-primary border-0 font-semibold text-sm px-2 py-0.5">
                          {formatCurrency(p.sale_price)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground bg-secondary/80 rounded-full px-2 py-0.5 font-medium">
                          {p.quantity} {t("inventory.inStock", "disp.")}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{t("pos.noProducts")}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="services" className="mt-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addServiceToCart(s)}
                    className="group relative p-4 rounded-2xl bg-card border border-border/40 shadow-card hover:shadow-glow hover:scale-[1.02] hover:border-primary/30 active:scale-[0.98] transition-all duration-200 text-left gradient-border"
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {s.name}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="bg-primary/10 text-primary border-0 font-semibold text-sm px-2 py-0.5">
                          {formatCurrency(s.is_package ? (s.package_price ?? s.price) : s.price)}
                        </Badge>
                        {s.is_package && (
                          <span className="text-[10px] text-muted-foreground bg-accent/50 rounded-full px-2 py-0.5 font-medium">
                            📦 {s.package_sessions} {t("packages.sessions", "sedute")}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredServices.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{t("pos.noPackages", "Nessun pacchetto disponibile")}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Scontrino */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card gradient-border rounded-2xl shadow-soft sticky top-4 overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <p className="font-serif font-semibold text-base text-foreground">{t("pos.receipt")}</p>
                </div>
                {cart.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-xs font-semibold">
                    {cart.reduce((s, i) => s + i.qty, 0)}
                  </Badge>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{t("pos.emptyCart")}</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[35vh]">
                  <div className="space-y-1 pr-2">
                    {cart.map((item) => {
                      const key = getItemKey(item);
                      return (
                        <div key={key} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-secondary/50 transition-colors animate-fade-in">
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.price)} × {item.qty} = <span className="font-medium text-foreground">{formatCurrency(item.price * item.qty)}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => updateQty(key, -1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                            <button onClick={() => updateQty(key, 1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => removeItem(key)} className="p-1.5 rounded-lg hover:bg-destructive/10 ml-1 transition-colors">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              <Separator className="bg-border/50" />

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-medium">{t("pos.discount")}</span>
                <div className="relative w-24">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="h-9 text-center text-sm rounded-lg pr-6 font-medium"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("pos.subtotal")}</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>{t("pos.discount")} ({discount}%)</span>
                    <span>- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator className="bg-border/50" />
                <div className="flex justify-between items-baseline pt-1">
                   <span className="text-lg font-serif font-semibold">{t("pos.total")}</span>
                   <span className="text-2xl font-semibold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button
                  variant="outline"
                  className="h-14 rounded-xl gap-2.5 text-base font-medium border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100/80 dark:border-green-800 dark:text-green-400 dark:bg-green-950/30 dark:hover:bg-green-900/40 transition-all"
                  disabled={cart.length === 0 || createTransaction.isPending}
                  onClick={() => handleCheckout("cash")}
                >
                  <Banknote className="h-5 w-5" /> {t("pos.cash")}
                </Button>
                <Button
                  variant="hero"
                  className="h-14 rounded-xl gap-2.5 text-base font-medium shadow-glow transition-all"
                  disabled={cart.length === 0 || createTransaction.isPending}
                  onClick={() => handleCheckout("card")}
                >
                  <CreditCard className="h-5 w-5" /> {t("pos.card")}
                </Button>
              </div>
            </div>
          </div>

          {/* Daily summary */}
          <Card className="rounded-2xl shadow-card border-border/40">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{t("pos.dailySummary")}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50">
                  <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{t("pos.total")}</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(todaySummary.grandTotal)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50">
                  <Hash className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{t("pos.trans")}</p>
                    <p className="text-sm font-semibold text-foreground">{todaySummary.count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50">
                  <Banknote className="h-4 w-4 text-green-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{t("pos.cash")}</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(todaySummary.totalCash)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/50">
                  <CreditCard className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{t("pos.card")}</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(todaySummary.totalCard)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent transactions */}
      <Collapsible open={txOpen} onOpenChange={setTxOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-2">
            <Receipt className="h-4 w-4" />
            {t("pos.recentTransactions")}
            <ChevronDown className={`h-4 w-4 transition-transform ${txOpen ? "rotate-180" : ""}`} />
            {todaySummary.count > 0 && (
              <Badge variant="secondary" className="text-[10px] ml-auto rounded-full">{todaySummary.count}</Badge>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="shadow-card border-border/40 rounded-2xl">
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("pos.noTransactions")}</p>
              ) : (
                <div className="space-y-1">
                  {transactions.slice(0, 5).map((tx) => {
                    const items = (tx.items as TransactionItem[]) ?? [];
                    const itemsSummary = items.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ");
                    return (
                      <div key={tx.id} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-secondary/50 transition-colors">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="font-medium text-foreground text-sm">
                            {tx.clients ? `${tx.clients.first_name} ${tx.clients.last_name}` : t("pos.walkIn")}
                          </p>
                          {itemsSummary && (
                            <p className="text-xs text-muted-foreground truncate">{itemsSummary}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), "HH:mm")} · {t(`pos.method.${tx.payment_method}`)}
                            {tx.status === "voided" && (
                              <Badge variant="outline" className="ml-2 text-destructive border-destructive/30 text-[10px] rounded-full">
                                {t("pos.voided")}
                              </Badge>
                            )}
                          </p>
                        </div>
                        <span className={`font-semibold whitespace-nowrap ${tx.status === "voided" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {formatCurrency(tx.total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
      <ClientFormDialog
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        client={null}
        onSubmit={async (data: ClientInsert) => {
          const result = await createClient.mutateAsync(data);
          if (result?.id) {
            setSelectedClient(result.id);
          }
          setShowClientDialog(false);
        }}
        isPending={createClient.isPending}
      />
    </div>
  );
}
