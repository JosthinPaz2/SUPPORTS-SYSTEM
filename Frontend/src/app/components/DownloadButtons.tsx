import { useMemo, useState, useRef, useEffect } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  X,
  CalendarRange,
  ListFilter,
  CheckSquare,
} from "lucide-react";
import { exportPDF } from "../utils/exportPDF";
import { exportExcel } from "../utils/exportExcel";
import { Ticket } from "../types/ticket";
import { toast } from "sonner";
import { formatBogotaDateTime } from "../utils/datetime";

interface Props {
  tickets: Ticket[];
}

type ExportColumn = {
  key: string;
  label: string;
};

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "id", label: "Ticket ID" },
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "categoryDetail", label: "Category Detail" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "createdBy", label: "Created By (ID)" },
  { key: "createdByName", label: "Created By" },
  { key: "reportedBy", label: "Reported By" },
  { key: "location", label: "Location" },
  { key: "assignedTo", label: "Primary Technician (ID)" },
  { key: "assignedToName", label: "Primary Technician" },
  { key: "secondaryTechnicianId", label: "Secondary Technician (ID)" },
  { key: "secondaryTechnicianName", label: "Secondary Technician" },
  { key: "movedBy", label: "Moved By (ID)" },
  { key: "movedByName", label: "Moved By" },
  { key: "commentsCount", label: "Comments Count" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" },
];

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeStatus(status: Ticket["status"]): string {
  if (status === "in-progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  return "Pending";
}

function normalizePriority(priority: Ticket["priority"]): string {
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

function normalizeCategory(category: Ticket["category"]): string {
  if (category === "hardware") return "Hardware";
  if (category === "software") return "Software";
  return "Other";
}

export default function DownloadButtons({ tickets }: Props) {
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXPORT_COLUMNS.map((column) => column.key),
  );
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const preparedRows = useMemo(() => {
    return tickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description ?? "-",
      category: normalizeCategory(ticket.category),
      categoryDetail: ticket.categoryDetail ?? "-",
      status: normalizeStatus(ticket.status),
      priority: normalizePriority(ticket.priority),
      createdBy: ticket.createdBy,
      createdByName: ticket.createdByName ?? "-",
      reportedBy: ticket.reportedBy ?? "-",
      location: ticket.location ?? "-",
      assignedTo: ticket.assignedTo ?? "-",
      assignedToName: ticket.assignedToName ?? "-",
      secondaryTechnicianId: ticket.secondaryTechnicianId ?? "-",
      secondaryTechnicianName: ticket.secondaryTechnicianName ?? "-",
      movedBy: ticket.movedBy ?? "-",
      movedByName: ticket.movedByName ?? "-",
      commentsCount: ticket.comments.length,
      createdAt: formatBogotaDateTime(ticket.createdAt),
      updatedAt: formatBogotaDateTime(ticket.updatedAt),
      createdAtDate: ticket.createdAt,
    }));
  }, [tickets]);

  const filteredRows = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    return preparedRows.filter((row) => {
      const created = row.createdAtDate;
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }, [preparedRows, fromDate, toDate]);

  const columnsToExport = useMemo(
    () => EXPORT_COLUMNS.filter((column) => selectedColumns.includes(column.key)),
    [selectedColumns],
  );

  const rowsForExport = useMemo(() => {
    return filteredRows.map(({ createdAtDate: _omit, ...rest }) => rest);
  }, [filteredRows]);

  const dateFilterLabel = useMemo(() => {
    if (!fromDate && !toDate) return "All dates";
    if (fromDate && toDate) return `${fromDate} to ${toDate}`;
    if (fromDate) return `From ${fromDate}`;
    return `Until ${toDate}`;
  }, [fromDate, toDate]);

  const canExport = rowsForExport.length > 0 && columnsToExport.length > 0;

  function toggleColumn(columnKey: string) {
    setSelectedColumns((previous) => {
      if (previous.includes(columnKey)) {
        return previous.filter((key) => key !== columnKey);
      }
      return [...previous, columnKey];
    });
  }

  async function runExport(type: "pdf" | "excel") {
    if (columnsToExport.length === 0) {
      toast.error("Select at least one column to export.");
      return;
    }

    if (rowsForExport.length === 0) {
      toast.error("No tickets match the selected date range.");
      return;
    }

    const fileSuffix = toDateInputValue(new Date());
    const fileName = `tickets-report-${fileSuffix}`;

    try {
      if (type === "pdf") {
        exportPDF(rowsForExport, columnsToExport, {
          fileName,
          title: "Tickets Report",
          subtitle: `Range: ${dateFilterLabel} | Rows: ${rowsForExport.length}`,
        });
        toast.success("PDF downloaded successfully.");
      } else {
        await exportExcel(rowsForExport, columnsToExport, {
          fileName,
          sheetName: "Tickets",
          title: "Tickets Report",
          subtitle: `Range: ${dateFilterLabel} | Rows: ${rowsForExport.length}`,
        });
        toast.success("Excel downloaded successfully.");
      }
      setOpen(false);
    } catch {
      toast.error("The report could not be generated. Try again.");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="p-2 rounded-xl transition-all duration-300 border border-teal-500/30 bg-gray-900/40 hover:bg-teal-500/10 hover:border-teal-500/50 shadow-sm"
        aria-haspopup="true"
        aria-label="Export"
      >
        <Download className="w-5 h-5 text-teal-400" />
      </button>

      {open && (
        <>
          {/* VISTA DESKTOP */}
        <div className="hidden md:block absolute right-0 w-[500px] z-[500] mt-2">
            <div className="rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 bg-gray-900/95 backdrop-blur-md">
              <div className="px-5 py-4 border-b border-gray-700/50 bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold tracking-wide text-white">
                      Export Tickets
                    </h3>
                    <p className="text-xs mt-0.5 text-gray-400">
                      {rowsForExport.length} rows ready • {columnsToExport.length} columns selected
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded-full transition hover:bg-gray-800 text-gray-400 hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5 max-h-[70vh] overflow-auto custom-scrollbar">
                {/* Rango de Fechas */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarRange className="w-4 h-4 text-teal-400" />
                    <h4 className="text-sm font-semibold text-gray-200">
                      Date Range (Created At)
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-xs text-gray-400">
                      From
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-gray-600 bg-gray-800/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 [color-scheme:dark] shadow-none"
                      />
                    </label>
                    <label className="text-xs text-gray-400">
                      To
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-gray-600 bg-gray-800/80 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 [color-scheme:dark] shadow-none"
                      />
                    </label>
                  </div>
                </div>

                {/* Columnas */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ListFilter className="w-4 h-4 text-teal-400" />
                      <h4 className="text-sm font-semibold text-gray-200">
                        Columns to Include
                      </h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPORT_COLUMNS.map((column) => {
                      const checked = selectedColumns.includes(column.key);
                      return (
                        <label
                          key={column.key}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-all duration-200 select-none ${
                            checked
                              ? "border-teal-500/50 bg-teal-900/20 text-teal-300"
                              : "border-gray-700 bg-gray-800/40 text-gray-400 hover:bg-gray-800 hover:text-gray-300 hover:border-gray-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleColumn(column.key)}
                            className="rounded-full accent-teal-400 w-5 h-5 border-2 border-teal-400 bg-slate-900 focus:ring-2 focus:ring-teal-500/40 transition-all duration-150 checked:bg-teal-500 checked:border-teal-400 checked:shadow-md appearance-none"
                            style={{ accentColor: '#14b8a6' }}
                          />
                          <span className="truncate font-medium">{column.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Preview Box */}
                <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-3.5 text-xs text-gray-400 shadow-inner">
                  <div className="flex items-center gap-2 font-semibold mb-2 text-gray-300">
                    <CheckSquare className="w-4 h-4 text-teal-400" />
                    Export preview
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <span className="block text-gray-500 mb-0.5">Range</span>
                      <span className="text-gray-200 truncate block font-medium" title={dateFilterLabel}>{dateFilterLabel}</span>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <span className="block text-gray-500 mb-0.5">Rows</span>
                      <span className="text-gray-200 font-medium">{rowsForExport.length}</span>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <span className="block text-gray-500 mb-0.5">Columns</span>
                      <span className="text-gray-200 font-medium">{columnsToExport.length}</span>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => runExport("pdf")}
                    disabled={!canExport}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      canExport 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                        : "bg-gray-800/60 text-gray-600 border border-gray-800 cursor-not-allowed"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => runExport("excel")}
                    disabled={!canExport}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      canExport 
                        ? "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-900/20" 
                        : "bg-gray-800/60 text-gray-600 border border-gray-800 cursor-not-allowed"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Download Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* VISTA MOBILE */}
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[600] md:hidden p-4">
            <div className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-gray-700/50 bg-gray-900/95">
              <div className="px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
                <h3 className="text-sm font-bold text-white tracking-wide">Export Tickets</h3>
              </div>
              <div className="p-4 space-y-4 max-h-[72vh] overflow-auto">
                <p className="text-sm text-gray-400">Please use the desktop version for exporting.</p>
                <button onClick={() => setOpen(false)} className="w-full py-2.5 rounded-xl bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 transition">Close</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}