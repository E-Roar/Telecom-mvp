/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "@/lib/db/mockdb";
import type { Client, WorkOrder } from "@/lib/db/types";

const UNIT_PRICE_MAD = 150;
const COMPANY_NAME = "FTTH SUBCO SARL";
const COMPANY_ADDRESS = "Casablanca, Maroc";
const COMPANY_TEL = "+212 600 000 000";
const COMPANY_ICE = "ICE: 123456789";

export function generateInvoice(
  clientIds: string[],
  period: string = new Date().toLocaleDateString("fr-FR"),
  filterStatus?: string
): jsPDF {
  const doc = new jsPDF();
  const clients = clientIds.map((id) => db.getById<Client>("clients", id)).filter(Boolean) as Client[];
  const allWOTs = db.getAll<WorkOrder>("workOrders").filter((w) => {
    const clientMatch = clientIds.includes(w.clientId);
    const statusMatch = filterStatus ? w.status === filterStatus : true;
    return clientMatch && statusMatch;
  });

  const invoiceNumber = `FAC-${Date.now().toString(36).toUpperCase()}`;

  // Header — light green bg
  doc.setFillColor(240, 253, 244);
  doc.rect(0, 0, 210, 50, "F");
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(2);
  doc.line(0, 50, 210, 50);

  doc.setTextColor(22, 163, 74);
  doc.setFontSize(20);
  doc.text(COMPANY_NAME, 14, 25);
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text(COMPANY_ADDRESS, 14, 34);
  doc.text(COMPANY_TEL, 14, 40);
  doc.text(COMPANY_ICE, 14, 46);

  doc.setTextColor(22, 163, 74);
  doc.setFontSize(16);
  doc.text("FACTURE", 196, 25, { align: "right" });
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text(`N° ${invoiceNumber}`, 196, 33, { align: "right" });
  doc.text(`Période: ${period}`, 196, 39, { align: "right" });
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 196, 45, { align: "right" });

  // Orange accent line
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.5);
  doc.line(14, 55, 196, 55);

  let yPos = 65;

  clients.forEach((client) => {
    const clientWOTs = allWOTs.filter((w) => w.clientId === client.id);

    // Client header — light green
    doc.setFillColor(240, 253, 244);
    doc.rect(14, yPos - 5, 182, 8, "F");
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(client.name, 18, yPos + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${client.zone} - ${client.phone1}`, 100, yPos + 1);
    yPos += 10;

    if (clientWOTs.length === 0) {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text("Aucune intervention pour cette période.", 18, yPos + 4);
      yPos += 10;
      return;
    }

    // Table for this client — light grid
    const tableBody = clientWOTs.map((wot, i) => [
      i + 1,
      wot.wotNumber,
      wot.interventionType || "-",
      wot.status,
      "1",
      `${UNIT_PRICE_MAD} MAD`,
      `${UNIT_PRICE_MAD} MAD`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "WOT", "Type", "Statut", "Qté", "P.U.", "Total"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 8, textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 2, lineColor: [249, 115, 22], lineWidth: 0.1 },
      columnStyles: { 0: { cellWidth: 10 }, 5: { cellWidth: 25 }, 6: { cellWidth: 25 } },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Subtotal — green bg
    const subtotal = clientWOTs.length * UNIT_PRICE_MAD;
    doc.setFillColor(22, 163, 74);
    doc.rect(14, yPos - 4, 182, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Sous-total ${client.name}: ${subtotal} MAD`, 18, yPos);
    yPos += 12;
  });

  // Grand total — green header
  const grandTotal = allWOTs.length * UNIT_PRICE_MAD;
  doc.setFillColor(240, 253, 244);
  doc.rect(14, yPos - 4, 182, 8, "F");
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL GÉNÉRAL: ${grandTotal} MAD`, 196, yPos + 2, { align: "right" });
  yPos += 16;

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.text(`Total interventions: ${allWOTs.length} | Clients facturés: ${clients.length} | Période: ${period}`, 14, yPos);

  // Footer orange line
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(2);
  doc.line(0, 285, 210, 285);

  return doc;
}
