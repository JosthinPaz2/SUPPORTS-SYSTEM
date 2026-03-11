import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileSpreadsheet, X } from "lucide-react";
import { exportPDF } from "../utils/exportPDF";
import { exportExcel } from "../utils/exportExcel";

interface Props {
  tickets: any[];
}

export default function DownloadButtons({ tickets }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition relative"
        aria-haspopup="true"
        aria-expanded={open ? "true" : "false"}
        aria-label="Exportar"
      >
        <Download className="w-5 h-5 text-gray-600" />
      </button>

      {open && (
        <>
          {/* Desktop view */}
          <div className="hidden md:block absolute right-0 mt-2 w-48 z-50">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                  className="p-1 rounded-full hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    exportPDF(tickets);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm text-gray-700">PDF</span>
                </button>

                <button
                  onClick={() => {
                    exportExcel(tickets);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile view */}
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 md:hidden p-4">
            <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">
                  Exportar
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                  className="p-1 rounded-full hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="py-2">
                <button
                  onClick={() => {
                    exportPDF(tickets);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm text-gray-700">PDF</span>
                </button>

                <button
                  onClick={() => {
                    exportExcel(tickets);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">Excel</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
