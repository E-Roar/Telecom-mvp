import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "@/lib/db/mockdb";
import type { WorkOrder } from "@/lib/db/types";
import { WOT_STATUS_LABELS } from "@/lib/db/types";

export function generateReport(
  title: string,
  statusFilter?: string,
  zoneFilter?: string,
  dateFrom?: number,
  dateTo?: number
): jsPDF {
  const doc = new jsPDF();
  let allWOTs = db.getAll<WorkOrder>("workOrders");

  if (statusFilter) allWOTs = allWOTs.filter((w) => w.status === statusFilter);
  if (zoneFilter) allWOTs = allWOTs.filter((w) => w.zone === zoneFilter);
  if (dateFrom) allWOTs = allWOTs.filter((w) => w.createdAt >= dateFrom);
  if (dateTo) allWOTs = allWOTs.filter((w) => w.createdAt <= dateTo);

  allWOTs.sort((a, b) => b.createdAt - a.createdAt);

  // Header — light green
  doc.setFillColor(240, 253, 244);
  doc.rect(0, 0, 210, 40, "F");
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(2);
  doc.line(0, 40, 210, 40);

  doc.setTextColor(22, 163, 74);
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, 14, 30);
  doc.text(`${allWOTs.length} interventions`, 196, 30, { align: "right" });

  // Orange separator
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.5);
  doc.line(14, 45, 196, 45);

  // Summary cards — green/white theme
  const statusCounts: Record<string, number> = {};
  allWOTs.forEach((w) => { statusCounts[w.status] = (statusCounts[w.status] || 0) + 1; });

  let x = 14;
  Object.entries(WOT_STATUS_LABELS).forEach(([key, label]) => {
    const count = statusCounts[key] || 0;
    if (count > 0) {
      doc.setFillColor(240, 253, 244);
      doc.rect(x, 50, 25, 12, "F");
      doc.setDrawColor(249, 115, 22);
      doc.setLineWidth(0.3);
      doc.rect(x, 50, 25, 12, "S");
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${count}`, x + 12.5, 57, { align: "center" });
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(label, x + 12.5, 64, { align: "center", maxWidth: 25 });
      x += 27;
    }
  });

  // Table — light theme
  const tableBody = allWOTs.map((w) => [
    w.wotNumber,
    w.clientName,
    w.zone,
    w.category,
    w.interventionType || "-",
    WOT_STATUS_LABELS[w.status],
    w.technicianName || "-",
    w.scheduledDate ? new Date(w.scheduledDate).toLocaleDateString("fr-FR") : "-",
  ]);

  autoTable(doc, {
    startY: 72,
    head: [["WOT", "Client", "Zone", "Cat.", "Type", "Statut", "Technicien", "Date"]],
    body: tableBody,
    theme: "grid",
    headStyles: { fillColor: [22, 163, 74], fontSize: 7, textColor: [255, 255, 255] },
    bodyStyles: { fontSize: 7, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { cellPadding: 2, lineColor: [249, 115, 22], lineWidth: 0.1 },
  });

  // Footer orange line
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(2);
  doc.line(0, 285, 210, 285);

  return doc;
}
