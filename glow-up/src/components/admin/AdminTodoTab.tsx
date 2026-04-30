import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, Pencil, Calendar, Flag, CheckCircle2,
  Circle, ArrowUpDown, ListTodo,
} from "lucide-react";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: number;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

const PRIORITY_MAP: Record<number, { label: string; color: string; icon: string }> = {
  1: { label: "Alta", color: "text-destructive", icon: "🔴" },
  2: { label: "Media", color: "text-amber-500", icon: "🟡" },
  3: { label: "Bassa", color: "text-muted-foreground", icon: "🟢" },
};

export function AdminTodoTab() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("2");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const [sortBy, setSortBy] = useState<"priority" | "due_date" | "created_at">("priority");

  const fetchTodos = useCallback(async () => {
    const { data, error } = await supabase
      .from("admin_todos")
      .select("*")
      .order("is_completed", { ascending: true })
      .order(sortBy === "due_date" ? "due_date" : sortBy === "priority" ? "priority" : "created_at", {
        ascending: sortBy === "priority",
        nullsFirst: false,
      });

    if (error) {
      console.error(error);
    } else {
      setTodos((data as any) || []);
    }
    setLoading(false);
  }, [sortBy]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("2");
    setDueDate("");
    setEditingTodo(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || "");
    setPriority(String(todo.priority));
    setDueDate(todo.due_date || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Inserisci un titolo");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      priority: parseInt(priority),
      due_date: dueDate || null,
      updated_at: new Date().toISOString(),
    };

    if (editingTodo) {
      const { error } = await supabase
        .from("admin_todos")
        .update(payload as any)
        .eq("id", editingTodo.id);
      if (error) {
        toast.error("Errore nel salvataggio");
        return;
      }
      toast.success("Task aggiornato");
    } else {
      const { error } = await supabase
        .from("admin_todos")
        .insert({ ...payload, user_id: user?.id } as any);
      if (error) {
        toast.error("Errore nella creazione");
        return;
      }
      toast.success("Task creato");
    }

    setDialogOpen(false);
    resetForm();
    fetchTodos();
  };

  const toggleComplete = async (todo: Todo) => {
    const newCompleted = !todo.is_completed;
    const { error } = await supabase
      .from("admin_todos")
      .update({
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", todo.id);

    if (!error) {
      setTodos(prev =>
        prev.map(t => t.id === todo.id
          ? { ...t, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : t
        )
      );
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from("admin_todos").delete().eq("id", id);
    if (!error) {
      setTodos(prev => prev.filter(t => t.id !== id));
      toast.success("Task eliminato");
    }
  };

  const filtered = todos.filter(t => {
    if (filter === "active") return !t.is_completed;
    if (filter === "completed") return t.is_completed;
    return true;
  });

  const activeCount = todos.filter(t => !t.is_completed).length;
  const completedCount = todos.filter(t => t.is_completed).length;

  const isOverdue = (todo: Todo) => {
    if (!todo.due_date || todo.is_completed) return false;
    return new Date(todo.due_date) < new Date(new Date().toDateString());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            To-Do List
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} da completare · {completedCount} completati
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nuovo Task
        </Button>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="active" className="text-xs">
              <Circle className="h-3 w-3 mr-1" /> Da fare
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Completati
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">Tutti</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
            <ArrowUpDown className="h-3 w-3 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Ordina per priorità</SelectItem>
            <SelectItem value="due_date">Ordina per scadenza</SelectItem>
            <SelectItem value="created_at">Ordina per creazione</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Todo List */}
      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Caricamento...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListTodo className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {filter === "completed" ? "Nessun task completato" : "Nessun task da fare"}
            </p>
            {filter === "active" && (
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Aggiungi il primo task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((todo) => (
            <Card
              key={todo.id}
              className={`transition-all ${todo.is_completed ? "opacity-60" : ""} ${isOverdue(todo) ? "border-destructive/40" : ""}`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={todo.is_completed}
                    onCheckedChange={() => toggleComplete(todo)}
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`font-medium text-sm ${todo.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {todo.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(todo)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteTodo(todo.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PRIORITY_MAP[todo.priority]?.color}`}>
                        {PRIORITY_MAP[todo.priority]?.icon} {PRIORITY_MAP[todo.priority]?.label}
                      </Badge>
                      {todo.due_date && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 gap-1 ${isOverdue(todo) ? "border-destructive/50 text-destructive" : ""}`}
                        >
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(todo.due_date).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                        </Badge>
                      )}
                      {todo.is_completed && todo.completed_at && (
                        <span className="text-[10px] text-muted-foreground">
                          ✓ {new Date(todo.completed_at).toLocaleDateString("it-IT")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingTodo ? "Modifica Task" : "Nuovo Task"}
            </DialogTitle>
            <DialogDescription>
              {editingTodo ? "Modifica i dettagli del task" : "Aggiungi un nuovo task alla lista"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="todo-title">Titolo *</Label>
              <Input
                id="todo-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es: Aggiornare documentazione..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="todo-desc">Descrizione</Label>
              <Textarea
                id="todo-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dettagli aggiuntivi..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priorità</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <Flag className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">🔴 Alta</SelectItem>
                    <SelectItem value="2">🟡 Media</SelectItem>
                    <SelectItem value="3">🟢 Bassa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="todo-due">Scadenza</Label>
                <Input
                  id="todo-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Annulla
            </Button>
            <Button onClick={handleSave}>
              {editingTodo ? "Salva modifiche" : "Crea task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
