import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Merge, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Client } from "@/hooks/useClients";

interface DuplicateGroup {
  key: string;
  name: string;
  clients: Client[];
}

const DISMISSED_KEY = "glowup_dismissed_duplicates";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

function dismissGroup(key: string) {
  const dismissed = getDismissed();
  if (!dismissed.includes(key)) {
    dismissed.push(key);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

export default function ClientDuplicatesTab({ clients }: { clients: Client[] }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [merging, setMerging] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<DuplicateGroup | null>(null);
  const [selectedPrimary, setSelectedPrimary] = useState<string>("");
  const [dismissedKeys, setDismissedKeys] = useState<string[]>(getDismissed());

  const duplicateGroups = useMemo<DuplicateGroup[]>(() => {
    const active = clients.filter((c) => !c.deleted_at);
    const groups = new Map<string, Client[]>();

    for (const c of active) {
      const key = `${(c.first_name || "").trim().toLowerCase()}_${(c.last_name || "").trim().toLowerCase()}`;
      if (!key || key === "_") continue;
      const existing = groups.get(key) || [];
      existing.push(c);
      groups.set(key, existing);
    }

    return Array.from(groups.entries())
      .filter(([key, items]) => items.length >= 2 && !dismissedKeys.includes(key))
      .map(([key, items]) => ({
        key,
        name: `${items[0].first_name} ${items[0].last_name}`.trim(),
        clients: items,
      }));
  }, [clients, dismissedKeys]);

  const handleMerge = async () => {
    if (!mergeTarget || !selectedPrimary) return;
    setMerging(true);
    try {
      const secondaryIds = mergeTarget.clients
        .filter((c) => c.id !== selectedPrimary)
        .map((c) => c.id);

      for (const secondaryId of secondaryIds) {
        const { data, error } = await supabase.functions.invoke("merge-clients", {
          body: { primary_id: selectedPrimary, secondary_id: secondaryId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      toast.success(t("clients.mergeSuccess"));
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setMergeTarget(null);
      setSelectedPrimary("");
    } catch (err: any) {
      toast.error(err.message || t("common.error"));
    } finally {
      setMerging(false);
    }
  };

  const handleDismiss = (key: string) => {
    dismissGroup(key);
    setDismissedKeys([...dismissedKeys, key]);
  };

  if (duplicateGroups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {t("clients.noDuplicates")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("clients.duplicatesHint")}</p>
      {duplicateGroups.map((group) => (
        <Card key={group.key} className="shadow-card border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{t("clients.possibleDuplicate")}</Badge>
                <p className="font-semibold text-foreground">{group.name}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDismiss(group.key)}
                  className="text-xs gap-1"
                >
                  <X className="h-3 w-3" />
                  {t("clients.ignoreDuplicate")}
                </Button>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => {
                    setMergeTarget(group);
                    setSelectedPrimary(group.clients[0].id);
                  }}
                  className="text-xs gap-1"
                >
                  <Merge className="h-3 w-3" />
                  {t("clients.merge")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.clients.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg border border-border/50 bg-secondary/30 space-y-1.5"
                >
                  {c.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium text-foreground">{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span>{c.email}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("clients.createdAt")}: {new Date(c.created_at).toLocaleDateString("it-IT")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Merge confirmation dialog */}
      {mergeTarget && (
        <ConfirmDialog
          open={!!mergeTarget}
          onOpenChange={(open) => {
            if (!open) {
              setMergeTarget(null);
              setSelectedPrimary("");
            }
          }}
          title={t("clients.mergeTitle")}
          description={t("clients.mergeDescription")}
          onConfirm={handleMerge}
        />
      )}
    </div>
  );
}

