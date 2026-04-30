import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneCall, Calendar, CheckCircle, XCircle, Users, Clock, AlertTriangle } from "lucide-react";
import { Lead, Agent, STATUS_OPTIONS } from "./types";

interface Props {
  leads: Lead[];
  agents: Agent[];
}

export default function CallCenterDashboard({ leads, agents }: Props) {
  const statCounts = STATUS_OPTIONS.map(s => ({
    ...s,
    count: leads.filter(l => l.status === s.value).length,
  }));

  const totalCalls = leads.reduce((sum, l) => sum + l.call_attempts, 0);
  const withReminder = leads.filter(l => l.next_reminder_at && new Date(l.next_reminder_at) <= new Date()).length;
  const conversionRate = leads.length > 0
    ? Math.round((leads.filter(l => l.status === "convertito").length / leads.length) * 100)
    : 0;

  const agentStats = agents.map(a => ({
    name: a.name,
    assigned: leads.filter(l => l.assigned_agent_id === a.id).length,
    appointments: leads.filter(l => l.assigned_agent_id === a.id && l.status === "appuntamento_fissato").length,
    converted: leads.filter(l => l.assigned_agent_id === a.id && l.status === "convertito").length,
  }));

  const mainStats = [
    { label: "Lead totali", value: leads.length, icon: Users, color: "text-primary" },
    { label: "Chiamate totali", value: totalCalls, icon: PhoneCall, color: "text-blue-500" },
    { label: "Appuntamenti", value: leads.filter(l => l.status === "appuntamento_fissato").length, icon: Calendar, color: "text-emerald-500" },
    { label: "Tasso conversione", value: `${conversionRate}%`, icon: CheckCircle, color: "text-green-600" },
    { label: "Da richiamare ora", value: withReminder, icon: AlertTriangle, color: "text-orange-500" },
    { label: "Non assegnati", value: leads.filter(l => !l.assigned_agent_id).length, icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {mainStats.map(s => (
          <Card key={s.label} className="shadow-card border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status breakdown */}
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold mb-3">Lead per stato</h4>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {statCounts.map(s => (
              <div key={s.value} className="text-center p-2 rounded-lg bg-secondary/30">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${s.color} mb-1`} />
                <p className="text-lg font-bold">{s.count}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent performance */}
      {agentStats.length > 0 && (
        <Card className="shadow-card border-border/50">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-3">Performance operatrici</h4>
            <div className="space-y-2">
              {agentStats.map(a => (
                <div key={a.name} className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {a.name.charAt(0)}
                  </div>
                  <span className="font-medium flex-1">{a.name}</span>
                  <span className="text-muted-foreground">{a.assigned} assegnati</span>
                  <span className="text-emerald-500">{a.appointments} app.</span>
                  <span className="text-green-600">{a.converted} conv.</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
