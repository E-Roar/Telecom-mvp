"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */


import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { db } from "@/lib/db/mockdb";
import type { WorkOrder, WOTStatus } from "@/lib/db/types";
import { ClipboardList, Users, Wrench, BarChart3, ArrowRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

const MapWidget = dynamic(() => import("@/components/ui/MapWidget"), { ssr: false });

function loadMapFilters(): { status?: WOTStatus[]; zone?: string[] } {
  try {
    const raw = sessionStorage.getItem("agent_map_filters");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ wots: 0, clients: 0, techs: 0, realised: 0 });
  const [recent, setRecent] = useState<WorkOrder[]>([]);
  const [mapFilters, setMapFilters] = useState<{ status?: WOTStatus[]; zone?: string[] }>(loadMapFilters);

  const refreshData = useCallback(() => {
    const wots = db.getAll<WorkOrder>("workOrders");
    setStats({
      wots: wots.length,
      clients: (db as any).getAll?.("clients")?.length ?? 0,
      techs: (db as any).getAll?.("technicians")?.length ?? 0,
      realised: wots.filter((w) => w.status === "completed").length,
    });
    setRecent(wots.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5));
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  useEffect(() => {
    const handler = () => refreshData();
    window.addEventListener("page:refresh", handler);
    return () => window.removeEventListener("page:refresh", handler);
  }, [refreshData]);

  const cards = [
    { label: "Work Orders", value: stats.wots, icon: ClipboardList, color: "var(--accent)" },
    { label: "Clients", value: stats.clients, icon: Users, color: "var(--success)" },
    { label: "Techniciens", value: stats.techs, icon: Wrench, color: "var(--warning)" },
    { label: "Réalisés", value: stats.realised, icon: BarChart3, color: "var(--info)" },
  ];

  return (
    <div className="page-enter">
      <h1 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.5rem" }}>Tableau de Bord</h1>
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="stat-card__icon" style={{ color: card.color }}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="stat-card__value">{card.value}</div>
              <div className="stat-card__label">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Carte des Interventions</h2>
          <MapWidget mapHeight={480} {...mapFilters} onFilterChange={(f) => {
            setMapFilters({ status: f.status, zone: f.zone });
            try { sessionStorage.setItem("agent_map_filters", JSON.stringify(f)); } catch { /* ignore */ }
          }} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Interventions Récentes</h2>
          <div className="neu-card" style={{ overflow: "hidden", padding: 0 }}>
            {recent.map((wot) => (
              <div
                key={wot.id}
                onClick={() => router.push(`/admin/work-orders/${wot.id}`)}
                className="hover-lift"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1rem", cursor: "pointer", borderRadius: 0, boxShadow: "none" }}
              >
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{wot.wotNumber}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{wot.clientName} &mdash; {wot.zone}</div>
                </div>
                <StatusBadge status={wot.status} />
              </div>
            ))}
            {recent.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Aucune intervention
              </div>
            )}
            <div
              onClick={() => router.push("/admin/work-orders")}
              className="hover-lift"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0.7rem", color: "var(--accent)", fontSize: "0.85rem", cursor: "pointer", borderRadius: 0, boxShadow: "none", background: "var(--bg-secondary)" }}
            >
              Voir toutes les WOTs <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
