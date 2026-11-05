import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Calendar,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Info,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getNotificationsForRole,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
} from "@/lib/notifications";
import type { UserRole } from "@/lib/types";

interface NotificationsCenterProps {
  role: UserRole;
  onSelectCase?: (caseId: string) => void;
  onOpenAgenda?: () => void;
}

export function NotificationsCenter({
  role,
  onSelectCase,
  onOpenAgenda,
}: NotificationsCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "alerts" | "citas">("all");

  const loadNotifications = useCallback(() => {
    setNotifications(getNotificationsForRole(role));
  }, [role]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "alerts") {
      return n.type === "alerta_roja" || n.type === "alerta_amarilla";
    }
    if (filter === "citas") {
      return n.type === "cita_nueva" || n.type === "cita_recordatorio";
    }
    return true;
  });

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    markNotificationAsRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(role);
    loadNotifications();
    toast.success("Todas las notificaciones marcadas como leídas");
  };

  const handleAction = (notif: AppNotification) => {
    handleMarkAsRead(notif.id);
    if (notif.caseId && onSelectCase) {
      setIsOpen(false);
      onSelectCase(notif.caseId);
      return;
    }
    if ((notif.type === "cita_nueva" || notif.type === "cita_recordatorio") && onOpenAgenda) {
      setIsOpen(false);
      onOpenAgenda();
      return;
    }
    toast.info(notif.title, { description: notif.message });
  };

  const renderIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "alerta_roja":
        return <ShieldAlert className="size-5 text-pink-500" />;
      case "alerta_amarilla":
        return <AlertTriangle className="size-5 text-lime-600" />;
      case "cita_nueva":
      case "cita_recordatorio":
        return <Calendar className="size-5 text-teal" />;
      case "checkin_nuevo":
        return <Sparkles className="size-5 text-violet-500" />;
      default:
        return <Info className="size-5 text-muted-foreground" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Centro de notificaciones y alertas"
          className="relative rounded-full bg-card/80 transition-colors hover:bg-card shadow-sm"
        >
          <Bell className="size-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-pink-400 text-[10px] font-bold text-white shadow-sm ring-2 ring-card animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-border bg-card p-0 flex flex-col h-full"
      >
        <SheetHeader className="p-5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent">
                <Bell className="size-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-foreground">
                  Notificaciones
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} pendientes de atención`
                    : "Estás al día con tus avisos"}
                </SheetDescription>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2"
              >
                <CheckCheck className="size-3.5" />
                <span>Marcar leídas</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5 pt-3">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className={`h-7 rounded-lg text-xs px-2.5 ${
                filter === "all" ? "bg-primary text-primary-foreground" : "bg-card/70"
              }`}
            >
              Todas ({notifications.length})
            </Button>
            <Button
              size="sm"
              variant={filter === "alerts" ? "default" : "outline"}
              onClick={() => setFilter("alerts")}
              className={`h-7 rounded-lg text-xs px-2.5 ${
                filter === "alerts" ? "bg-pink-400 text-white" : "bg-card/70"
              }`}
            >
              Alertas ({notifications.filter((n) => n.type.startsWith("alerta")).length})
            </Button>
            <Button
              size="sm"
              variant={filter === "citas" ? "default" : "outline"}
              onClick={() => setFilter("citas")}
              className={`h-7 rounded-lg text-xs px-2.5 ${
                filter === "citas" ? "bg-teal text-white" : "bg-card/70"
              }`}
            >
              Citas ({notifications.filter((n) => n.type.startsWith("cita")).length})
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <div className="grid size-14 place-items-center rounded-2xl bg-muted/40 mb-3 text-muted-foreground">
                <Inbox className="size-7" />
              </div>
              <p className="text-sm font-semibold text-foreground">No hay notificaciones</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                No tienes alertas en este filtro en este momento.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isAlert = notif.type === "alerta_roja";
              return (
                <div
                  key={notif.id}
                  onClick={() => handleAction(notif)}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                    notif.read
                      ? "bg-card/50 border-border/50 hover:bg-card hover:border-border"
                      : isAlert
                        ? "bg-pink-50/70 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800/50 shadow-sm"
                        : "bg-lavender-soft/70 border-accent/20 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                        isAlert
                          ? "bg-pink-100 dark:bg-pink-800/40"
                          : notif.type.startsWith("cita")
                            ? "bg-teal/15"
                            : "bg-accent/15"
                      }`}
                    >
                      {renderIcon(notif.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs font-bold truncate ${
                            !notif.read ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between pt-1">
                        {notif.actionLabel ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent group-hover:underline">
                            {notif.actionLabel}
                            <ChevronRight className="size-3" />
                          </span>
                        ) : (
                          <span />
                        )}

                        {!notif.read && (
                          <span className="size-2 rounded-full bg-accent ring-2 ring-card shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
