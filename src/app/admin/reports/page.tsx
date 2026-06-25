"use client";


import { useState, useMemo, useEffect } from "react";
import { generateReport } from "@/lib/pdf/reportGenerator";
import { WOT_STATUS_LABELS, type WOTStatus } from "@/lib/db/types";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { FileText, Download, BarChart3, Clock, Trash2, MapPin } from "lucide-react";

interface ReportEntry {
  id: string;
  title: string;
  statusFilter: string;
  zoneFilter: string;
  dateFrom: string;
  dateTo: string;
  createdAt: number;
}

function loadHistory(): ReportEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("report_history") || "[]");
  } catch { return []; }
}

function saveHistory(entries: ReportEntry[]) {
  localStorage.setItem("report_history", JSON.stringify(entries));
}

const STATUS_COLORS: Record<string, string> = {
  new: "var(--info)",
  assigned: "var(--warning)",
  in_progress: "#ea580c",
  completed: "var(--success)",
  cancelled: "var(--danger)",
};

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

export default function ReportsPage() {
  const { workOrders } = useWorkOrders();
  const [title, setTitle] = useState("Rapport d'Interventions");
  const [statusFilter, setStatusFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [history, setHistory] = useState<ReportEntry[]>([]);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const zones = [...new Set(workOrders.map((w) => w.zone))].sort();

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    workOrders.forEach((w) => { counts[w.status] = (counts[w.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ label: WOT_STATUS_LABELS[k as WOTStatus] || k, value: v, color: STATUS_COLORS[k] }));
  }, [workOrders]);

  const zoneDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    workOrders.forEach((w) => { counts[w.zone] = (counts[w.zone] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => ({ label: k, value: v }));
  }, [workOrders]);

  const handleGenerate = () => {
    const doc = generateReport(
      title,
      statusFilter || undefined,
      zoneFilter || undefined,
      dateFrom ? new Date(dateFrom).getTime() : undefined,
      dateTo ? new Date(dateTo).getTime() : undefined,
    );
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    a.click();

    const entry: ReportEntry = {
      id: crypto.randomUUID(),
      title,
      statusFilter,
      zoneFilter,
      dateFrom,
      dateTo,
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
      <h1 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1rem" }}>Rapports PDF</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="neu-card" style={{ padding: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BarChart3 size={16} color="var(--accent)" /> Statistiques
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Par Statut</div>
              <BarChart data={statusDistribution} />
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Top Zones</div>
              <BarChart data={zoneDistribution} color="var(--info)" />
            </div>
          </div>
        </div>

        <div className="neu-card" style={{ padding: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={16} color="var(--accent)" /> Nouveau Rapport
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="form-group">
              <label>Titre du rapport</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rapport d'Interventions" />
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
            <div className="form-group">
              <label>Filtrer par zone</label>
              <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
                <option value="">Toutes les zones</option>
                {zones.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label>Date début</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Date fin</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
            <button className="btn btn--primary" onClick={handleGenerate}>
              <Download size={16} /> Générer le PDF
            </button>
          </div>
        </div>
      </div>

      <div className="neu-card" style={{ padding: "1.25rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={16} color="var(--accent)" /> Rapports Générés ({history.length})
        </h2>
        {history.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Aucun rapport généré pour le moment.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {history.map((entry) => (
              <div key={entry.id} className="hover-lift" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.65rem 0.5rem", borderRadius: "var(--radius)", boxShadow: "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{entry.title}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <span>{new Date(entry.createdAt).toLocaleString("fr-FR")}</span>
                    {entry.statusFilter && <span className="data-badge data-badge--neutral" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>{WOT_STATUS_LABELS[entry.statusFilter as WOTStatus] || entry.statusFilter}</span>}
                    {entry.zoneFilter && <span><MapPin size={10} /> {entry.zoneFilter}</span>}
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
  );
}
