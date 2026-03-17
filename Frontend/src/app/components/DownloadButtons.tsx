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

  function handleSelectAllColumns() {
    setSelectedColumns(EXPORT_COLUMNS.map((column) => column.key));
  }

  function handleClearColumns() {
    setSelectedColumns([]);
  }

  function handleResetFilters() {
    setFromDate("");
    setToDate("");
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
        className="p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition relative border border-gray-200"
        aria-haspopup="true"
        aria-label="Export"
      >
        <Download className="w-5 h-5 text-gray-600" />
      </button>

      {open && (
        <>
          <div className="hidden md:block absolute right-0 mt-2 w-115 z-50">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="px-5 py-4 border-b bg-linear-to-r from-slate-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold tracking-wide text-gray-900">Export Tickets</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {rowsForExport.length} rows ready • {columnsToExport.length} columns selected
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="p-1 rounded-full hover:bg-gray-200 transition"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5 max-h-[70vh] overflow-auto">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarRange className="w-4 h-4 text-cyan-700" />
                    <h4 className="text-sm font-semibold text-gray-800">Date Range (Created At)</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs text-gray-600">
                      From
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </label>
                    <label className="text-xs text-gray-600">
                      To
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </label>
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="mt-2 text-xs text-cyan-700 hover:text-cyan-900"
                    type="button"
                  >
                    Reset date filter
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ListFilter className="w-4 h-4 text-cyan-700" />
                      <h4 className="text-sm font-semibold text-gray-800">Columns to Include</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAllColumns}
                        className="text-xs text-cyan-700 hover:text-cyan-900"
                        type="button"
                      >
                        Select all
                      </button>
                      <button
                        onClick={handleClearColumns}
                        className="text-xs text-gray-500 hover:text-gray-700"
                        type="button"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPORT_COLUMNS.map((column) => {
                      const checked = selectedColumns.includes(column.key);
                      return (
                        <label
                          key={column.key}
                          className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs cursor-pointer transition ${
                            checked
                              ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleColumn(column.key)}
                            className="accent-cyan-600"
                          />
                          <span>{column.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2 text-gray-800 font-medium mb-1">
                    <CheckSquare className="w-4 h-4 text-cyan-700" />
                    Export preview
                  </div>
                  <p>Range: {dateFilterLabel}</p>
                  <p>Rows: {rowsForExport.length}</p>
                  <p>Columns: {columnsToExport.length}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => runExport("pdf")}
                    disabled={!canExport}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                      canExport
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    type="button"
                  >
                    <FileText className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => runExport("excel")}
                    disabled={!canExport}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                      canExport
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    type="button"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Download Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 md:hidden p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="px-4 py-3 border-b bg-linear-to-r from-slate-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Export Tickets</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {rowsForExport.length} rows • {columnsToExport.length} columns
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="p-1 rounded-full hover:bg-gray-200 transition"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[72vh] overflow-auto">
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 mb-2">Date range</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(event) => setFromDate(event.target.value)}
                      title="From date"
                      aria-label="From date"
                      className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <input
                      type="date"
                      value={toDate}
                      onChange={(event) => setToDate(event.target.value)}
                      title="To date"
                      aria-label="To date"
                      className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-800 mb-2">Columns</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {EXPORT_COLUMNS.map((column) => {
                      const checked = selectedColumns.includes(column.key);
                      return (
                        <label
                          key={column.key}
                          className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs cursor-pointer transition ${
                            checked
                              ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                              : "border-gray-200 bg-white text-gray-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleColumn(column.key)}
                            className="accent-cyan-600"
                          />
                          <span>{column.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => runExport("pdf")}
                    disabled={!canExport}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                      canExport
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    type="button"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => runExport("excel")}
                    disabled={!canExport}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                      canExport
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    type="button"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleSelectAllColumns();
                    handleResetFilters();
                  }}
                  type="button"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700"
                >
                  Reset all
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
