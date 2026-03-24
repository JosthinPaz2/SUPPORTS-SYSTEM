import ExcelJS from "exceljs";

export type ExportColumn = {
  key: string;
  label: string;
};

type ExportExcelOptions = {
  fileName?: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
};

export async function exportExcel(
  rows: Array<Record<string, unknown>>,
  columns: ExportColumn[],
  options?: ExportExcelOptions,
) {
  const selectedColumns = columns.length > 0
    ? columns
    : [{ key: "id", label: "ID" }];

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options?.sheetName || "Tickets");

  const title = options?.title || "Tickets Report";
  const subtitle = options?.subtitle || "";
  const headerLabels = selectedColumns.map((column) => column.label);

  const titleRow = worksheet.getRow(1);
  titleRow.getCell(1).value = title;
  titleRow.height = 28;

  const generatedRow = worksheet.getRow(2);
  generatedRow.getCell(1).value = `Generated: ${new Date().toLocaleString()}`;
  generatedRow.height = 20;

  const subtitleRow = worksheet.getRow(3);
  subtitleRow.getCell(1).value = subtitle || `Rows: ${rows.length}`;
  subtitleRow.height = 20;

  worksheet.mergeCells(1, 1, 1, headerLabels.length);
  worksheet.mergeCells(2, 1, 2, headerLabels.length);
  worksheet.mergeCells(3, 1, 3, headerLabels.length);

  const headerRowIndex = 5;
  const headerRow = worksheet.getRow(headerRowIndex);
  headerLabels.forEach((label, index) => {
    headerRow.getCell(index + 1).value = label;
  });
  headerRow.height = 22;

  const normalizedRows = rows.map((row) =>
    selectedColumns.map((column) => {
      const value = row[column.key];
      return value == null || value === "" ? "-" : String(value);
    }),
  );

  for (const rowValues of normalizedRows) {
    worksheet.addRow(rowValues);
  }

  const lastColumn = headerLabels.length;
  const lastRow = worksheet.rowCount;

  worksheet.views = [{ state: "frozen", ySplit: headerRowIndex, xSplit: 0 }];
  worksheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: lastColumn },
  };

  for (let columnIndex = 1; columnIndex <= lastColumn; columnIndex += 1) {
    const headerLength = headerLabels[columnIndex - 1]?.length || 10;
    let maxLength = headerLength;

    for (let rowIndex = headerRowIndex + 1; rowIndex <= lastRow; rowIndex += 1) {
      const rawValue = worksheet.getRow(rowIndex).getCell(columnIndex).value;
      const valueLength = String(rawValue ?? "-").length;
      if (valueLength > maxLength) {
        maxLength = valueLength;
      }
    }

    worksheet.getColumn(columnIndex).width = Math.min(Math.max(maxLength + 3, 14), 48);
  }

  titleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
  titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
  titleRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F766E" },
  };

  generatedRow.getCell(1).font = { size: 10, color: { argb: "FF334155" } };
  subtitleRow.getCell(1).font = { size: 10, color: { argb: "FF0F172A" }, italic: true };

  for (let columnIndex = 1; columnIndex <= lastColumn; columnIndex += 1) {
    const cell = headerRow.getCell(columnIndex);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F766E" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0F5E59" } },
      left: { style: "thin", color: { argb: "FF0F5E59" } },
      bottom: { style: "thin", color: { argb: "FF0F5E59" } },
      right: { style: "thin", color: { argb: "FF0F5E59" } },
    };
  }

  for (let rowIndex = headerRowIndex + 1; rowIndex <= lastRow; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    const isAlt = (rowIndex - headerRowIndex) % 2 === 0;

    for (let columnIndex = 1; columnIndex <= lastColumn; columnIndex += 1) {
      const cell = row.getCell(columnIndex);
      cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isAlt ? "FFF8FAFC" : "FFFFFFFF" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      cell.font = { size: 10, color: { argb: "FF0F172A" } };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = `${options?.fileName || "tickets-report"}.xlsx`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
