"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
  


import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/useClients";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import { exportClientsToExcel } from "@/lib/excel/exporter";
import { Phone, MapPin, FileText, Activity, Calendar, FileDown, Plus, Search, X, Circle } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  "Livré": { bg: "var(--success-bg)", color: "var(--success)", dot: "#22c55e" },
  "En cours": { bg: "var(--warning-bg)", color: "var(--warning)", dot: "#f59e0b" },
  "En attente": { bg: "var(--bg-secondary)", color: "var(--text-secondary)", dot: "#8896a8" },
  "Planifié": { bg: "var(--info-bg)", color: "var(--info)", dot: "#06b6d4" },
  "Annulé": { bg: "var(--danger-bg)", color: "var(--danger)", dot: "#ef4444" },
  "Injoignable": { bg: "var(--bg-secondary)", color: "var(--text-muted)", dot: "#8896a8" },
};

function ClientStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES["En attente"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 500, background: style.bg, color: style.color }}>
      <Circle size={6} fill={style.dot} color={style.dot} />
      {status}
    </span>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const { clients, loading, remove, create } = useClients();
  const { workOrders } = useWorkOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", phone1: "", phone2: "", zone: "", city: "CASABLANCA", address: "", status: "En attente", notes: "", wotNumber: "" });

  const zones = useMemo(() => [...new Set(clients.map((c) => c.zone))].sort(), [clients]);

  const filtered = useMemo(() => {
    if (!searchQuery) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.phone1.includes(q) || c.zone.toLowerCase().includes(q) || c.wotNumber.toLowerCase().includes(q));
  }, [clients, searchQuery]);

  const clientStats = useMemo(() => {
    const m: Record<string, { totalWOTs: number; completedWOTs: number; lastActivity: number | null; zones: Set<string> }> = {};
    clients.forEach((c) => { m[c.id] = { totalWOTs: 0, completedWOTs: 0, lastActivity: null, zones: new Set() }; });
    workOrders.forEach((w) => {
      if (m[w.clientId]) {
        m[w.clientId].totalWOTs++;
        if (w.status === "completed") m[w.clientId].completedWOTs++;
        if (w.updatedAt > (m[w.clientId].lastActivity || 0)) m[w.clientId].lastActivity = w.updatedAt;
        if (w.zone) m[w.clientId].zones.add(w.zone);
      }
    });
    return m;
  }, [clients, workOrders]);

  const handleCreate = () => {
    if (!newForm.name || !newForm.phone1) return;
    create({ ...newForm, zone: newForm.zone || "RACC" });
    setShowNew(false);
    setNewForm({ name: "", phone1: "", phone2: "", zone: "", city: "CASABLANCA", address: "", status: "En attente", notes: "", wotNumber: "" });
  };

  const columns = [
    {
      key: "name", label: "Client", sortable: true, filterable: true,
      render: (c: any) => {
        const s = clientStats[c.id];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 34, height: 34, borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-light)", color: "var(--accent)", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>
              {c.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{c.name}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <FileText size={10} />
                {s?.totalWOTs || 0} WOTs
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "phone1", label: "Contact", sortable: true, filterable: true, width: "160px",
      render: (c: any) => (
        <div>
          <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}>
            <Phone size={11} color="var(--text-muted)" /> {c.phone1}
          </div>
          {c.phone2 && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{c.phone2}</div>}
        </div>
      ),
    },
    {
      key: "zone", label: "Zone / Ville", sortable: true, width: "180px",
      render: (c: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} color="var(--text-muted)" />
          <span style={{ fontSize: "0.8rem" }}>{c.zone}</span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{c.city}</span>
        </div>
      ),
    },
    {
      key: "status", label: "Statut", width: "120px",
      render: (c: any) => <ClientStatusBadge status={c.status} />,
    },
    {
      key: "wotNumber", label: "N° WOT", width: "110px",
      render: (c: any) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{c.wotNumber || "—"}</span>
      ),
    },
    {
      key: "lastActivity", label: "Dernière Act.", width: "120px",
      render: (c: any) => {
        const s = clientStats[c.id];
        return s?.lastActivity ? (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={11} />
            {new Date(s.lastActivity).toLocaleDateString("fr-FR")}
          </span>
        ) : (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>—</span>
        );
      },
    },
    {
      key: "interventions", label: "Progrès", width: "100px",
      render: (c: any) => {
        const s = clientStats[c.id];
        if (!s || s.totalWOTs === 0) return <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>—</span>;
        const ratio = s.totalWOTs > 0 ? Math.round((s.completedWOTs / s.totalWOTs) * 100) : 0;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 50, height: 4, borderRadius: 2, background: "var(--bg-secondary)", overflow: "hidden", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ width: `${ratio}%`, height: "100%", background: "var(--accent)", borderRadius: 2, transition: "width 0.5s" }} />
            </div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{ratio}%</span>
          </div>
        );
      },
    },
    {
      key: "actions", label: "", width: "50px",
      render: (c: any) => (
        <button onClick={(e) => { e.stopPropagation(); if (confirm("Supprimer ce client ?")) remove(c.id); }} style={{ color: "var(--text-muted)", padding: 4 }} title="Supprimer">
          <X size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="page-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600 }}>Clients</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn--primary" onClick={() => setShowNew(true)}>
            <Plus size={16} /> Nouveau
          </button>
          <button className="btn" onClick={exportClientsToExcel}>
            <FileDown size={16} /> Export
          </button>
        </div>
      </div>

      <div style={{ position: "relative", maxWidth: 300, marginBottom: "1rem" }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input type="text" placeholder="Rechercher client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: "2.2rem" }} />
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          <div className="loading-spinner" style={{ margin: "0 auto" }} />
        </div>
      ) : (
        <Table columns={columns} data={filtered} keyField="id" onRowClick={(item) => router.push(`/admin/clients/${item.id}`)} emptyMessage="Aucun client trouvé" />
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouveau Client">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="form-group"><label>Nom complet *</label><input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nom du client" /></div>
          <div className="form-group"><label>Téléphone 1 *</label><input value={newForm.phone1} onChange={(e) => setNewForm((f) => ({ ...f, phone1: e.target.value }))} placeholder="+212 XXX XXX XXX" /></div>
          <div className="form-group"><label>Téléphone 2</label><input value={newForm.phone2} onChange={(e) => setNewForm((f) => ({ ...f, phone2: e.target.value }))} placeholder="+212 XXX XXX XXX" /></div>
          <div className="form-group"><label>Zone</label><select value={newForm.zone} onChange={(e) => setNewForm((f) => ({ ...f, zone: e.target.value }))}><option value="">Sélectionner...</option>{zones.map((z) => <option key={z} value={z}>{z}</option>)}</select></div>
          <div className="form-group"><label>Ville</label><input value={newForm.city} onChange={(e) => setNewForm((f) => ({ ...f, city: e.target.value }))} /></div>
          <div className="form-group"><label>Adresse</label><input value={newForm.address} onChange={(e) => setNewForm((f) => ({ ...f, address: e.target.value }))} placeholder="Adresse" /></div>
          <div className="form-group"><label>Statut</label><select value={newForm.status} onChange={(e) => setNewForm((f) => ({ ...f, status: e.target.value }))}><option value="En attente">En attente</option><option value="En cours">En cours</option><option value="Livré">Livré</option><option value="Annulé">Annulé</option><option value="Injoignable">Injoignable</option></select></div>
          <div className="form-group"><label>N° WOT</label><input value={newForm.wotNumber} onChange={(e) => setNewForm((f) => ({ ...f, wotNumber: e.target.value }))} placeholder="WOT181XXXX" /></div>
          <div className="form-group"><label>Notes</label><textarea rows={3} value={newForm.notes} onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes..." /></div>
          <button className="btn btn--primary" onClick={handleCreate} disabled={!newForm.name || !newForm.phone1}>Créer le client</button>
        </div>
      </Modal>
    </div>
  );
}
