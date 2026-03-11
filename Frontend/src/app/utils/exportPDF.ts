import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportPDF(tickets: any[]) {
  const doc = new jsPDF();

  doc.text("Reporte de Tickets", 14, 15);

  autoTable(doc, {
    startY: 20,
    head: [["ID", "Título", "Estado", "Fecha"]],
    body: tickets.map((t) => [t.id, t.title, t.status, t.date]),
  });

  doc.save("reporte.pdf");
}
