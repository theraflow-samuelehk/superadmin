import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Send, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useFiscalReceipts } from "@/hooks/useFiscalReceipts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Fiscale() {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useLocalization();
  const { receipts, loading, markAsSent } = useFiscalReceipts();

  const statusIcon = (status: string, sent: boolean) => {
    if (sent) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === "generated") return <Clock className="h-4 w-4 text-amber-500" />;
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const statusVariant = (status: string, sent: boolean): "default" | "secondary" | "outline" => {
    if (sent) return "default";
    if (status === "generated") return "secondary";
    return "outline";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">{t("fiscal.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("fiscal.subtitle")}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-card border-border/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{t("fiscal.totalReceipts")}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{receipts.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{t("fiscal.sentToAde")}</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {receipts.filter((r) => r.sent_to_ade).length}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{t("fiscal.pending")}</p>
              <p className="text-2xl font-bold text-amber-500 mt-1">
                {receipts.filter((r) => !r.sent_to_ade).length}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{t("fiscal.totalAmount")}</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(receipts.reduce((s, r) => s + Number(r.total), 0))}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Receipts Table */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> {t("fiscal.receiptsList")}
            </CardTitle>
            <CardDescription>{t("fiscal.receiptsListDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{t("fiscal.noReceipts")}</p>
                <p className="text-sm mt-1">{t("fiscal.noReceiptsDesc")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("fiscal.number")}</TableHead>
                    <TableHead>{t("fiscal.date")}</TableHead>
                    <TableHead>{t("fiscal.client")}</TableHead>
                    <TableHead className="text-right">{t("fiscal.netAmount")}</TableHead>
                    <TableHead className="text-right">{t("fiscal.vat")}</TableHead>
                    <TableHead className="text-right">{t("pos.total")}</TableHead>
                    <TableHead>{t("admin.status")}</TableHead>
                    <TableHead>{t("admin.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.receipt_number}</TableCell>
                      <TableCell className="text-sm">{formatDate(new Date(r.receipt_date))}</TableCell>
                      <TableCell className="text-sm">{r.client_name || "—"}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(Number(r.subtotal))}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatCurrency(Number(r.vat_amount))} ({r.vat_rate}%)
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">{formatCurrency(Number(r.total))}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status, r.sent_to_ade)} className="gap-1 text-xs">
                          {statusIcon(r.status, r.sent_to_ade)}
                          {r.sent_to_ade ? t("fiscal.sent") : t("fiscal.toSend")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!r.sent_to_ade && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => markAsSent(r.id)}
                          >
                            <Send className="h-3.5 w-3.5" /> {t("fiscal.markSent")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
