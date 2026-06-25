"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
  


import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import type { WOTStatus } from "@/lib/db/types";
import { WOT_STATUS_LABELS } from "@/lib/db/types";
import Table from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { exportWorkOrdersToExcel } from "@/lib/excel/exporter";
import { importWorkOrdersFromExcel } from "@/lib/excel/importer";
import { useClients } from "@/hooks/useClients";
import { FileDown, FileUp, Plus, Search, X } from "lucide-react";

const STATUS_FILTERS: (WOTStatus | "ALL")[] = ["ALL", ...Object.keys(WOT_STATUS_LABELS) as WOTStatus[]];

export default function WorkOrdersPage() {
  const router = useRouter();
  const { workOrders, loading, create, remove } = useWorkOrders();
  const { clients: allClients } = useClients();
  const [statusFilter, setStatusFilter] = useState<WOTStatus | "ALL">("ALL");
  const [zoneQuery, setZoneQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; errors: string[] } | null>(null);
  const [newForm, setNewForm] = useState({ wotNumber: "", clientId: "", clientPhone: "", clientName: "", category: "RACC" as "RACC" | "SAV", zone: "", city: "CASABLANCA", address: "" });

  const zones = useMemo(() => [...new Set(workOrders.map((w) => w.zone))].sort(), [workOrders]);

  const filtered = useMemo(() => {
    let items = workOrders;
    if (statusFilter !== "ALL") items = items.filter((w) => w.status === statusFilter);
    if (zoneQuery) items = items.filter((w) => w.zone === zoneQuery);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((w) => w.wotNumber.toLowerCase().includes(q) || w.clientName.toLowerCase().includes(q) || w.clientPhone.includes(q));
    }
    return items;
  }, [workOrders, statusFilter, zoneQuery, searchQuery]);

  const handleCreate = () => {
    if (!newForm.wotNumber || !newForm.clientName) return;
    create({
      wotNumber: newForm.wotNumber,
      clientId: newForm.clientId || "manual",
      clientName: newForm.clientName,
      clientPhone: newForm.clientPhone,
      technicianId: null,
      technicianName: null,
      category: newForm.category,
      zone: newForm.zone || zones[0] || "",
      city: newForm.city,
      address: newForm.address,
      phone1: newForm.clientPhone,
      phone2: "",
      notes: "",
      photos: [],
      status: "new",
      interventionType: null,
      scheduledDate: null,
      lat: null,
      lng: null,
    });
    setShowCreate(false);
    setNewForm({ wotNumber: "", clientId: "", clientPhone: "", clientName: "", category: "RACC", zone: "", city: "CASABLANCA", address: "" });
  };

  const handleSelectClient = (clientId: string) => {
    const client = allClients.find((c) => c.id === clientId);
    if (client) {
      setNewForm((f) => ({ ...f, clientId, clientName: client.name, clientPhone: client.phone1, zone: client.zone, city: client.city, address: client.address }));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    const result = await importWorkOrdersFromExcel(file);
    setImportResult(result);
    if (result.success) setTimeout(() => setShowImport(false), 1500);
  };

  const columns = [
    { key: "wotNumber", label: "WOT", sortable: true, filterable: true, width: "120px" },
    { key: "clientName", label: "Client", sortable: true, filterable: true },
    { key: "zone", label: "Zone", sortable: true, filterable: true, width: "160px" },
    { key: "category", label: "Cat.", sortable: true, width: "70px" },
    { key: "status", label: "Statut", sortable: true, width: "120px", render: (w: any) => <StatusBadge status={w.status} /> },
    { key: "technicianName", label: "Technicien", sortable: true, filterable: true, width: "160px" },
    {
      key: "actions", label: "", width: "50px",
      render: (w: any) => (
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm("Supprimer cette WOT ?")) remove(w.id); }}
          style={{ color: "var(--text-muted)", padding: 4, fontSize: "0.75rem" }}
          title="Supprimer"
        >
          <X size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="page-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600 }}>Work Orders</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nouvelle
          </button>
          <button className="btn" onClick={exportWorkOrdersToExcel}>
            <FileDown size={16} /> Export
          </button>
          <button className="btn" onClick={() => setShowImport(true)}>
            <FileUp size={16} /> Import
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        <div style={{ position: "relative", maxWidth: 250 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input type="text" placeholder="Rechercher WOT, client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: "2.2rem" }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as WOTStatus | "ALL")} style={{ width: "auto", minWidth: 130 }}>
          <option value="ALL">Tous les statuts</option>
          {(Object.keys(WOT_STATUS_LABELS) as WOTStatus[]).map((s) => (
            <option key={s} value={s}>{WOT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={zoneQuery} onChange={(e) => setZoneQuery(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="">Toutes les zones</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        {(statusFilter !== "ALL" || zoneQuery || searchQuery) && (
          <button onClick={() => { setStatusFilter("ALL"); setZoneQuery(""); setSearchQuery(""); }} className="btn neu-button" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", color: "var(--accent)" }}>
            Effacer filtres
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          <div className="loading-spinner" style={{ margin: "0 auto" }} />
        </div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          keyField="id"
          onRowClick={(item) => router.push(`/admin/work-orders/${item.id}`)}
          emptyMessage="Aucune WOT trouvée"
        />
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouvelle WOT">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="form-group">
            <label>Client</label>
            <select value={newForm.clientId} onChange={(e) => handleSelectClient(e.target.value)}>
              <option value="">Sélectionner un client existant...</option>
              {allClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>N° WOT</label><input value={newForm.wotNumber} onChange={(e) => setNewForm((f) => ({ ...f, wotNumber: e.target.value }))} placeholder="WOT181XXXX" /></div>
          <div className="form-group"><label>Client</label><input value={newForm.clientName} onChange={(e) => setNewForm((f) => ({ ...f, clientName: e.target.value }))} placeholder="Nom" /></div>
          <div className="form-group"><label>Téléphone</label><input value={newForm.clientPhone} onChange={(e) => setNewForm((f) => ({ ...f, clientPhone: e.target.value }))} placeholder="+212 XXX XXX XXX" /></div>
          <div className="form-group"><label>Catégorie</label><select value={newForm.category} onChange={(e) => setNewForm((f) => ({ ...f, category: e.target.value as "RACC" | "SAV" }))}><option value="RACC">RACC</option><option value="SAV">SAV</option></select></div>
          <div className="form-group"><label>Zone</label><input value={newForm.zone} onChange={(e) => setNewForm((f) => ({ ...f, zone: e.target.value }))} placeholder="Zone" /></div>
          <div className="form-group"><label>Adresse</label><input value={newForm.address} onChange={(e) => setNewForm((f) => ({ ...f, address: e.target.value }))} placeholder="Adresse" /></div>
          <button className="btn btn--primary" onClick={handleCreate} disabled={!newForm.wotNumber || !newForm.clientName}>Créer la WOT</button>
        </div>
      </Modal>

      <Modal open={showImport} onClose={() => { setShowImport(false); setImportResult(null); }} title="Importer WOTs (Excel)">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Sélectionnez un fichier Excel avec les colonnes: WOT, Client, Téléphone, Zone, Ville, Catégorie, Type Intervention
          </p>
          <input type="file" accept=".xlsx,.xls" onChange={handleImport} />
          {importResult && (
            <div style={{ padding: "0.75rem", borderRadius: "var(--radius)", background: importResult.success ? "var(--success-bg)" : "var(--danger-bg)", color: importResult.success ? "var(--success)" : "var(--danger)", fontSize: "0.85rem" }}>
              {importResult.success ? `${importResult.imported} WOTs importées avec succès` : importResult.errors.join("\n")}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
