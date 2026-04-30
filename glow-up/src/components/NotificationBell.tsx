import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, X, Megaphone, Clock, CheckCheck, CheckCircle2, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type NotificationContext } from "@/hooks/useNotifications";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

const typeIcons: Record<string, React.ReactNode> = {
  booking: <Calendar className="h-4 w-4 text-primary" />,
  cancellation: <X className="h-4 w-4 text-destructive" />,
  reminder: <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />,
  announcement: <Megaphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
  confirmation: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
  chat: <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />,
};

interface NotificationBellProps {
  context?: NotificationContext;
}

export function NotificationBell({ context }: NotificationBellProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteOne, deleteAll } =
    useNotifications(context);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    if (!notif.is_read) markAsRead(notif.id);

    const url = (notif.data as any)?.url;
    if (url) {
      // Prevent salon users from being redirected to client portal
      if (context === "salon" && (url.startsWith("/portal") || url.startsWith("/appointment-action"))) {
        return;
      }
      setOpen(false);
      navigate(url);
    }
  };

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h4 className="font-semibold text-sm text-foreground truncate">
            {t("notifications.title")}
          </h4>
          <div className="flex items-center gap-0.5 shrink-0">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={markAllAsRead}
                title={t("notifications.markAllRead")}
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                title={t("notifications.deleteAll")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[min(24rem,60vh)]">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("notifications.noNotifications")}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.slice(0, 20).map((notif) => (
                <div
                  key={notif.id}
                  className={`w-full text-left p-3 hover:bg-muted/50 transition-colors cursor-pointer relative group ${
                    !notif.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {typeIcons[notif.type] || (
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-tight ${
                          !notif.is_read ? "font-semibold" : ""
                        } text-foreground truncate`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notif.body}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: it,
                        })}
                      </p>
                    </div>
                    <div className="flex items-start gap-1 shrink-0">
                      {!notif.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      )}
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOne(notif.id);
                        }}
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
    <ConfirmDialog
      open={confirmDelete}
      onOpenChange={setConfirmDelete}
      title={t("notifications.deleteAll")}
      description={t("notifications.deleteAllConfirm")}
      onConfirm={() => {
        deleteAll();
        setConfirmDelete(false);
      }}
    />
    </>
  );
}
