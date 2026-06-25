/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
import * as XLSX from "xlsx";
import { db } from "@/lib/db/mockdb";

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

export function importWorkOrdersFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        let imported = 0;
        const errors: string[] = [];

        rows.forEach((row, i) => {
          try {
            db.create("workOrders", {
              wotNumber: row.WOT || `IMP${Date.now()}_${i}`,
              clientId: row.ClientID || "",
              clientName: row.Client || row.clientName || "",
              clientPhone: row.Téléphone || row.clientPhone || "",
              technicianId: null,
              technicianName: null,
              category: (row.Catégorie === "SAV" ? "SAV" : "RACC") as "RACC" | "SAV",
              interventionType: row["Type Intervention"] || null,
              zone: row.Zone || "",
              city: row.Ville || "CASABLANCA",
              address: row.Adresse || "",
              phone1: row.Téléphone || "",
              phone2: "",
              notes: row.Notes || "",
              status: "new",
              scheduledDate: null,
              lat: null,
              lng: null,
            });
            imported++;
          } catch (err) {
            errors.push(`Ligne ${i + 2}: ${err instanceof Error ? err.message : "Erreur inconnue"}`);
          }
        });

        resolve({ success: errors.length === 0, imported, errors });
      } catch (err) {
        resolve({ success: false, imported: 0, errors: [err instanceof Error ? err.message : "Erreur de lecture"] });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
