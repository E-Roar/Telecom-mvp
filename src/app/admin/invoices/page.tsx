"use client";


import { useState, useMemo, useEffect } from "react";
import { generateInvoice } from "@/lib/pdf/invoiceGenerator";
import { WOT_STATUS_LABELS, type WOTStatus } from "@/lib/db/types";
import { useClients } from "@/hooks/useClients";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { Download, Receipt, BarChart3, Clock, Trash2, Users } from "lucide-react";

interface InvoiceEntry {
  id: string;
  clientIds: string[];
  clientCount: number;
  period: string;
  statusFilter: string;
  createdAt: number;
}

function loadHistory(): InvoiceEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("invoice_history") || "[]");
  } catch { return []; }
}

function saveHistory(entries: InvoiceEntry[]) {
  localStorage.setItem("invoice_history", JSON.stringify(entries));
}

function BarChart({ data, color }: { data: { label: string; value: number; color?: string }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {data.map((d) => (
        <div key={d.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "2px" }}>
            <span>{d.label}</span>
            <span style={{ fontWeight: 600 }}>{d.value}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--bg-secondary)", overflow: "hidden", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.06)" }}>
            <div style={{ height: "100%", width: `${(d.value / max) * 100}%`, borderRadius: 4, background: d.color || color || "var(--accent)", transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InvoicesPage() {
  const { clients } = useClients();
  const { workOrders } = useWorkOrders();
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [period, setPeriod] = useState(new Date().toLocaleDateString("fr-FR"));
  const [clientSearch, setClientSearch] = useState("");
  const [zoneFilterInvoices, setZoneFilterInvoices] = useState("");
  const [history, setHistory] = useState<InvoiceEntry[]>([]);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const toggleClient = (id: string) => {
    setSelectedClientIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedClientIds(clients.map((c) => c.id));
  const deselectAll = () => setSelectedClientIds([]);

  const clientWOTCounts = useMemo(() => {
    const m: Record<string, number> = {};
    clients.forEach((c) => { m[c.id] = 0; });
    workOrders.forEach((w) => {
      if (m[w.clientId] !== undefined && (!statusFilter || w.status === statusFilter)) {
        m[w.clientId]++;
      }
    });
    return m;
  }, [clients, workOrders, statusFilter]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    const relevant = workOrders.filter((w) => selectedClientIds.length === 0 || selectedClientIds.includes(w.clientId));
    relevant.forEach((w) => { counts[w.status] = (counts[w.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ label: WOT_STATUS_LABELS[k as WOTStatus] || k, value: v }));
  }, [workOrders, selectedClientIds]);

  const clientWOTDistribution = useMemo(() => {
    const items = clients
      .map((c) => ({ label: c.name, value: clientWOTCounts[c.id] || 0 }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    return items;
  }, [clients, clientWOTCounts]);

  const invoiceZones = useMemo(() => [...new Set(clients.map((c) => c.zone))].sort(), [clients]);

  const filteredClients = useMemo(() =>
    clients.filter((c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) &&
      (!zoneFilterInvoices || c.zone === zoneFilterInvoices)
    ),
    [clients, clientSearch, zoneFilterInvoices]
  );

  const handleGenerate = () => {
    if (selectedClientIds.length === 0) return;
    const doc = generateInvoice(selectedClientIds, period, statusFilter || undefined);
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Facture_${Date.now()}.pdf`;
    a.click();

    const entry: InvoiceEntry = {
      id: crypto.randomUUID(),
      clientIds: selectedClientIds,
      clientCount: selectedClientIds.length,
      period,
      statusFilter,
      createdAt: Date.now(),
    };
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    saveHistory(updated);
  };

  const deleteEntry = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

  return (
    <div className="page-enter">
      <h1 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1rem" }}>Factures PDF</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="neu-card" style={{ padding: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BarChart3 size={16} color="var(--accent)" /> Statistiques
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                WOTs par Statut {selectedClientIds.length > 0 ? "(sélection)" : ""}
              </div>
              <BarChart data={statusDistribution.length > 0 ? statusDistribution : [{ label: "Aucune donnée", value: 0 }]} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                Top Clients par WOTs
              </div>
              <BarChart data={clientWOTDistribution.length > 0 ? clientWOTDistribution : [{ label: "Sélectionnez des clients", value: 0 }]} color="var(--warning)" />
            </div>
          </div>
        </div>

        <div className="neu-card" style={{ padding: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Receipt size={16} color="var(--accent)" /> Nouvelle Facture
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="form-group">
              <label>Période</label>
              <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Mois/Juin 2026" />
            </div>
            <div className="form-group">
              <label>Filtrer par statut</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Tous les statuts</option>
                {(Object.keys(WOT_STATUS_LABELS) as WOTStatus[]).map((s) => (
                  <option key={s} value={s}>{WOT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <button className="btn btn--primary" onClick={handleGenerate} disabled={selectedClientIds.length === 0}>
              <Download size={16} /> Générer la Facture
            </button>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {selectedClientIds.length} client{selectedClientIds.length > 1 ? "s" : ""} sélectionné{selectedClientIds.length > 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="neu-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={16} color="var(--accent)" /> Clients
            </h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={selectAll} className="btn neu-button" style={{ padding: "0.25rem 0.6rem", fontSize: "0.7rem", color: "var(--accent)" }}>Tout</button>
              <button onClick={deselectAll} className="btn neu-button" style={{ padding: "0.25rem 0.6rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>Aucun</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <input
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Rechercher un client..."
              style={{ flex: 1, fontSize: "0.78rem", padding: "0.4rem 0.6rem" }}
            />
            <select
              value={zoneFilterInvoices}
              onChange={(e) => setZoneFilterInvoices(e.target.value)}
              style={{ width: 140, fontSize: "0.78rem", padding: "0.4rem 0.6rem" }}
            >
              <option value="">Toutes zones</option>
              {invoiceZones.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
            {filteredClients.length} / {clients.length} clients affichés
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {filteredClients.length === 0 ? (
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Aucun client trouvé
              </div>
            ) : (
              filteredClients.map((c) => {
                const wotCount = clientWOTCounts[c.id] || 0;
                return (
                  <label
                    key={c.id}
                    className="hover-lift"
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.5rem", cursor: "pointer", fontSize: "0.85rem", borderRadius: "var(--radius)", transition: "background 0.15s" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClientIds.includes(c.id)}
                      onChange={() => toggleClient(c.id)}
                      style={{ width: "auto", boxShadow: "none", accentColor: "var(--accent)" }}
                    />
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span className="data-badge data-badge--neutral">{wotCount} WOTs</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="neu-card" style={{ padding: "1.25rem" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={16} color="var(--accent)" /> Factures Générées ({history.length})
          </h2>
          {history.length === 0 ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Aucune facture générée pour le moment.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: 300, overflowY: "auto" }}>
              {history.map((entry) => (
                <div key={entry.id} className="hover-lift" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.5rem", borderRadius: "var(--radius)", boxShadow: "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{entry.clientCount} client{entry.clientCount > 1 ? "s" : ""}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span>{new Date(entry.createdAt).toLocaleString("fr-FR")}</span>
                      <span>— {entry.period}</span>
                      {entry.statusFilter && <span className="data-badge data-badge--neutral" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>{WOT_STATUS_LABELS[entry.statusFilter as WOTStatus] || entry.statusFilter}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteEntry(entry.id)} style={{ color: "var(--text-muted)", padding: "0.25rem", flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
