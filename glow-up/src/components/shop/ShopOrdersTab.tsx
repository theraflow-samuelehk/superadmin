import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useShopOrders } from "@/hooks/useShopOrders";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { ShoppingBag, Loader2, CreditCard, Banknote, Truck, Store, ChevronDown, Phone, StickyNote, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const formatDateTime = (date: Date, language: string, timezone: string) =>
  date.toLocaleString(language, { timeZone: timezone, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-orange-500/10 text-orange-700 border-orange-200",
  new: "bg-blue-500/10 text-blue-700 border-blue-200",
  processing: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  completed: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
};

function PaymentBadge({ method, deliveryMethod, t }: { method: string | null; deliveryMethod?: string | null; t: (k: string) => string }) {
  if (!method) return null;
  const isOnline = method === "stripe" || method === "paypal";
  const label = method === "stripe" ? t("shop.stripe") : method === "paypal" ? t("shop.paypal") : deliveryMethod === "shipping" ? t("shop.cashOnDelivery") : t("shop.inStore");
  const Icon = isOnline ? CreditCard : Banknote;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function DeliveryBadge({ method, t }: { method: string | null; t: (k: string) => string }) {
  if (!method) return null;
  const isShipping = method === "shipping";
  const Icon = isShipping ? Truck : Store;
  const label = isShipping ? t("shop.shippingDelivery") : t("shop.pickupInStore");
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function ShippingAddressBlock({ address, t }: { address: Record<string, string> | null; t: (k: string) => string }) {
  if (!address) return null;
  const parts = [address.name, address.address, address.city, address.zip, address.province].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <div className="text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1 font-medium text-foreground mb-0.5">
        <MapPin className="h-3 w-3" /> {t("shop.shippingAddress")}
      </span>
      <p>{parts.join(", ")}</p>
    </div>
  );
}

function OrderDetailsPanel({ order, t }: { order: any; t: (k: string) => string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1 py-2 text-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">{t("shop.paymentMethod")}:</span>
          <PaymentBadge method={order.payment_method} deliveryMethod={order.delivery_method} t={t} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">{t("shop.deliveryMethod")}:</span>
          <DeliveryBadge method={order.delivery_method} t={t} />
        </div>
        {order.customer_phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {order.customer_phone}
          </div>
        )}
      </div>
      <div className="space-y-2">
        {order.delivery_method === "shipping" && (
          <ShippingAddressBlock address={order.shipping_address} t={t} />
        )}
        {order.notes && (
          <div className="text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground mb-0.5">
              <StickyNote className="h-3 w-3" /> {t("shop.notes")}
            </span>
            <p>{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopOrdersTab() {
  const { t, i18n } = useTranslation();
  const { formatCurrency, timezone } = useLocalization();
  const fmtDt = (d: string) => formatDateTime(new Date(d), i18n.language, timezone);
  const { orders, isLoading, updateStatus } = useShopOrders();
  const isMobile = useIsMobile();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{t("shop.noOrders")}</p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between" onClick={() => toggle(order.id)} role="button">
                <span className="font-mono text-sm font-medium">{order.order_number}</span>
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLORS[order.status] || ""}>{t(`shop.status.${order.status}`)}</Badge>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedId === order.id && "rotate-180")} />
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.customer_name}</p>
                {order.customer_email && <p className="text-muted-foreground">{order.customer_email}</p>}
                <p className="text-muted-foreground text-xs">{fmtDt(order.created_at)}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <PaymentBadge method={order.payment_method} deliveryMethod={order.delivery_method} t={t} />
                <DeliveryBadge method={order.delivery_method} t={t} />
              </div>
              <div className="text-sm">
                {(order.items as any[]).map((item: any, i: number) => (
                  <span key={i} className="text-muted-foreground">
                    {item.name} ×{item.quantity}{i < (order.items as any[]).length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{formatCurrency(order.total)}</span>
                <Select value={order.status} onValueChange={(s) => updateStatus.mutate({ id: order.id, status: s })}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_payment">{t("shop.status.pending_payment")}</SelectItem>
                    <SelectItem value="new">{t("shop.status.new")}</SelectItem>
                    <SelectItem value="processing">{t("shop.status.processing")}</SelectItem>
                    <SelectItem value="completed">{t("shop.status.completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("shop.status.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {expandedId === order.id && (
                <div className="border-t pt-3">
                  <OrderDetailsPanel order={order} t={t} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>{t("shop.orderNumber")}</TableHead>
            <TableHead>{t("shop.customer")}</TableHead>
            <TableHead>{t("shop.items")}</TableHead>
            <TableHead>{t("shop.paymentMethod")}</TableHead>
            <TableHead>{t("shop.deliveryMethod")}</TableHead>
            <TableHead>{t("shop.total")}</TableHead>
            <TableHead>{t("shop.date")}</TableHead>
            <TableHead>{t("shop.statusLabel")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <>
              <TableRow key={order.id} className="cursor-pointer" onClick={() => toggle(order.id)}>
                <TableCell className="px-2">
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedId === order.id && "rotate-180")} />
                </TableCell>
                <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    {order.customer_email && <p className="text-xs text-muted-foreground">{order.customer_email}</p>}
                  </div>
                </TableCell>
                <TableCell className="text-sm max-w-40 truncate">
                  {(order.items as any[]).map((item: any) => `${item.name} ×${item.quantity}`).join(", ")}
                </TableCell>
                <TableCell><PaymentBadge method={order.payment_method} deliveryMethod={order.delivery_method} t={t} /></TableCell>
                <TableCell><DeliveryBadge method={order.delivery_method} t={t} /></TableCell>
                <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                <TableCell className="text-sm">{fmtDt(order.created_at)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select value={order.status} onValueChange={(s) => updateStatus.mutate({ id: order.id, status: s })}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_payment">{t("shop.status.pending_payment")}</SelectItem>
                      <SelectItem value="new">{t("shop.status.new")}</SelectItem>
                      <SelectItem value="processing">{t("shop.status.processing")}</SelectItem>
                      <SelectItem value="completed">{t("shop.status.completed")}</SelectItem>
                      <SelectItem value="cancelled">{t("shop.status.cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              {expandedId === order.id && (
                <TableRow key={`${order.id}-details`}>
                  <TableCell colSpan={9} className="bg-muted/30 py-3 px-6">
                    <OrderDetailsPanel order={order} t={t} />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
