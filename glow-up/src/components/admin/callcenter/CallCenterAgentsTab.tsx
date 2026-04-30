import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Agent, AgentAvailability, DAY_NAMES, AGENT_ROLES } from "./types";

interface Props {
  agents: Agent[];
  onAgentsChanged: () => void;
}

export default function CallCenterAgentsTab({ agents, onAgentsChanged }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("call_center");
  const [saving, setSaving] = useState(false);
  const [availabilities, setAvailabilities] = useState<Record<string, AgentAvailability[]>>({});
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const loadAvailabilities = useCallback(async () => {
    const { data } = await supabase.from("call_center_agent_availability").select("*");
    const map: Record<string, AgentAvailability[]> = {};
    (data || []).forEach((a: any) => {
      if (!map[a.agent_id]) map[a.agent_id] = [];
      map[a.agent_id].push(a);
    });
    setAvailabilities(map);
  }, []);

  useEffect(() => { loadAvailabilities(); }, [loadAvailabilities]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Inserisci un nome"); return; }
    setSaving(true);

    if (editAgent) {
      await supabase.from("call_center_agents").update({ name, email: email || null, phone: phone || null, role } as any).eq("id", editAgent.id);
      toast.success("Operatrice aggiornata");
    } else {
      await supabase.from("call_center_agents").insert({ name, email: email || null, phone: phone || null, role } as any);
      toast.success("Operatrice aggiunta");
    }

    setSaving(false);
    resetForm();
    onAgentsChanged();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditAgent(null);
    setName("");
    setEmail("");
    setPhone("");
    setRole("call_center");
  };

  const handleToggleActive = async (agent: Agent) => {
    await supabase.from("call_center_agents").update({ is_active: !agent.is_active } as any).eq("id", agent.id);
    onAgentsChanged();
  };

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Eliminare ${agent.name}?`)) return;
    await supabase.from("call_center_agents").delete().eq("id", agent.id);
    toast.success("Operatrice eliminata");
    onAgentsChanged();
  };

  const handleSaveAvailability = async (
    agentId: string, dayOfWeek: number,
    fields: Partial<{ start_time: string; end_time: string; is_active: boolean; dual_slot: boolean; start_time_2: string; end_time_2: string }>
  ) => {
    const existing = availabilities[agentId]?.find(a => a.day_of_week === dayOfWeek);
    if (existing) {
      await supabase.from("call_center_agent_availability")
        .update(fields as any)
        .eq("id", existing.id);
    } else {
      await supabase.from("call_center_agent_availability")
        .insert({ agent_id: agentId, day_of_week: dayOfWeek, start_time: "09:00", end_time: "13:00", is_active: true, ...fields } as any);
    }
    loadAvailabilities();
    toast.success("Disponibilità aggiornata");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Operatrici Call Center</h3>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <UserPlus className="h-4 w-4 mr-1" /> Aggiungi
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nessuna operatrice. Aggiungine una per iniziare.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {agents.map(agent => {
            const avail = availabilities[agent.id] || [];
            const activeDays = avail.filter(a => a.is_active).length;
            return (
              <Card key={agent.id} className="shadow-card border-border/50">
                <CardContent className="p-3 sm:p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {AGENT_ROLES.find(r => r.value === agent.role)?.label || agent.role} · {activeDays}/7 giorni
                        {agent.email && ` · ${agent.email}`}
                      </p>
                    </div>
                    <Badge variant={agent.is_active ? "default" : "secondary"} className="text-[10px] shrink-0">
                      {agent.is_active ? "Attiva" : "Inattiva"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <Switch checked={agent.is_active} onCheckedChange={() => handleToggleActive(agent)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditAgent(agent); setName(agent.name); setEmail(agent.email || ""); setPhone(agent.phone || ""); setRole(agent.role || "call_center"); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(agent)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setSelectedAgent(agent)}>
                      Orari
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Agent Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) resetForm(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editAgent ? "Modifica operatrice" : "Nuova operatrice"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome *" value={name} onChange={(e) => setName(e.target.value)} />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Ruolo" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Telefono" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={resetForm}>Annulla</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={(o) => { if (!o) setSelectedAgent(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Disponibilità — {selectedAgent?.name}</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 0].map(day => {
                const avail = availabilities[selectedAgent.id]?.find(a => a.day_of_week === day);
                const isActive = avail?.is_active ?? false;
                const startTime = avail?.start_time || "09:00";
                const endTime = avail?.end_time || "13:00";
                const dualSlot = avail?.dual_slot ?? false;
                const startTime2 = avail?.start_time_2 || "14:00";
                const endTime2 = avail?.end_time_2 || "18:00";

                return (
                  <div key={day} className="rounded-lg border border-border/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked) => handleSaveAvailability(selectedAgent.id, day, { is_active: checked })}
                        />
                        <span className="text-sm font-medium w-8">{DAY_NAMES[day]}</span>
                      </div>
                      {isActive && (
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Switch
                            checked={dualSlot}
                            onCheckedChange={(checked) => handleSaveAvailability(selectedAgent.id, day, { dual_slot: checked })}
                            className="scale-75"
                          />
                          <span className="text-xs text-muted-foreground">2 fasce</span>
                        </label>
                      )}
                    </div>
                    {isActive && (
                      <div className="space-y-2 pl-1">
                        <div className="flex items-center gap-2">
                          {dualSlot && <span className="text-[10px] text-muted-foreground w-6">AM</span>}
                          <Input type="time" className="w-28 text-sm h-8" value={startTime}
                            onChange={(e) => handleSaveAvailability(selectedAgent.id, day, { start_time: e.target.value })} />
                          <span className="text-muted-foreground text-sm">—</span>
                          <Input type="time" className="w-28 text-sm h-8" value={endTime}
                            onChange={(e) => handleSaveAvailability(selectedAgent.id, day, { end_time: e.target.value })} />
                        </div>
                        {dualSlot && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-6">PM</span>
                            <Input type="time" className="w-28 text-sm h-8" value={startTime2}
                              onChange={(e) => handleSaveAvailability(selectedAgent.id, day, { start_time_2: e.target.value })} />
                            <span className="text-muted-foreground text-sm">—</span>
                            <Input type="time" className="w-28 text-sm h-8" value={endTime2}
                              onChange={(e) => handleSaveAvailability(selectedAgent.id, day, { end_time_2: e.target.value })} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
