 
 
 
import * as XLSX from "xlsx";
import { db } from "@/lib/db/mockdb";
import type { WorkOrder, Client, Technician } from "@/lib/db/types";
import { WOT_STATUS_LABELS } from "@/lib/db/types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportWorkOrdersToExcel() {
  const wots = db.getAll<WorkOrder>("workOrders");
  const data = wots.map((w) => ({
    WOT: w.wotNumber,
    Client: w.clientName,
    Téléphone: w.clientPhone,
    Zone: w.zone,
    Ville: w.city,
    Catégorie: w.category,
    "Type Intervention": w.interventionType || "",
    Statut: WOT_STATUS_LABELS[w.status],
    Technicien: w.technicianName || "",
    Notes: w.notes || "",
    Date: w.scheduledDate ? new Date(w.scheduledDate).toLocaleDateString("fr-FR") : "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Work Orders");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(new Blob([buf]), `wot_export_${Date.now()}.xlsx`);
}

export function exportClientsToExcel() {
  const clients = db.getAll<Client>("clients");
  const data = clients.map((c) => ({
    Nom: c.name,
    Téléphone: c.phone1,
    "Téléphone 2": c.phone2 || "",
    Ville: c.city,
    Adresse: c.address,
    Zone: c.zone,
    "N° WOT": c.wotNumber || "",
    Statut: c.status || "",
    Notes: c.notes || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(new Blob([buf]), `clients_export_${Date.now()}.xlsx`);
}
