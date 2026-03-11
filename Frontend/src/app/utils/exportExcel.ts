import * as XLSX from "xlsx";

export function exportExcel(tickets: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(tickets);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

  XLSX.writeFile(workbook, "reporte.xlsx");
}
