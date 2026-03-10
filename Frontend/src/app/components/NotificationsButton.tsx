import { useState, useRef, useEffect } from "react";
import { Bell, Trash2, X } from "lucide-react";

export interface Notification {
  id: number;
  title: string;
  time: string;
}

export default function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Nuevo ticket asignado: Mouse dañado",
      time: "Hace 5 minutos",
    },
    {
      id: 2,
      title: "Ticket resuelto: Configuración de email",
      time: "Hace 2 horas",
    },
    {
      id: 3,
      title: "Bienvenido al Sistema de Soporte",
      time: "Hace 1 día",
    },
  ]);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleDelete(id: number) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleClearAll() {
    setNotifications([]);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition relative"
        aria-haspopup="true"
        aria-expanded={open ? "true" : "false"}
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Desktop view */}
          <div className="hidden md:block absolute right-0 mt-2 w-80 z-50">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">
                  Notificaciones
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar notificaciones"
                  className="p-1 rounded-full hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <ul className="max-h-64 overflow-auto divide-y">
                {notifications.length === 0 ? (
                  <li className="p-4 text-sm text-gray-500 text-center">
                    No hay notificaciones
                  </li>
                ) : (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(n.id)}
                        aria-label={`Eliminar notificación ${n.id}`}
                        className="ml-2 p-1.5 rounded-md hover:bg-red-50 transition flex items-center justify-center shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <div className="p-4 flex justify-center border-t">
                <button
                  onClick={handleClearAll}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    notifications.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  disabled={notifications.length === 0}
                >
                  Borrar todo
                </button>
              </div>
            </div>
          </div>

          {/* Mobile view */}
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 md:hidden p-4">
            <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">
                  Notificaciones
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar notificaciones"
                  className="p-1 rounded-full hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <ul className="max-h-80 overflow-auto divide-y">
                {notifications.length === 0 ? (
                  <li className="p-4 text-sm text-gray-500 text-center">
                    No hay notificaciones
                  </li>
                ) : (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(n.id)}
                        aria-label={`Eliminar notificación ${n.id}`}
                        className="ml-2 p-1.5 rounded-md hover:bg-red-50 transition flex items-center justify-center shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <div className="p-4 flex justify-center border-t">
                <button
                  onClick={handleClearAll}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    notifications.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  disabled={notifications.length === 0}
                >
                  Borrar todo
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
