import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useTranslation } from "react-i18next";
import { useChat, useCreateConversation, ChatConversation } from "@/hooks/useChat";
import { ChatConversationList } from "@/components/chat/ChatConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClients } from "@/hooks/useClients";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

export default function Chat() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { conversations, deleteConversation } = useChat();
  const createConversation = useCreateConversation();
  const { clients } = useClients();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  const selected = conversations.data?.find((c) => c.id === selectedId) || null;

  const handleSelectConversation = (id: string) => setSelectedId(id);

  const handleNewChat = async (clientId: string) => {
    const convoId = await createConversation.mutateAsync(clientId);
    setSelectedId(convoId);
    setShowNewChat(false);
  };

  const handleDeleteChat = (id: string) => {
    deleteConversation.mutate(id);
    setSelectedId(null);
  };

  const activeClients = (clients || []).filter((c: any) => !c.deleted_at);
  const filteredClients = activeClients.filter((c: any) =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Mobile: show either list or chat
  if (isMobile) {
    return (
       <DashboardLayout>
         <div className="-m-4 sm:-m-6 flex flex-col min-h-0 overflow-hidden overscroll-none" style={{ height: "calc(100dvh - 3.5rem - 3.5rem)" }}>
          {selected ? (
            <div className="flex flex-col h-full min-h-0">
              <ChatWindow
                conversation={selected}
                senderType="salon"
                onBack={() => setSelectedId(null)}
                onDelete={handleDeleteChat}
              />
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                   <h1 className="text-lg font-semibold">{t("chat.title")}</h1>
                  <p className="text-xs text-muted-foreground">{t("chat.subtitle")}</p>
                </div>
                <Button size="icon" variant="outline" onClick={() => setShowNewChat(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ChatConversationList
                conversations={conversations.data || []}
                selectedId={selectedId}
                onSelect={handleSelectConversation}
                loading={conversations.isLoading}
              />
            </div>
          )}
        </div>
        <NewChatDialog
          open={showNewChat}
          onOpenChange={setShowNewChat}
          clients={filteredClients}
          search={clientSearch}
          onSearchChange={setClientSearch}
          onSelect={handleNewChat}
          t={t}
        />
      </DashboardLayout>
    );
  }

  // Desktop: split view
  return (
    <DashboardLayout>
      <div className="-m-4 sm:-m-6 flex min-h-0 overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>
        <div className="w-80 shrink-0 flex flex-col min-h-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-lg font-semibold">{t("chat.title")}</h1>
            <Button size="icon" variant="outline" onClick={() => setShowNewChat(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ChatConversationList
            conversations={conversations.data || []}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            loading={conversations.isLoading}
          />
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {selected ? (
            <ChatWindow conversation={selected} senderType="salon" onDelete={handleDeleteChat} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t("chat.noConversations")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <NewChatDialog
        open={showNewChat}
        onOpenChange={setShowNewChat}
        clients={filteredClients}
        search={clientSearch}
        onSearchChange={setClientSearch}
        onSelect={handleNewChat}
        t={t}
      />
    </DashboardLayout>
  );
}

function NewChatDialog({ open, onOpenChange, clients, search, onSearchChange, onSelect, t }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("chat.newChat")}</DialogTitle>
        </DialogHeader>
        <Input
          placeholder={t("chat.selectClient")}
          value={search}
          onChange={(e: any) => onSearchChange(e.target.value)}
        />
        <ScrollArea className="max-h-64">
          {clients.map((c: any) => (
            <button
              key={c.id}
              className="w-full text-left p-2 hover:bg-muted rounded text-sm"
              onClick={() => onSelect(c.id)}
            >
              {c.first_name} {c.last_name}
            </button>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
