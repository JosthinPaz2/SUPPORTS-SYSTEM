import { useState, useRef, useEffect } from "react";
import { Bell, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../utils/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface Notification {
  id: number;
  title: string;
  time: string;
  read: boolean;
  actionType?: string;
  severity?: string;
  ticketId?: number;
  stationId?: string;
}

function extractTicketIdFromMessage(message: string): number | undefined {
  const match = message.match(/ticket\s*#(\d+)/i);
  if (!match) {
    return undefined;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function NotificationListItem({
  notification,
  onOpen,
  onDelete,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  onDelete: (id: number) => void;
}) {
  const linkedTicketId = notification.ticketId ?? extractTicketIdFromMessage(notification.title);
  const unreadClasses = notification.read
    ? "bg-white hover:bg-gray-50"
    : notification.severity === "critical"
      ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-500"
      : "bg-amber-50 hover:bg-amber-100 border-l-4 border-amber-400";

  return (
    <li
      key={notification.id}
      onClick={() => onOpen(notification)}
      className={`flex items-start gap-3 px-4 py-3 transition ${linkedTicketId ? "cursor-pointer" : "cursor-default"} ${unreadClasses}`}
    >
      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        notification.severity === "critical"
          ? "bg-red-100"
          : notification.read
            ? "bg-gray-100"
            : "bg-amber-100"
      }`}>
        <Bell
          className={`w-4 h-4 ${
            notification.severity === "critical"
              ? "text-red-600"
              : notification.read
                ? "text-gray-500"
                : "text-amber-600"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm ${notification.read ? "text-gray-700" : "font-semibold text-gray-900"}`}>
            {notification.title}
          </p>
          {!notification.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
        {linkedTicketId && (
          <p className="text-[11px] mt-1 text-gray-500">Open the related ticket.</p>
        )}
      </div>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onDelete(notification.id);
        }}
        aria-label={`Delete notification ${notification.id}`}
        className="ml-2 p-1.5 rounded-md hover:bg-red-50 transition flex items-center justify-center shrink-0"
        title="Delete"
      >
        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
      </button>
    </li>
  );
}

export default function NotificationsButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  // Cerrar notificaciones al hacer clic fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    const seenIds = new Set<number>();

    const loadNotifications = async (showErrorToast: boolean) => {
      try {
        setIsSyncing(true);
        const rows = await apiService.getNotificationsByUser(user.id);
        if (cancelled) return;

        const mapped = rows
          .slice()
          .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
          .map((row) => {
            const fallbackTicketId = extractTicketIdFromMessage(row.message);

            return {
              id: row.id_notification,
              title: row.message,
              time: new Date(row.sent_at).toLocaleString(),
              read: row.read,
              actionType: row.action_type ?? undefined,
              severity: row.severity ?? undefined,
              ticketId: row.id_ticket ?? fallbackTicketId ?? undefined,
              stationId: row.id_station ?? undefined,
            };
          });

        for (const item of mapped) {
          if (!item.read && !seenIds.has(item.id)) {
            const openTarget = () => {
              if (!item.ticketId) {
                return;
              }

              const destination = user?.id_role === 1 ? "/admin" : "/employee";
              navigate(`${destination}?ticketId=${item.ticketId}`);
              setOpen(false);
            };

            if (item.severity === "critical") {
              toast.error("Critical alert", {
                description: item.title,
                duration: 7000,
                action: item.ticketId ? {
                  label: "Open ticket",
                  onClick: openTarget,
                } : undefined,
              });
            } else {
              toast.success("New notification", {
                description: item.title,
                duration: 4500,
              });
            }
          }
          seenIds.add(item.id);
        }

        setNotifications(mapped);
      } catch (error) {
        if (showErrorToast) {
          toast.error((error as Error).message || "Could not load notifications");
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    };

    loadNotifications(false);
    const intervalId = window.setInterval(() => {
      loadNotifications(false);
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user?.id]);

  async function markNotificationAsRead(id: number) {
    try {
      await apiService.updateNotification(id, { read: true });
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      );
    } catch (error) {
      toast.error((error as Error).message || "Could not update the notification");
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      toast.error((error as Error).message || "Could not delete notification");
    }
  }

  async function handleClearAll() {
    try {
      await Promise.all(notifications.map((n) => apiService.deleteNotification(n.id)));
      setNotifications([]);
    } catch (error) {
      toast.error((error as Error).message || "Could not delete notifications");
    }
  }

  async function handleMarkAllAsRead() {
    const unreadNotifications = notifications.filter((notification) => !notification.read);
    if (unreadNotifications.length === 0) {
      return;
    }

    try {
      await Promise.all(
        unreadNotifications.map((notification) =>
          apiService.updateNotification(notification.id, { read: true }),
        ),
      );
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    } catch (error) {
      toast.error((error as Error).message || "Could not mark notifications as read");
    }
  }

  async function handleOpenNotification(notification: Notification) {
    const ticketId = notification.ticketId ?? extractTicketIdFromMessage(notification.title);

    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    if (ticketId) {
      const destination = user?.id_role === 1 ? "/admin" : "/employee";
      navigate(`${destination}?ticketId=${ticketId}`);
      setOpen(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition relative"
        aria-haspopup="true"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {unreadCount}
          </span>
        )}

        <span 
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
            isSyncing ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          title={isSyncing ? "Syncing" : "Synced"}
        />
      </button>

      {open && (
        <>
          {/* Desktop view */}
          <div className="hidden md:block absolute right-0 top-full mt-4 w-80 z-40">
            <div className="bg-white/95 rounded-xl shadow-xl overflow-hidden border border-slate-200 backdrop-blur-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">
                  Notifications
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="p-1 rounded-full hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <ul className="max-h-64 overflow-auto divide-y">
                {notifications.length === 0 ? (
                  <li className="p-4 text-sm text-gray-500 text-center">
                    No notifications
                  </li>
                ) : (
                  notifications.map((n) => (
                    <NotificationListItem
                      key={n.id}
                      notification={n}
                      onOpen={handleOpenNotification}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </ul>

              <div className="p-4 flex items-center justify-center gap-3 border-t">
                <button
                  onClick={handleMarkAllAsRead}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    unreadCount === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                  }`}
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </button>
                <button
                  onClick={handleClearAll}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    notifications.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  disabled={notifications.length === 0}
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>

          {/* Mobile view */}
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 md:hidden p-4">
            <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">
                  Notifications
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="p-1 rounded-full hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <ul className="max-h-80 overflow-auto divide-y">
                {notifications.length === 0 ? (
                  <li className="p-4 text-sm text-gray-500 text-center">
                    No notifications
                  </li>
                ) : (
                  notifications.map((n) => (
                    <NotificationListItem
                      key={n.id}
                      notification={n}
                      onOpen={handleOpenNotification}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </ul>

              <div className="p-4 flex items-center justify-center gap-3 border-t">
                <button
                  onClick={handleMarkAllAsRead}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    unreadCount === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                  }`}
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </button>
                <button
                  onClick={handleClearAll}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    notifications.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  disabled={notifications.length === 0}
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
