import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBogotaDateTime } from "./datetime";

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

  const isWideTable = selectedColumns.length > 8;
  const customLandscapeWidth = Math.max(842, Math.min(2400, 180 + selectedColumns.length * 95));
  const doc = new jsPDF({
    orientation: isWideTable ? "landscape" : "portrait",
    unit: "pt",
    format: isWideTable ? [customLandscapeWidth, 595] : "a4",
  });

  const title = options?.title || "Tickets Report";
  const subtitle = options?.subtitle || "";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, pageWidth, 52, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 18, 31);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(85, 85, 85);
  doc.text(`Generated (Bogota): ${formatBogotaDateTime(new Date())}`, 18, 72);
  if (subtitle) {
    doc.text(subtitle, 18, 87);
  }

  const normalizeCellValue = (value: unknown, key: string): string => {
    const raw = String(value ?? "-").replace(/\s+/g, " ").trim();
    if (!raw) return "-";
    if (key === "description") return raw;
    return raw.length > 85 ? `${raw.slice(0, 82)}...` : raw;
  };

  const descriptionColumnIndex = selectedColumns.findIndex((column) => column.key === "description");

  const head = [selectedColumns.map((column) => column.label)];
  const body = rows.map((row) =>
    selectedColumns.map((column) => normalizeCellValue(row[column.key], column.key)),
  );

  autoTable(doc, {
    startY: subtitle ? 102 : 84,
    head,
    body,
    tableWidth: "auto",
    styles: {
      fontSize: isWideTable ? 7 : 8,
      cellPadding: 4,
      overflow: "ellipsize",
      lineColor: [226, 232, 240],
      lineWidth: 0.35,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
      valign: "middle",
    },
    bodyStyles: {
      valign: "top",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 16, right: 18, bottom: 24, left: 18 },
    didDrawPage: (data) => {
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Page ${pageNumber}`, pageWidth - 60, pageHeight - 10);
      if (data.pageNumber > 1) {
        doc.setFillColor(15, 118, 110);
        doc.rect(0, 0, pageWidth, 20, "F");
      }
    },
    didParseCell: (data) => {
      if (
        descriptionColumnIndex !== -1 &&
        data.section === "body" &&
        data.column.index === descriptionColumnIndex
      ) {
        data.cell.styles.overflow = "linebreak";
        data.cell.styles.cellWidth = isWideTable ? 220 : 170;
      }
    },
  });

  doc.save(`${options?.fileName || "tickets-report"}.pdf`);
}
