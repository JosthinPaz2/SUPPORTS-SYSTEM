import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportColumn = {
  key: string;
  label: string;
};

type ExportPDFOptions = {
  fileName?: string;
  title?: string;
  subtitle?: string;
};

export function exportPDF(
  rows: Array<Record<string, unknown>>,
  columns: ExportColumn[],
  options?: ExportPDFOptions,
) {
  const selectedColumns = columns.length > 0
    ? columns
    : [{ key: "id", label: "ID" }];

  const orientation = selectedColumns.length > 8 ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation });

  const title = options?.title || "Tickets Report";
  const subtitle = options?.subtitle || "";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, 14, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(85, 85, 85);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);
  if (subtitle) {
    doc.text(subtitle, 14, 25);
  }

  const head = [selectedColumns.map((column) => column.label)];
  const body = rows.map((row) =>
    selectedColumns.map((column) => String(row[column.key] ?? "-")),
  );

  autoTable(doc, {
    startY: subtitle ? 30 : 24,
    head,
    body,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 16, right: 10, bottom: 16, left: 10 },
  });

  doc.save(`${options?.fileName || "tickets-report"}.pdf`);
}
