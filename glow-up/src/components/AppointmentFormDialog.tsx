import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

import { AlertTriangle, Banknote, CreditCard, UserPlus, Trash2, X, Settings, ClipboardPaste, Clock, ChevronDown, Save, Lock, Unlock, Hourglass, Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useOperators } from "@/hooks/useOperators";
import { useAppointments, type Appointment } from "@/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLocalization } from "@/hooks/useLocalization";
import { useOperatorShifts } from "@/hooks/useStaffManagement";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTenantUserId } from "@/hooks/useTenantUserId";
import { format, addMinutes, parseISO, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AppointmentFieldConfig, loadFieldConfig, type FieldSetting } from "@/components/AppointmentFieldConfig";
import { ReminderTimeline } from "@/components/agenda/ReminderTimeline";
import { useReminderMode } from "@/hooks/useReminderMode";
import { useConfirmationMessage } from "@/hooks/useConfirmationMessage";
import { MessageSquare, Smartphone } from "lucide-react";


const schema = z.object({
  client_id: z.string().optional(),
  service_id: z.string().min(1),
  operator_id: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  duration: z.string().min(1),
  final_price: z.string().optional(),
  payment_method: z.enum(["cash", "card"]).optional().nullable(),
  phone_prefix: z.string().optional(),
  phone_number: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  defaultDate?: string;
  defaultTime?: string;
  defaultOperatorId?: string;
  onReschedule?: (data: { id: string; oldApt: Appointment; newPayload: Record<string, any> }) => void;
}

export default function AppointmentFormDialog({ open, onOpenChange, appointment, defaultDate, defaultTime, defaultOperatorId, onReschedule }: Props) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { clients, createClient, updateClient } = useClients();
  const { services } = useServices();
  const { operators } = useOperators();
  const { createAppointment, updateAppointment, cancelAppointment } = useAppointments();
  const [clientSearch, setClientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [clientSelectOpen, setClientSelectOpen] = useState(false);
  const [newlyCreatedClient, setNewlyCreatedClient] = useState<{id: string; name: string} | null>(null);
  const clientSearchRef = useRef<HTMLInputElement>(null);
  const serviceSearchRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(true);
  const [fieldConfigOpen, setFieldConfigOpen] = useState(false);
  const [fieldConfig, setFieldConfig] = useState<FieldSetting[]>(() => loadFieldConfig());
  const [usePackageSession, setUsePackageSession] = useState(false);
  const { tenantUserId } = useTenantUserId();
  const isMobile = useIsMobile();
  const { isManual } = useReminderMode();
  const { buildConfirmationUrls } = useConfirmationMessage();
  const confirmationAlreadySentRef = useRef(false);

  const isFieldVisible = useCallback((id: string) => {
    const f = fieldConfig.find((fc) => fc.id === id);
    return f ? f.visible : true;
  }, [fieldConfig]);

  const getFieldSetting = useCallback((id: string) => {
    return fieldConfig.find((fc) => fc.id === id) || { id, label: "", visible: true, halfWidth: false, inlineLabel: true };
  }, [fieldConfig]);
  // Auto-capitalize first letter of each word
  const capitalizeWords = (value: string) =>
    value.replace(/(?:^|\s)\S/g, (ch) => ch.toUpperCase());

  const parsePhoneParts = (phone?: string | null) => {
    const cleaned = phone?.trim();
    if (!cleaned) return { prefix: "+39", number: "" };
    if (cleaned.startsWith("+39")) {
      return { prefix: "+39", number: cleaned.slice(3).trim() };
    }
    if (cleaned.startsWith("+")) {
      const prefixMatch = cleaned.match(/^(\+\d{1,4})\s*(.*)/);
      if (prefixMatch) {
        return { prefix: prefixMatch[1], number: prefixMatch[2].trim() };
      }
    }
    return { prefix: "+39", number: cleaned };
  };

  const buildFullPhone = (prefix?: string | null, number?: string | null) => {
    const normalizedNumber = number?.trim();
    if (!normalizedNumber) return null;
    return `${prefix?.trim() || "+39"} ${normalizedNumber}`.trim();
  };

  const activeClients = clients.filter((c) => !c.deleted_at);
  const activeServices = services.filter((s) => !s.deleted_at);
  const activeOperators = operators.filter((o) => !o.deleted_at);

  // Sort clients A-Z by last_name then first_name
  const sortedClients = useMemo(() => {
    return [...activeClients].sort((a, b) => {
      const aName = `${a.first_name.toLowerCase()} ${(a.last_name || "").toLowerCase()}`;
      const bName = `${b.first_name.toLowerCase()} ${(b.last_name || "").toLowerCase()}`;
      return aName.localeCompare(bName, "it");
    });
  }, [activeClients]);

  const filteredClients = useMemo(() => {
    const search = clientSearch.toLowerCase().trim();
    if (!search) return sortedClients;
    return sortedClients.filter((c) => {
      const first = (c.first_name || "").toLowerCase();
      const last = (c.last_name || "").toLowerCase();
      const full = `${first} ${last}`;
      return first.includes(search) || last.includes(search) || full.includes(search);
    });
  }, [sortedClients, clientSearch]);

  // Check if search has no results (for smart add)
  const newClientMatchesSearch = newlyCreatedClient && !filteredClients.some(c => c.id === newlyCreatedClient.id) && newlyCreatedClient.name.toLowerCase().includes(clientSearch.toLowerCase().trim());
  const clientSearchNoResults = clientSearch.trim().length > 0 && filteredClients.length === 0 && !newClientMatchesSearch;

  const isEdit = !!appointment;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: "",
      service_id: "",
      operator_id: defaultOperatorId || activeOperators[0]?.id || "",
      date: defaultDate || format(new Date(), "yyyy-MM-dd"),
      time: defaultTime || "09:00",
      duration: "30",
      final_price: "",
      payment_method: null,
      phone_prefix: "+39",
      phone_number: "",
      notes: "",
    },
  });

  const watchedOperatorId = form.watch("operator_id");
  const watchedDate = form.watch("date");
  const watchedTime = form.watch("time");
  const watchedDuration = form.watch("duration");
  const watchedServiceId = form.watch("service_id");
  const watchedClientId = form.watch("client_id");
   const { shifts } = useOperatorShifts(watchedOperatorId || undefined);

  // Query ALL active packages for the selected client (shown as soon as client is picked)
  const allClientPackagesQuery = useQuery({
    queryKey: ["client-all-packages", watchedClientId, tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_packages")
        .select("id, name, total_sessions, used_sessions, service_id, status")
        .eq("client_id", watchedClientId!)
        .eq("user_id", tenantUserId!)
        .eq("status", "active")
        .is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!watchedClientId && watchedClientId !== "" && !!tenantUserId,
  });

  const allClientPackages = allClientPackagesQuery.data ?? [];

  // Query active package for the selected client + service (for linking)
  const activePackageQuery = useQuery({
    queryKey: ["client-active-package", watchedClientId, watchedServiceId, tenantUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_packages")
        .select("id, name, total_sessions, used_sessions, service_id, status")
        .eq("client_id", watchedClientId!)
        .eq("user_id", tenantUserId!)
        .eq("service_id", watchedServiceId!)
        .eq("status", "active")
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!watchedClientId && !!watchedServiceId && !!tenantUserId && watchedClientId !== "",
  });

  const activePackage = activePackageQuery.data;

  // Auto-check usePackageSession when a package is found
  useEffect(() => {
    if (activePackage && activePackage.used_sessions < activePackage.total_sessions) {
      setUsePackageSession(true);
    } else {
      setUsePackageSession(false);
    }
  }, [activePackage]);

  const selectedOperator = useMemo(() => {
    return activeOperators.find((o) => o.id === watchedOperatorId) || null;
  }, [activeOperators, watchedOperatorId]);

  const filteredServices = useMemo(() => {
    let list = activeServices;
    if (watchedOperatorId) {
      const op = activeOperators.find((o) => o.id === watchedOperatorId);
      if (op?.service_ids && op.service_ids.length > 0) {
        list = list.filter((s) => op.service_ids!.includes(s.id));
      }
    }
    if (serviceSearch) {
      list = list.filter((s) => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));
    }
    return list;
  }, [activeServices, activeOperators, watchedOperatorId, serviceSearch]);

  const endTimeDisplay = useMemo(() => {
    if (!watchedTime || !watchedDuration) return "";
    const dur = parseInt(watchedDuration) || 0;
    if (dur <= 0) return "";
    const [h, m] = watchedTime.split(":").map(Number);
    const totalMin = h * 60 + m + dur;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }, [watchedTime, watchedDuration]);

  const dayRange = useMemo(() => {
    if (!watchedDate) return undefined;
    return { from: `${watchedDate}T00:00:00`, to: `${watchedDate}T23:59:59` };
  }, [watchedDate]);

  const { appointments: dayAppointments } = useAppointments(dayRange);

  const overlapWarning = useMemo(() => {
    if (!watchedOperatorId || !watchedDate || !watchedTime || !watchedDuration) return null;
    const dur = parseInt(watchedDuration) || 0;
    if (dur <= 0) return null;
    const [h, m] = watchedTime.split(":").map(Number);
    const newStartMin = h * 60 + m;
    const newEndMin = newStartMin + dur;
    const conflicting = dayAppointments.filter((apt) => {
      if (appointment && apt.id === appointment.id) return false;
      if (apt.status === "cancelled") return false;
      if (apt.operator_id !== watchedOperatorId) return false;
      const aptStart = parseISO(apt.start_time);
      const aptEnd = parseISO(apt.end_time);
      const aptStartMin = aptStart.getHours() * 60 + aptStart.getMinutes();
      const aptEndMin = aptEnd.getHours() * 60 + aptEnd.getMinutes();
      return newStartMin < aptEndMin && newEndMin > aptStartMin;
    });
    if (conflicting.length === 0) return null;
    const c = conflicting[0];
    const cStart = format(parseISO(c.start_time), "HH:mm");
    const cEnd = format(parseISO(c.end_time), "HH:mm");
    const clientName = c.clients ? `${c.clients.first_name} ${c.clients.last_name || ""}`.trim() : "";
    return `${t("agenda.overlapWarning")}: ${clientName} (${cStart}–${cEnd})`;
  }, [watchedOperatorId, watchedDate, watchedTime, watchedDuration, dayAppointments, appointment, t]);

  useEffect(() => {
    if (!watchedOperatorId || !watchedServiceId) return;
    const op = activeOperators.find((o) => o.id === watchedOperatorId);
    if (op?.service_ids && op.service_ids.length > 0 && !op.service_ids.includes(watchedServiceId)) {
      form.setValue("service_id", "");
    }
  }, [watchedOperatorId]);

  const prevServiceIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!watchedServiceId) {
      prevServiceIdRef.current = watchedServiceId || null;
      return;
    }
    const svc = activeServices.find((s) => s.id === watchedServiceId);
    if (!svc) {
      // service not found — skip
      prevServiceIdRef.current = watchedServiceId;
      return;
    }
    const changed = prevServiceIdRef.current !== watchedServiceId;
    
    if (changed) {
      form.setValue("final_price", String(svc.price));
      form.setValue("duration", String(svc.duration_minutes));
      
    }
    prevServiceIdRef.current = watchedServiceId;
  }, [watchedServiceId]);

  // Track whether we just reset the form for an existing appointment
  const justResetRef = useRef(false);

  useEffect(() => {
    // Skip if we just reset the form for an existing appointment —
    // the reset already set the correct phone values
    if (justResetRef.current) {
      justResetRef.current = false;
      return;
    }

    if (watchedClientId) {
      const client = activeClients.find((c) => c.id === watchedClientId);
      if (client?.phone) {
        const { prefix, number } = parsePhoneParts(client.phone);
        form.setValue("phone_prefix", prefix);
        form.setValue("phone_number", number);
        // Lock only if client has history; will be updated when history loads
        setPhoneLocked(true);
      } else {
        // Don't clear phone if it was already set (e.g. walk-in with phone)
        const currentPhone = form.getValues("phone_number");
        if (!currentPhone) {
          form.setValue("phone_prefix", "+39");
          form.setValue("phone_number", "");
        }
        setPhoneLocked(false);
      }
    } else {
      form.setValue("phone_prefix", "+39");
      form.setValue("phone_number", "");
      setPhoneLocked(false);
    }
  }, [watchedClientId]);

  const outsideShift = useMemo(() => {
    if (!watchedOperatorId || !watchedDate || !watchedTime) return false;
    // Don't show warning for past appointments
    const appointmentStart = new Date(`${watchedDate}T${watchedTime}`);
    if (appointmentStart < new Date()) return false;
    const dateObj = new Date(`${watchedDate}T12:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();
    const dayShifts = shifts.filter((s) => s.day_of_week === dayOfWeek && s.is_active);
    if (dayShifts.length === 0) return true;
    const [timeH, timeM] = watchedTime.split(":").map(Number);
    const timeMinutes = timeH * 60 + timeM;
    return !dayShifts.some((shift) => {
      const [shStartH, shStartM] = shift.start_time.split(":").map(Number);
      const [shEndH, shEndM] = shift.end_time.split(":").map(Number);
      return timeMinutes >= shStartH * 60 + shStartM && timeMinutes < shEndH * 60 + shEndM;
    });
  }, [watchedOperatorId, watchedDate, watchedTime, shifts]);

  useEffect(() => {
    if (appointment) {
      const start = parseISO(appointment.start_time);
      const end = parseISO(appointment.end_time);
      const dur = differenceInMinutes(end, start);
      const client = activeClients.find((c) => c.id === appointment.client_id);
      const phoneSource = appointment.contact_phone || client?.phone;
      const { prefix, number } = parsePhoneParts(phoneSource);
      prevServiceIdRef.current = appointment.service_id;
      // Fallback: if final_price is NULL, use service price
      const svc = activeServices.find((s) => s.id === appointment.service_id);
      const savedPrice = appointment.final_price != null
        ? String(appointment.final_price)
        : svc ? String(svc.price) : "";
      // Prevent the watchedClientId effect from clearing the phone we're about to set
      justResetRef.current = true;
      form.reset({
        client_id: appointment.client_id,
        service_id: appointment.service_id,
        operator_id: appointment.operator_id,
        date: format(start, "yyyy-MM-dd"),
        time: format(start, "HH:mm"),
        duration: String(dur > 0 ? dur : 30),
        final_price: savedPrice,
        payment_method: (appointment.payment_method as "cash" | "card") || null,
        phone_prefix: prefix,
        phone_number: number,
        notes: appointment.notes || "",
      });
    } else {
      prevServiceIdRef.current = null;
      form.reset({
        client_id: "",
        service_id: "",
        operator_id: defaultOperatorId || activeOperators[0]?.id || "",
        date: defaultDate || format(new Date(), "yyyy-MM-dd"),
        time: defaultTime || "09:00",
        duration: "30",
        final_price: "",
        payment_method: null,
        phone_prefix: "+39",
        phone_number: "",
        notes: "",
      });
      setConfirmCancelOpen(false);
      setShowNewClient(false);
      setNewFirstName("");
      setNewLastName("");
      setNewPhone("");
      setNewlyCreatedClient(null);
      confirmationAlreadySentRef.current = false;
    }
  }, [appointment, open, defaultDate, defaultTime, defaultOperatorId]);

  // Smart client add: parse search text into first/last name
  const handleSmartAddClient = () => {
    const parts = clientSearch.trim().split(/\s+/);
    setNewFirstName(capitalizeWords(parts[0] || ""));
    setNewLastName(capitalizeWords(parts.slice(1).join(" ") || ""));
    setNewPhone("");
    setClientSelectOpen(false);
    setShowNewClient(true);
  };

  const handleCreateClient = async () => {
    if (!newFirstName.trim()) return;
    const clientName = [newFirstName.trim(), newLastName.trim()].filter(Boolean).join(" ");
    const result = await createClient.mutateAsync({
      first_name: newFirstName.trim(),
      last_name: newLastName.trim() || "",
      phone: newPhone.trim() || null,
      email: null,
      birth_date: null,
      notes: null,
      allergies: null,
      privacy_consent: false,
      source: "appointment",
    });
    const newId = result.id;
    setNewlyCreatedClient({ id: newId, name: clientName });
    setShowNewClient(false);
    setNewFirstName("");
    setNewLastName("");
    setNewPhone("");
    setClientSearch("");
    // Wait for clients query to refetch so the SelectItem exists, then set value
    await queryClient.invalidateQueries({ queryKey: ["clients"] });
    // Use setTimeout to ensure React has re-rendered with new client list
    setTimeout(() => {
      form.setValue("client_id", newId);
    }, 50);
  };

  const { formatDate } = useLocalization();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVisibleCount, setHistoryVisibleCount] = useState(10);

  // Client history: past appointments for selected client
  const clientHistoryQuery = useQuery({
    queryKey: ["client-history", watchedClientId],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd'T'00:00:00");
      const { data, error } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, status, final_price, service_id, operator_id, services(name, duration_minutes, price), operators(name, calendar_color)")
        .eq("client_id", watchedClientId!)
        .lt("start_time", today)
        .neq("status", "cancelled")
        .is("deleted_at", null)
        .order("start_time", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!watchedClientId && watchedClientId !== "",
    staleTime: 5 * 60 * 1000,
  });

  const clientHistory = clientHistoryQuery.data ?? [];

  // Auto-unlock phone when client has no history (no past appointments to update)
  useEffect(() => {
    if (watchedClientId && !clientHistoryQuery.isLoading && clientHistory.length === 0) {
      setPhoneLocked(false);
    }
  }, [watchedClientId, clientHistoryQuery.isLoading, clientHistory.length]);

  // Active reminder flow model for timeline
  const activeFlowQuery = useQuery({
    queryKey: ["active-flow-model"],
    queryFn: async () => {
      const { data: selected } = await supabase
        .from("reminder_flow_models")
        .select("id, name, flow_config")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      return selected;
    },
    staleTime: 60 * 1000,
  });

  // Fetch flow nodes for existing appointment (for timeline tooltip details)
  const flowNodesQuery = useQuery({
    queryKey: ["flow-nodes", appointment?.id],
    queryFn: async () => {
      if (!appointment?.id) return [];
      const { data: flow } = await supabase
        .from("reminder_flows")
        .select("id")
        .eq("appointment_id", appointment.id)
        .maybeSingle();
      if (!flow) return [];
      const { data: nodes } = await supabase
        .from("reminder_flow_nodes")
        .select("node_type, status, scheduled_at, push_sent_at, whatsapp_sent_at, sms_sent_at, client_acted, only_if_confirmed, only_if_no_response")
        .eq("flow_id", flow.id)
        .order("scheduled_at", { ascending: true });
      return nodes || [];
    },
    enabled: !!appointment?.id && open,
    staleTime: 5_000,
    refetchInterval: open && appointment?.id ? 5_000 : false,
    refetchIntervalInBackground: true,
  });

  const watchedPhoneNumber = form.watch("phone_number");

  const hoursUntilAppointment = useMemo(() => {
    if (!watchedDate || !watchedTime) return 48;
    const aptTime = new Date(`${watchedDate}T${watchedTime}:00`);
    return Math.max(0, differenceInMinutes(aptTime, new Date()) / 60);
  }, [watchedDate, watchedTime]);

  const createdHoursBeforeAppt = useMemo(() => {
    if (!appointment?.created_at || !watchedDate || !watchedTime) return undefined;
    const aptTime = new Date(`${watchedDate}T${watchedTime}:00`);
    const createdAt = new Date(appointment.created_at);
    return Math.max(0, differenceInMinutes(aptTime, createdAt) / 60);
  }, [appointment?.created_at, watchedDate, watchedTime]);

  const showConfirmationToast = (aptData: any, phone: string, clientName: string, serviceName: string, durationStr: string) => {
    if (!isManual || !phone || confirmationAlreadySentRef.current) return;
    const urls = buildConfirmationUrls(aptData, {
      clientName,
      serviceName,
      phone,
      duration: durationStr,
    });
    toast(t("agenda.sendConfirmation", "Invia conferma appuntamento"), {
      description: `${clientName} — ${serviceName}`,
      duration: 12000,
      action: {
        label: "WhatsApp",
        onClick: () => window.open(urls.waUrl, "_blank"),
      },
      cancel: {
        label: "SMS",
        onClick: () => window.open(urls.smsUrl, "_blank"),
      },
    });
  };

  const onSubmit = async (values: FormValues) => {
    const service = activeServices.find((s) => s.id === values.service_id);
    if (!service) return;
    const dur = parseInt(values.duration) || service.duration_minutes;
    const startTime = new Date(`${values.date}T${values.time}:00`);
    const endTime = addMinutes(startTime, dur);
    const operatorId = values.operator_id;
    const priceValue = values.final_price ? parseFloat(values.final_price) : null;
    const resolvedFinalPrice = usePackageSession && activePackage ? 0 : ((priceValue != null && !isNaN(priceValue)) ? priceValue : service.price);
    const fullPhone = buildFullPhone(values.phone_prefix, values.phone_number);
    
    const payload: any = {
      client_id: values.client_id || null,
      service_id: values.service_id,
      operator_id: operatorId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      notes: values.notes || null,
      final_price: resolvedFinalPrice,
      payment_method: values.payment_method || null,
      contact_phone: fullPhone,
    };

    // Link to package if using a session
    if (usePackageSession && activePackage) {
      payload.package_id = activePackage.id;
    }
    // Update client phone if unlocked and modified
    if (values.client_id && !phoneLocked && fullPhone) {
      try {
        await updateClient.mutateAsync({ id: values.client_id, phone: fullPhone });
      } catch (e) {
        console.warn("Failed to update client phone:", e);
      }
    }

    const clientObj = activeClients.find(c => c.id === values.client_id);
    const clientName = clientObj ? `${clientObj.first_name} ${clientObj.last_name || ""}`.trim() : "";
    const phone = fullPhone || clientObj?.phone || "";

    if (isEdit) {
      // Detect reschedule: time or operator changed
      const timeChanged = startTime.toISOString() !== appointment!.start_time || endTime.toISOString() !== appointment!.end_time;
      const operatorChanged = operatorId !== appointment!.operator_id;
      if ((timeChanged || operatorChanged) && onReschedule) {
        onReschedule({ id: appointment!.id, oldApt: appointment!, newPayload: { id: appointment!.id, ...payload } });
        if (phone) {
          showConfirmationToast(
            { ...appointment!, ...payload, id: appointment!.id },
            phone, clientName, service.name, String(dur)
          );
        }
        onOpenChange(false);
        return;
      }
      await updateAppointment.mutateAsync({ id: appointment!.id, ...payload });
    } else {
      const result = await createAppointment.mutateAsync(payload);
      if (result && phone) {
        showConfirmationToast(result, phone, clientName, service.name, String(dur));
      }
    }
    onOpenChange(false);
  };

  // Operator color for header tint
  const operatorColor = selectedOperator?.calendar_color || undefined;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-glowup-id="appointment-form-dialog"
        aria-describedby="appointment-form-dialog-description"
        className="sm:max-w-md max-w-[calc(100%-2rem)] max-h-[100dvh] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl border-0 will-change-transform data-[state=open]:animate-appointment-pop data-[state=closed]:animate-appointment-pop-out data-[state=open]:!duration-0 data-[state=closed]:!duration-0 data-[state=open]:!slide-in-from-left-0 data-[state=open]:!slide-in-from-top-0 data-[state=closed]:!slide-out-to-left-0 data-[state=closed]:!slide-out-to-top-0 [&>button:last-child]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest('[data-reminder-tooltip="true"]')) {
            e.preventDefault();
          }
        }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0" autoFocus={false}>
            {/* Colored header band with operator */}
            <div
              className="px-4 sm:px-6 pt-5 pb-3 space-y-3 shrink-0"
              style={{
                background: operatorColor
                  ? `linear-gradient(135deg, ${operatorColor}18, ${operatorColor}08)`
                  : undefined,
                borderBottom: operatorColor
                  ? `2px solid ${operatorColor}30`
                  : '1px solid hsl(var(--border))',
              }}
            >
              <DialogHeader className="p-0">
                <div className="sr-only" id="appointment-form-dialog-description">
                  {isEdit ? t("agenda.editAppointment") : t("agenda.newAppointment")}
                </div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-serif text-lg">
                    {isEdit ? t("agenda.editAppointment") : t("agenda.newAppointment")}
                  </DialogTitle>
                  {!isEdit && defaultTime && (
                    <span
                      className="text-[11px] font-medium rounded-full px-2 py-0.5 tabular-nums leading-none translate-y-[0.5px]"
                      style={{
                        backgroundColor: operatorColor ? `${operatorColor}20` : 'hsl(var(--muted))',
                        color: operatorColor || 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {defaultTime}
                    </span>
                  )}
                    <div className="ml-auto flex items-center gap-1.5">
                    {phoneLocked && watchedClientId && clientHistory.length > 0 && (
                      <button
                        type="button"
                        tabIndex={-1}
                        className="p-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => setPhoneLocked(false)}
                        title={t("agenda.unlockFields")}
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                    )}
                    {!phoneLocked && watchedClientId && clientHistory.length > 0 && (
                      <button
                        type="button"
                        tabIndex={-1}
                        className="p-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => setPhoneLocked(true)}
                        title={t("agenda.lockFields")}
                      >
                        <Unlock className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      tabIndex={-1}
                      className="p-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                       onClick={() => setFieldConfigOpen(true)}
                       title={t("fieldConfig.title")}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      className="p-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={() => onOpenChange(false)}
                      title="Chiudi"
                    >
                      <X className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </DialogHeader>

              {/* Operator badge */}
              <FormField
                control={form.control}
                name="operator_id"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                         <SelectTrigger
                          className="h-10 border-dashed hover:bg-accent/50 transition-colors rounded-xl focus:ring-0 focus:ring-offset-0"
                          style={{
                            backgroundColor: operatorColor ? `${operatorColor}12` : undefined,
                            borderColor: operatorColor ? `${operatorColor}40` : undefined,
                          }}
                        >
                          <div className="flex items-center gap-2 text-sm">
                            {selectedOperator ? (
                              <>
                                <span
                                  className="h-3.5 w-3.5 rounded-full shrink-0 ring-2 ring-background"
                                  style={{ backgroundColor: selectedOperator.calendar_color }}
                                />
                                <span className="font-medium">{selectedOperator.name}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">{t("agenda.selectOperator")}</span>
                            )}
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeOperators.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full inline-block"
                                style={{ backgroundColor: o.calendar_color }}
                              />
                              {o.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              <div className="flex flex-wrap gap-3">

              {/* Client History */}
              {isFieldVisible("client_history") && <div className={cn(getFieldSetting("client_history").halfWidth ? "w-[calc(50%-0.375rem)]" : "w-full")} style={{ order: fieldConfig.findIndex(f => f.id === "client_history") }}>
              <AnimatePresence initial={!appointment}>
              {clientHistory.length > 0 && (() => {
                const lastOp = clientHistory[0]?.operators as any;
                const lastOpName = lastOp?.name ?? "";
                const lastOpColor = lastOp?.calendar_color ?? "#8B5CF6";
                return (
                <motion.div
                  key="client-history"
                  initial={appointment ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: appointment ? 0 : 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden"
                >
                <Collapsible open={historyOpen} onOpenChange={(isOpen) => {
                  setHistoryOpen(isOpen);
                  if (!isOpen) setHistoryVisibleCount(10);
                }}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full border border-input rounded-xl h-10 px-3 bg-background text-sm hover:bg-accent/30 transition-colors whitespace-nowrap overflow-hidden">
                    <span className="shrink-0 text-sm">{t("agenda.clientHistory", { count: clientHistory.length })}</span>
                    {!historyOpen && lastOpName && (
                      <>
                        <span className="text-muted-foreground/40 shrink-0 text-xs">·</span>
                        <span className="text-xs text-muted-foreground shrink-0">{t("agenda.lastVisitWith")}</span>
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded-full border truncate"
                          style={{ color: lastOpColor, borderColor: `${lastOpColor}40` }}
                        >
                          {lastOpName}
                        </span>
                      </>
                    )}
                    <ChevronDown className={cn("h-4 w-4 ml-auto shrink-0 text-muted-foreground transition-transform duration-200", historyOpen && "rotate-180")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down data-[state=open]:duration-500"
                    style={{ '--radix-accordion-content-height': 'var(--radix-collapsible-content-height)' } as React.CSSProperties}
                  >
                    <div className="space-y-0 divide-y divide-border/50 rounded-xl border border-border/60 overflow-hidden">
                      {clientHistory.slice(0, historyVisibleCount).map((apt) => {
                        const aptDate = parseISO(apt.start_time);
                        const histDur = differenceInMinutes(parseISO(apt.end_time), aptDate);
                        const price = apt.final_price ?? (apt.services as any)?.price ?? 0;
                        const opName = (apt.operators as any)?.name ?? "—";
                        const opColor = (apt.operators as any)?.calendar_color ?? "#8B5CF6";
                        const svcName = (apt.services as any)?.name ?? "—";
                        const pmtIcon = apt.status === "completed" ? "💳" : "🕐";
                        return (
                          <div key={apt.id} className="flex flex-col gap-0.5 px-3 py-2 bg-background">
                            <div className="flex items-center gap-2">
                              <div className="w-0.5 h-8 rounded-full shrink-0" style={{ backgroundColor: opColor }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium">{format(aptDate, "dd MMM yyyy")}</span>
                                  <span
                                    className="text-xs font-medium px-1.5 py-0.5 rounded-full border"
                                    style={{ color: opColor, borderColor: `${opColor}40` }}
                                  >
                                    {opName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span>{svcName}</span>
                                  <span>🕐 {histDur >= 60 ? `${Math.floor(histDur / 60)}h${histDur % 60 > 0 ? histDur % 60 : ""}` : `${histDur}min`}</span>
                                  <span>{pmtIcon} {Number(price).toFixed(0)}€</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {historyVisibleCount < clientHistory.length && (
                        <button
                          type="button"
                          onClick={() => setHistoryVisibleCount((prev) => prev + 10)}
                          className="w-full py-2 text-xs text-primary hover:bg-accent/30 transition-colors font-medium"
                        >
                          {t("common.showMore")} ({clientHistory.length - historyVisibleCount})
                        </button>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                </motion.div>
                );
              })()}
              </AnimatePresence>
              </div>}

              {isFieldVisible("client") && <div className={cn("-mt-1", getFieldSetting("client").halfWidth ? "w-[calc(50%-0.375rem)]" : "w-full")} style={{ order: fieldConfig.findIndex(f => f.id === "client") }}>
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem className={cn(getFieldSetting("client").inlineLabel ? "flex items-center gap-3 space-y-0" : "space-y-1.5")}>
                    <FormLabel className="shrink-0 text-sm">{t("agenda.client")}</FormLabel>
                    <div className="flex-1">
                      {/* --- Shared list content rendered by both Popover & Drawer --- */}
                      {(() => {
                        const clientListContent = (
                          <div className="flex flex-col" style={{ maxHeight: isMobile ? "60vh" : undefined }}>
                            <div className="shrink-0 border-b border-border/30 px-3 py-2">
                              <Input
                                ref={clientSearchRef}
                                placeholder={t("clients.searchClient")}
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                className="h-9 text-base sm:text-sm"
                              />
                            </div>

                            <div
                              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", maxHeight: isMobile ? "calc(60vh - 52px)" : "280px" }}
                              onTouchMove={(e) => e.stopPropagation()}
                              onWheel={(e) => e.stopPropagation()}
                            >
                              <div className="p-1.5">
                                <button
                                  type="button"
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                    !field.value && "bg-primary/10 text-primary font-medium",
                                  )}
                                  onClick={() => {
                                    field.onChange("");
                                    setClientSelectOpen(false);
                                  }}
                                >
                                  <UserPlus className="h-3.5 w-3.5 shrink-0" />
                                  <span className="italic">{t("agenda.walkIn")}</span>
                                </button>

                                {newlyCreatedClient && !filteredClients.some(c => c.id === newlyCreatedClient.id) && (
                                  !clientSearch.trim() || newlyCreatedClient.name.toLowerCase().includes(clientSearch.toLowerCase().trim())
                                ) && (
                                  <button
                                    type="button"
                                    key={newlyCreatedClient.id}
                                    className={cn(
                                      "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                      field.value === newlyCreatedClient.id && "bg-primary/10 text-primary font-medium",
                                    )}
                                    onClick={() => {
                                      field.onChange(newlyCreatedClient.id);
                                      setClientSelectOpen(false);
                                    }}
                                  >
                                    {newlyCreatedClient.name}
                                  </button>
                                )}

                                {filteredClients.map((c) => {
                                  const displayFirst = c.first_name ? c.first_name.charAt(0).toUpperCase() + c.first_name.slice(1) : "";
                                  const displayLast = c.last_name ? c.last_name.charAt(0).toUpperCase() + c.last_name.slice(1) : "";
                                  const isSelected = field.value === c.id;

                                  return (
                                    <button
                                      type="button"
                                      key={c.id}
                                      className={cn(
                                        "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                        isSelected && "bg-primary/10 text-primary font-medium",
                                      )}
                                      onClick={() => {
                                        field.onChange(c.id);
                                        setClientSelectOpen(false);
                                      }}
                                    >
                                      {[displayFirst, displayLast].filter(Boolean).join(" ")}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {clientSearchNoResults && (
                              <div className="border-t border-border/30 p-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start gap-2 text-primary"
                                  onClick={handleSmartAddClient}
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  {t("agenda.addClientFromSearch", { name: clientSearch.trim() })}
                                </Button>
                              </div>
                            )}
                          </div>
                        );

                        const triggerButton = (
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={clientSelectOpen}
                            className="h-10 w-full justify-between rounded-xl border-input bg-background px-3 py-2 text-sm font-normal hover:bg-background"
                            onClick={isMobile ? () => {
                              setClientSelectOpen(true);
                              setClientSearch("");
                              setTimeout(() => clientSearchRef.current?.focus(), 300);
                            } : undefined}
                          >
                            <span className="truncate text-left">
                              {field.value
                                ? (() => {
                                    const c = activeClients.find((cl) => cl.id === field.value);
                                    if (c) return [c.first_name, c.last_name].filter(Boolean).join(" ");
                                    if (newlyCreatedClient?.id === field.value) return newlyCreatedClient.name;
                                    return t("agenda.walkIn");
                                  })()
                                : t("agenda.walkIn")}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        );

                        if (isMobile) {
                          return (
                            <>
                              <FormControl>{triggerButton}</FormControl>
                              <Drawer
                                open={clientSelectOpen}
                                onOpenChange={(isOpen) => {
                                  setClientSelectOpen(isOpen);
                                  if (isOpen) {
                                    setClientSearch("");
                                    setTimeout(() => clientSearchRef.current?.focus(), 300);
                                  }
                                }}
                              >
                                <DrawerContent className="max-h-[75vh]">
                                  <div className="px-4 pt-2 pb-1">
                                    <h3 className="text-sm font-medium text-muted-foreground">{t("agenda.client")}</h3>
                                  </div>
                                  {clientListContent}
                                </DrawerContent>
                              </Drawer>
                            </>
                          );
                        }

                        return (
                          <Popover
                            open={clientSelectOpen}
                            onOpenChange={(isOpen) => {
                              setClientSelectOpen(isOpen);
                              if (isOpen) {
                                setClientSearch("");
                                const tryFocus = () => clientSearchRef.current?.focus();
                                requestAnimationFrame(tryFocus);
                                setTimeout(tryFocus, 120);
                              }
                            }}
                          >
                            <FormControl>
                              <PopoverTrigger asChild>
                                {triggerButton}
                              </PopoverTrigger>
                            </FormControl>
                            <PopoverContent
                              align="start"
                              side="bottom"
                              sideOffset={6}
                              collisionPadding={12}
                              className="flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border/60 bg-popover p-0 shadow-lg"
                              onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                              {clientListContent}
                            </PopoverContent>
                          </Popover>
                        );
                      })()}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client packages indicator - shown as soon as client is selected */}
              {allClientPackages.length > 0 && !isEdit && (
                <div className="w-full">
                  <div className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        {t("packages.clientHasPackages", "Pacchetti attivi")} ({allClientPackages.length})
                      </span>
                    </div>
                    {allClientPackages.map((pkg) => (
                      <div key={pkg.id} className="flex items-center justify-between text-xs text-muted-foreground pl-6">
                        <span className="truncate">{pkg.name}</span>
                        <span className="font-medium text-foreground shrink-0 ml-2">
                          {pkg.used_sessions}/{pkg.total_sessions} {t("packages.sessionsUsed", "usate")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline new client creation */}
              {showNewClient && (
                <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-2">
                  <Input
                    placeholder={t("clients.firstName")}
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(capitalizeWords(e.target.value))}
                    className="h-9 flex-1 rounded-lg min-w-0"
                    autoFocus
                  />
                  <Input
                    placeholder={t("clients.lastName")}
                    value={newLastName}
                    onChange={(e) => setNewLastName(capitalizeWords(e.target.value))}
                    className="h-9 flex-1 rounded-lg min-w-0"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 shrink-0 rounded-lg"
                    onClick={handleCreateClient}
                    disabled={!newFirstName.trim() || createClient.isPending}
                  >
                    {t("common.add")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setShowNewClient(false); setNewFirstName(""); setNewLastName(""); }}
                    className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              </div>}

              {isFieldVisible("service") && <div className={cn(getFieldSetting("service").halfWidth ? "w-[calc(50%-0.375rem)]" : "w-full")} style={{ order: fieldConfig.findIndex(f => f.id === "service") }}>
              <FormField
                control={form.control}
                name="service_id"
                render={({ field }) => {
                  const selectedService = activeServices.find((sv) => sv.id === field.value);
                  return (
                    <FormItem className="space-y-0">
                      <div className={cn(getFieldSetting("service").inlineLabel ? "flex items-center gap-3" : "space-y-1.5")}>
                        <FormLabel className="shrink-0 text-sm">{t("agenda.service")}</FormLabel>
                        <div className="flex-1">
                          <Select onValueChange={field.onChange} value={field.value} onOpenChange={(isOpen) => {
                            if (isOpen) {
                              setTimeout(() => {
                                const viewports = document.querySelectorAll('[data-radix-select-viewport]');
                                const viewport = viewports[viewports.length - 1];
                                const selected = viewport?.querySelector('[data-state="checked"]');
                                selected?.scrollIntoView({ block: 'center', behavior: 'instant' });
                              }, 50);
                            }
                          }}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder={t("agenda.selectService")}>
                                  {selectedService ? selectedService.name : t("agenda.selectService")}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent position="popper" side="bottom" align="center" className="max-h-[280px] min-w-[var(--radix-select-trigger-width)] max-w-[min(28rem,calc(100vw-2rem))] w-auto !translate-x-[-1.5rem] [&>[aria-hidden]]:!hidden">
                              <div
                                className="sticky -top-1 z-10 bg-popover -mx-1 px-3 pt-2 pb-1.5 border-b border-border/30"
                                onKeyDownCapture={(e) => { if (e.target instanceof HTMLInputElement) e.stopPropagation(); }}
                                onKeyUpCapture={(e) => { if (e.target instanceof HTMLInputElement) e.stopPropagation(); }}
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <Input
                                  ref={serviceSearchRef}
                                  placeholder={t("agenda.searchService")}
                                  value={serviceSearch}
                                  onChange={(e) => {
                                    setServiceSearch(e.target.value);
                                    requestAnimationFrame(() => serviceSearchRef.current?.focus());
                                  }}
                                  className="h-8"
                                />
                              </div>
                              {filteredServices.map((s) => {
                                const isSelected = field.value === s.id;
                                return (
                                  <SelectItem key={s.id} value={s.id} className="pl-2 [&>span:first-child]:hidden">
                                    <span className="flex items-center gap-2 min-w-0 overflow-hidden">
                                      <span className={cn(
                                        "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums min-w-[2.5rem] justify-center transition-colors shrink-0",
                                        isSelected
                                          ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                                          : "bg-primary/10 text-primary"
                                      )}>
                                        €{Number(s.price).toFixed(0)}
                                      </span>
                                      <span className={cn("font-medium truncate min-w-0", isSelected && "text-primary")}>{s.name}</span>
                                      <span className="text-muted-foreground text-xs shrink-0">({s.duration_minutes}min)</span>
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </div>

                      {/* Sub-fields: Price + Time inline */}
                      <AnimatePresence>
                      {selectedService && (
                        <motion.div
                          key="service-subfields"
                          initial={appointment ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="overflow-hidden"
                        >
                        <div className="flex items-center justify-center gap-0 pt-1.5 pb-1 mt-1 border-t border-border/30 text-[13px]">
                          {/* Price */}
                          <FormField
                            control={form.control}
                            name="final_price"
                            render={({ field: priceField }) => (
                              <FormControl>
                                <div className="relative shrink-0">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px]">€</span>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    className="pl-5 w-[70px] h-8 rounded-lg text-[13px] font-medium text-center"
                                    {...priceField}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                                      priceField.onChange(val);
                                    }}
                                  />
                                </div>
                              </FormControl>
                            )}
                          />

                          <div className="h-5 w-px bg-border/50 mx-2 shrink-0" />

                          {/* Time range */}
                          <FormField
                            control={form.control}
                            name="time"
                            render={({ field: timeField }) => (
                              <FormControl>
                                <div className="flex items-center gap-1.5">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button
                                        type="button"
                                        className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-input bg-background text-[13px] font-medium tabular-nums hover:bg-accent transition-colors"
                                      >
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        {timeField.value || "00:00"}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start"
                                      onOpenAutoFocus={(e) => {
                                        e.preventDefault();
                                        setTimeout(() => {
                                          const container = (e.target as HTMLElement)?.closest('[role="dialog"]') || document;
                                          const selected = container.querySelectorAll('[data-selected="true"]');
                                          selected.forEach((el) => {
                                            el.scrollIntoView({ block: 'center', behavior: 'instant' });
                                          });
                                        }, 10);
                                      }}
                                    >
                                      <div className="flex">
                                         {/* Hours */}
                                          <div className="h-48 w-14 border-r overflow-y-auto overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}
                                            onTouchMove={(e) => e.stopPropagation()}
                                            onWheel={(e) => e.stopPropagation()}
                                          >
                                          <div className="p-1">
                                            {Array.from({ length: 24 }, (_, h) => {
                                              const hStr = String(h).padStart(2, "0");
                                              const currentH = timeField.value?.split(":")[0];
                                              const isSelected = currentH === hStr;
                                              return (
                                                <button
                                                  key={h}
                                                  type="button"
                                                  data-selected={isSelected}
                                                  className={cn(
                                                    "w-full text-center py-1.5 text-sm rounded-md transition-colors tabular-nums",
                                                    isSelected
                                                      ? "bg-primary text-primary-foreground font-medium"
                                                      : "hover:bg-accent"
                                                  )}
                                                  onClick={() => {
                                                    const currentM = timeField.value?.split(":")[1] || "00";
                                                    timeField.onChange(`${hStr}:${currentM}`);
                                                  }}
                                                >
                                                  {hStr}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                         {/* Minutes (5-min steps) */}
                                          <div className="h-48 w-14 overflow-y-auto overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}
                                            onTouchMove={(e) => e.stopPropagation()}
                                            onWheel={(e) => e.stopPropagation()}
                                          >
                                          <div className="p-1">
                                            {Array.from({ length: 12 }, (_, i) => {
                                              const m = i * 5;
                                              const mStr = String(m).padStart(2, "0");
                                              const currentM = timeField.value?.split(":")[1];
                                              const isSelected = currentM === mStr;
                                              return (
                                                <button
                                                  key={m}
                                                  type="button"
                                                  data-selected={isSelected}
                                                  className={cn(
                                                    "w-full text-center py-1.5 text-sm rounded-md transition-colors tabular-nums",
                                                    isSelected
                                                      ? "bg-primary text-primary-foreground font-medium"
                                                      : "hover:bg-accent"
                                                  )}
                                                  onClick={() => {
                                                    const currentH = timeField.value?.split(":")[0] || "09";
                                                    timeField.onChange(`${currentH}:${mStr}`);
                                                  }}
                                                >
                                                  {mStr}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  <span className="text-muted-foreground text-xs">→</span>
                                  <span className="text-[13px] font-medium tabular-nums">{endTimeDisplay || "--:--"}</span>
                                </div>
                              </FormControl>
                            )}
                          />

                          <div className="h-5 w-px bg-border/50 mx-2 shrink-0" />

                          {/* Duration badge */}
                          <span
                            className="flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap shrink-0"
                            style={{
                              backgroundColor: operatorColor ? `${operatorColor}18` : 'hsl(var(--muted))',
                              color: operatorColor || 'hsl(var(--muted-foreground))',
                            }}
                          >
                            <Hourglass className="h-3 w-3 shrink-0" />
                            {(() => {
                              const mins = parseInt(watchedDuration) || 0;
                              const h = Math.floor(mins / 60);
                              const m = mins % 60;
                              if (h > 0) return `${h}h ${m}min`;
                              return `${mins}min`;
                            })()}
                          </span>
                        </div>
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </FormItem>
                  );
                }}
              />
              </div>}

              {isFieldVisible("payment") && <div className={cn(getFieldSetting("payment").halfWidth ? "w-[calc(50%-0.375rem)]" : "w-full")} style={{ order: fieldConfig.findIndex(f => f.id === "payment") }}>
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem className={cn(getFieldSetting("payment").inlineLabel && "flex items-center gap-3 space-y-0")}>
                    <FormLabel>{t("agenda.paymentMethod")}</FormLabel>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant={field.value === "cash" ? "default" : "outline"}
                        size="sm"
                        className="h-9 flex-1 whitespace-nowrap rounded-xl"
                        onClick={() => field.onChange(field.value === "cash" ? null : "cash")}
                      >
                        <Banknote className="h-3.5 w-3.5 mr-1 shrink-0" />
                        <span className="text-xs">{t("agenda.cash")}</span>
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "card" ? "default" : "outline"}
                        size="sm"
                        className="h-9 flex-1 whitespace-nowrap rounded-xl"
                        onClick={() => field.onChange(field.value === "card" ? null : "card")}
                      >
                        <CreditCard className="h-3.5 w-3.5 mr-1 shrink-0" />
                        <span className="text-xs">{t("agenda.card")}</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>}

              {isFieldVisible("phone") && <div className={cn(getFieldSetting("phone").halfWidth ? "w-[calc(50%-0.375rem)]" : "w-full")} style={{ order: fieldConfig.findIndex(f => f.id === "phone") }}>
              <FormItem className="space-y-1.5">
                {!getFieldSetting("phone").inlineLabel && (
                  <FormLabel className={cn("text-sm text-muted-foreground", phoneLocked && watchedClientId && "text-muted-foreground/50")}>{t("agenda.phone")}</FormLabel>
                )}
                <div className="flex items-center gap-1.5 relative">
                  {getFieldSetting("phone").inlineLabel && (
                    <FormLabel className={cn("shrink-0 text-sm text-muted-foreground", phoneLocked && watchedClientId && "text-muted-foreground/50")}>{t("agenda.phone")}</FormLabel>
                  )}
                  <FormField
                    control={form.control}
                    name="phone_prefix"
                    render={({ field }) => (
                      <FormControl>
                        <Input type="tel" inputMode="tel" className={cn("w-[60px] shrink-0 text-center text-sm rounded-xl h-9", phoneLocked && watchedClientId && "bg-muted/50 text-muted-foreground/50 cursor-not-allowed")} {...field} onChange={(e) => { const val = e.target.value.replace(/[^0-9+]/g, ""); field.onChange(val); }} readOnly={phoneLocked && !!watchedClientId} tabIndex={phoneLocked && watchedClientId ? -1 : undefined} />
                      </FormControl>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormControl>
                        <div className="flex-1 relative">
                          <Input
                            ref={phoneInputRef}
                            type="tel"
                            inputMode="numeric"
                            autoComplete="off"
                            readOnly={phoneLocked && !!watchedClientId}
                            className={cn("rounded-xl h-9 pr-9", phoneLocked && watchedClientId && "bg-muted/50 text-muted-foreground/50 cursor-not-allowed")}
                            {...field}
                            onChange={(e) => {
                              if (phoneLocked && watchedClientId) return;
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              field.onChange(val);
                              setPhoneDropdownOpen(val.length >= 2);
                            }}
                            onFocus={() => {
                              if (phoneLocked && watchedClientId) return;
                              if (field.value && field.value.length >= 2) setPhoneDropdownOpen(true);
                            }}
                            onBlur={() => setTimeout(() => setPhoneDropdownOpen(false), 150)}
                          />
                          {!(phoneLocked && watchedClientId) && (
                            <button
                              type="button"
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Incolla"
                              onClick={async () => {
                                try {
                                  const text = await navigator.clipboard.readText();
                                  const cleaned = text.replace(/\s/g, "");
                                  if (cleaned.startsWith("+39")) {
                                    form.setValue("phone_prefix", "+39");
                                    form.setValue("phone_number", cleaned.slice(3));
                                  } else if (cleaned.startsWith("+")) {
                                    const match = cleaned.match(/^(\+\d{1,4})(.*)/);
                                    if (match) {
                                      form.setValue("phone_prefix", match[1]);
                                      form.setValue("phone_number", match[2]);
                                    }
                                  } else {
                                    form.setValue("phone_number", cleaned);
                                  }
                                } catch {
                                  toast.error("Impossibile incollare");
                                }
                              }}
                            >
                              <ClipboardPaste className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {/* Phone search dropdown */}
                          {phoneDropdownOpen && field.value && field.value.length >= 2 && (() => {
                            const phoneSearch = field.value.replace(/\s/g, "");
                            const matches = activeClients.filter((c) => {
                              if (!c.phone) return false;
                              return c.phone.replace(/\s/g, "").includes(phoneSearch);
                            }).slice(0, 5);
                            if (matches.length === 0) return null;
                            return (
                              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border bg-popover shadow-lg overflow-hidden">
                                {matches.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between gap-2"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      form.setValue("client_id", c.id);
                                      form.setValue("phone_number", (c.phone || "").replace(/^\+39\s?/, ""));
                                      setPhoneDropdownOpen(false);
                                    }}
                                  >
                                    <span className="font-medium">{[c.first_name, c.last_name].filter(Boolean).join(" ")}</span>
                                    <span className="text-muted-foreground text-xs">{c.phone}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </FormControl>
                    )}
                  />
                </div>
              </FormItem>
              {/* Reminder Timeline */}
              <AnimatePresence>
                {(watchedPhoneNumber || "").length > 0 && activeFlowQuery.data && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="overflow-hidden mt-1"
                  >
                    <ReminderTimeline
                      flowModel={activeFlowQuery.data as any}
                      hoursUntil={hoursUntilAppointment}
                      operatorColor={operatorColor}
                      confirmationReady={(watchedPhoneNumber || "").length > 0}
                      flowNodes={flowNodesQuery.data as any}
                      createdHoursBeforeAppt={createdHoursBeforeAppt}
                      manualSendEnabled={isManual && !!buildFullPhone(form.getValues("phone_prefix"), form.getValues("phone_number"))}
                      getMessageLinks={() => {
                        const values = form.getValues();
                        const fullPhone = buildFullPhone(values.phone_prefix, values.phone_number);
                        const clientObj = activeClients.find(c => c.id === (appointment?.client_id || values.client_id));
                        const serviceObj = activeServices.find(s => s.id === (appointment?.service_id || values.service_id));
                        const phone = fullPhone || appointment?.contact_phone || clientObj?.phone;
                        if (!phone) return null;
                        const clientName = clientObj ? `${clientObj.first_name} ${clientObj.last_name || ""}`.trim() : "";
                        const serviceName = serviceObj?.name || "";
                        const dur = serviceObj ? String(serviceObj.duration_minutes) : "";
                        const aptForUrl = appointment || {
                          id: "new",
                          short_code: "",
                          start_time: `${values.date}T${values.time}:00`,
                          end_time: `${values.date}T${values.time}:00`,
                        };
                        const urls = buildConfirmationUrls(aptForUrl, { clientName, serviceName, phone, duration: dur });
                        return {
                          whatsapp: urls.waUrl,
                          sms: urls.smsUrl,
                        };
                      }}
                      onSendMessage={() => {
                        confirmationAlreadySentRef.current = true;
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              </div>}

              {isFieldVisible("notes") && <div className={cn(getFieldSetting("notes").halfWidth ? "w-[calc(50%-0.375rem)]" : "w-full")} style={{ order: fieldConfig.findIndex(f => f.id === "notes") }}>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className={cn(getFieldSetting("notes").inlineLabel && "flex items-center gap-3 space-y-0")}>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder={t("agenda.notesPlaceholder")} className="rounded-xl min-h-[60px] text-sm placeholder:text-muted-foreground/40 placeholder:italic py-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>}


              <input type="hidden" {...form.register("date")} />
              <input type="hidden" {...form.register("duration")} />

              {/* Package indicator */}
              {activePackage && !isEdit && (
                <div style={{ order: 998 }} className="w-full">
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {t("packages.activePackage")} ({activePackage.used_sessions}/{activePackage.total_sessions} {t("packages.sessionsUsed")})
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={usePackageSession}
                        onCheckedChange={(v) => setUsePackageSession(!!v)}
                      />
                      <span className="text-xs text-muted-foreground">{t("packages.useSession")}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Warnings — always last via high order */}
              {(overlapWarning || (outsideShift && watchedOperatorId)) && (
                <div style={{ order: 999 }} className="w-full space-y-2">
                  {overlapWarning && (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 rounded-xl">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">⚠️ {overlapWarning}</AlertDescription>
                    </Alert>
                  )}
                  {outsideShift && watchedOperatorId && (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 rounded-xl">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {t("agenda.outsideShiftWarning")}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-t border-border/50 bg-muted/30 shrink-0">
              {isEdit ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmCancelOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    {t("common.delete")}
                  </Button>
                  <Button type="submit" size="sm" className="flex-1 rounded-xl" disabled={updateAppointment.isPending}>
                    <Save className="h-4 w-4 mr-1.5" />
                    {t("common.saveShort")}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" size="sm" className="flex-1 rounded-xl" disabled={createAppointment.isPending}>
                    {t("agenda.createAppointment")}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>

        {isEdit && appointment && (
          <ConfirmDialog
            open={confirmCancelOpen}
            onOpenChange={setConfirmCancelOpen}
            title={t("agenda.deleteAppointment")}
            description={t("agenda.confirmDelete")}
            onConfirm={async () => {
              await cancelAppointment.mutateAsync(appointment.id);
              setConfirmCancelOpen(false);
              onOpenChange(false);
            }}
          />
        )}

      </DialogContent>
    </Dialog>

    <AppointmentFieldConfig
      open={fieldConfigOpen}
      onOpenChange={setFieldConfigOpen}
      onSave={setFieldConfig}
      currentFields={fieldConfig}
    />
    </>
  );
}
