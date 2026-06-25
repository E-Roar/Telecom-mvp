"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */


import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { X, ExternalLink, Search } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

const MapWidget = dynamic(() => import("@/components/ui/MapWidget"), { ssr: false });

export interface GenUIContent {
  view: string;
  data?: Record<string, any>[];
  title?: string;
  filters?: Record<string, any>;
  columns?: { key: string; label: string; width?: string }[];
  chart?: { type: "bar" | "pie"; groupBy?: string; label?: string };
}

const VIEW_TITLES: Record<string, string> = {
  clients: "Clients",
  "work-orders": "Ordres de Travail",
  technicians: "Techniciens",
  map: "Carte Interactive",
};

const VIEW_ROUTES: Record<string, string> = {
  clients: "/admin/clients",
  "work-orders": "/admin/work-orders",
  technicians: "/admin/technicians",
};

function defaultColumns(record: Record<string, any>, view: string): { key: string; label: string; width?: string }[] {
  if (view === "clients") return [
    { key: "name", label: "Nom", width: "160px" },
    { key: "phone1", label: "Téléphone" },
    { key: "zone", label: "Zone" },
    { key: "status", label: "Statut" },
    { key: "wotNumber", label: "WOT" },
  ];
  if (view === "work-orders") return [
    { key: "wotNumber", label: "WOT" },
    { key: "clientName", label: "Client" },
    { key: "zone", label: "Zone" },
    { key: "status", label: "Statut" },
  ];
  if (view === "technicians" || view === "techniciens") return [
    { key: "name", label: "Nom" },
    { key: "phone", label: "Téléphone" },
    { key: "zone", label: "Zone" },
    { key: "completionRate", label: "Complétion" },
  ];
  return Object.keys(record || {}).filter((k) => !["id", "createdAt", "updatedAt"].includes(k)).map((k) => ({
    key: k,
    label: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, " $1"),
  }));
}

function CellValue({ value }: { value: any }) {
  if (typeof value === "boolean") return <>{value ? "Oui" : "Non"}</>;
  if (typeof value === "number") return <>{value.toLocaleString("fr-FR")}</>;
  if (!value || value === "") return <span style={{ color: "var(--text-muted)" }}>—</span>;
  return <>{String(value)}</>;
}

function BarChartCard({ data, groupBy }: { data: Record<string, any>[]; groupBy?: string }) {
  const field = groupBy || "zone";
  const groups = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((row) => {
      const key = String(row[field] || "Inconnu");
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [data, field]);

  const maxVal = Math.max(...groups.map(([, c]) => c), 1);

  return (
    <div style={{ padding: "1rem 1.25rem" }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
        Répartition par {field}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {groups.map(([label, count]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 120, fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "right", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {label}
            </span>
            <div style={{ flex: 1, height: 22, background: "var(--neu-bg)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
              <div style={{
                height: "100%", width: `${(count / maxVal) * 100}%`,
                background: "linear-gradient(90deg, var(--accent), #4ade80)",
                borderRadius: 6, transition: "width 0.4s ease",
                display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6, minWidth: 28,
              }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#fff" }}>{count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GenerativeUI({ content, onClose }: { content: GenUIContent | null; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const pageSize = 15;

  useEffect(() => {
    if (content) {
      setPage(0);
      setSearch("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [content]);

  const {
    view = "",
    data = [],
    title = "",
    filters = {},
    columns: customColumns,
    chart: chartConfig,
  } = content || {};

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (customColumns && customColumns.length > 0) return customColumns;
    return defaultColumns(data[0], view);
  }, [data, view, customColumns]);

  const filtered = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) => columns.some((col) => {
      const val = row[col.key];
      return val != null && String(val).toLowerCase().includes(q);
    }));
  }, [data, search, columns]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const headerTitle = title || VIEW_TITLES[view] || "Résultats";
  const route = VIEW_ROUTES[(!["map", "dashboard", "chart"].includes(view) && data?.length && !customColumns) ? view : ""];
  const isWide = view === "map" || (data && data.length > 10) || (customColumns && customColumns.length > 4);

  if (!content) return null;

  const closeBtn = (
    <button className="gen-ui-modal__close" onClick={onClose}><X size={16} /></button>
  );

  const headerExtras = route ? (
    <button onClick={() => { window.location.href = route; }} className="neu-button" style={{ display: "flex", alignItems: "center", gap: 4, padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}>
      <ExternalLink size={12} /> Ouvrir
    </button>
  ) : null;

  if (view === "map") {
    return (
      <div className="gen-ui-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="gen-ui-modal animate-fade-in" style={{ width: Math.min(820, typeof window !== "undefined" ? window.innerWidth - 80 : 820), maxHeight: "85vh" }}>
          <div className="gen-ui-modal__header">
            <h3 className="gen-ui-modal__title">Carte Interactive</h3>
            {closeBtn}
          </div>
          <div className="gen-ui-modal__body" style={{ padding: 0 }}>
            <div style={{ height: Math.min(560, typeof window !== "undefined" ? window.innerHeight * 0.65 : 560) }}>
              <MapWidget mapHeight={Math.min(520, typeof window !== "undefined" ? window.innerHeight * 0.6 : 520)} {...filters} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gen-ui-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gen-ui-modal animate-fade-in" style={{
        width: isWide ? Math.min(820, typeof window !== "undefined" ? window.innerWidth - 80 : 820) : 560,
        maxHeight: "85vh",
      }}>
        <div className="gen-ui-modal__header">
          <h3 className="gen-ui-modal__title">
            {headerTitle}
            <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: 8 }}>
              {data ? data.length : 0} résultat(s)
            </span>
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {headerExtras}
            {closeBtn}
          </div>
        </div>
        <div className="gen-ui-modal__body">
          {chartConfig && chartConfig.type === "bar" && data && data.length > 1 && (
            <BarChartCard data={data} groupBy={chartConfig.groupBy} />
          )}

          {!chartConfig && columns.length > 0 && data && data.length > 0 && (
            <>
              <div style={{ padding: "0 1.25rem 0.5rem" }}>
                <div style={{ position: "relative", maxWidth: 300 }}>
                  <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type="text" placeholder="Filtrer..." value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    style={{ paddingLeft: "2rem", fontSize: "0.8rem" }} />
                </div>
              </div>
              <div style={{ overflowX: "auto", maxHeight: "55vh", overflowY: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} style={{ width: col.width, fontSize: "0.8rem", padding: "0.5rem 0.75rem", position: "sticky", top: 0, background: "var(--neu-bg)", zIndex: 1 }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Aucun résultat</td>
                      </tr>
                    ) : (
                      paged.map((row, idx) => (
                        <tr key={row.id || idx} style={{ animation: `fadeInUp 0.2s ease ${idx * 0.02}s forwards`, opacity: 0 }}>
                          {columns.map((col) => (
                            <td key={col.key} style={{ fontSize: "0.82rem", padding: "0.5rem 0.75rem" }}>
                              {col.key === "status" ? <StatusBadge status={String(row[col.key] || "")} /> : <CellValue value={row[col.key]} />}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1.25rem", fontSize: "0.8rem", borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{filtered.length} résultat(s)</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button className="neu-button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}>Précédent</button>
                    <span style={{ padding: "0 0.3rem", color: "var(--text-secondary)" }}>{page + 1}/{totalPages}</span>
                    <button className="neu-button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}>Suivant</button>
                  </div>
                </div>
              )}
            </>
          )}

          {(!data || data.length === 0) && !chartConfig && (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Aucun résultat trouvé</div>
          )}
        </div>
      </div>
    </div>
  );
}
