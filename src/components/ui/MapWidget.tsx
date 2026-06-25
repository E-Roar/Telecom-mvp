"use client";

/* eslint-disable react-hooks/set-state-in-effect */


import { useEffect, useMemo, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "@/lib/db/mockdb";
import type { WorkOrder, WOTStatus, Technician } from "@/lib/db/types";
import StatusBadge from "./StatusBadge";

const STATUS_COLORS: Record<string, string> = {
  new: "#0891b2",
  assigned: "#f59e0b",
  in_progress: "#ea580c",
  completed: "#16a34a",
  cancelled: "#ef4444",
};

function wotIcon(status: string): L.DivIcon {
  const color = STATUS_COLORS[status] || "#3b82f6";
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid var(--bg-card, #fff);border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    tooltipAnchor: [0, -10],
  });
}

function techIcon(name: string): L.DivIcon {
  const initial = name.charAt(0).toUpperCase();
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;background:#22c55e;border:2px solid #fff;border-radius:4px;box-shadow:0 0 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:800;line-height:1;">${initial}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    tooltipAnchor: [0, -14],
  });
}

const CASABLANCA_CENTER: [number, number] = [33.5731, -7.5898];

interface MapWidgetProps {
  statusFilter?: WOTStatus[];
  zoneFilter?: string[];
  mapHeight?: number;
  showTechMarkers?: boolean;
  techId?: string;
  wotId?: string;
  onFilterChange?: (filters: { status?: WOTStatus[]; zone?: string[] }) => void;
}

export default function MapWidget({
  statusFilter: propStatusFilter,
  zoneFilter: propZoneFilter,
  mapHeight = 380,
  showTechMarkers = true,
  techId,
  wotId,
  onFilterChange,
}: MapWidgetProps) {
  const [allWOTs, setAllWOTs] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [statusFilter, setStatusFilter] = useState<WOTStatus[] | undefined>(propStatusFilter);
  const [zoneFilter, setZoneFilter] = useState<string[] | undefined>(propZoneFilter);

  const refresh = useCallback(() => {
    setAllWOTs(db.getAll<WorkOrder>("workOrders"));
    setTechnicians(db.getAll<Technician>("technicians"));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => { setStatusFilter(propStatusFilter); }, [propStatusFilter]);
  useEffect(() => { setZoneFilter(propZoneFilter); }, [propZoneFilter]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("agent:data-changed", handler);
    return () => window.removeEventListener("agent:data-changed", handler);
  }, [refresh]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.statusFilter) setStatusFilter(detail.statusFilter);
      if (detail.zoneFilter) setZoneFilter(detail.zoneFilter);
    };
    window.addEventListener("agent:update-map-filters", handler);
    return () => window.removeEventListener("agent:update-map-filters", handler);
  }, []);

  const zones = useMemo(() => [...new Set(allWOTs.map((w) => w.zone))].sort(), [allWOTs]);

  const filtered = useMemo(() => {
    let items = allWOTs.filter((w) => w.lat != null && w.lng != null);
    if (techId) items = items.filter((w) => w.technicianId === techId);
    if (wotId) items = items.filter((w) => w.id === wotId);
    if (statusFilter && statusFilter.length > 0) items = items.filter((w) => statusFilter.includes(w.status));
    if (zoneFilter && zoneFilter.length > 0) items = items.filter((w) => zoneFilter.includes(w.zone));
    return items;
  }, [allWOTs, techId, wotId, statusFilter, zoneFilter]);

  const visibleTechs = useMemo(() => {
    let items = technicians.filter((t) => t.lat != null && t.lng != null);
    if (techId) items = items.filter((t) => t.id === techId);
    return items;
  }, [technicians, techId]);

  const statuses = useMemo(() => {
    let items = allWOTs;
    if (techId) items = items.filter((w) => w.technicianId === techId);
    if (wotId) items = items.filter((w) => w.id === wotId);
    return [...new Set(items.map((w) => w.status))] as WOTStatus[];
  }, [allWOTs, techId, wotId]);

  const handleFilterChange = useCallback((nextStatus: WOTStatus[]) => {
    const next = nextStatus.length === statuses.length || nextStatus.length === 0 ? undefined : nextStatus;
    setStatusFilter(next);
    onFilterChange?.({ status: next, zone: zoneFilter });
  }, [statuses, zoneFilter, onFilterChange]);

  return (
    <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--neu-raised)" }}>
      {statuses.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem", background: "var(--bg-secondary)", flexWrap: "wrap", boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}>
          {statuses.map((s) => {
            const active = !statusFilter || statusFilter.length === 0 || statusFilter.includes(s);
            return (
              <button
                key={s}
                onClick={() => {
                  const current = statusFilter || [];
                  const next = active ? current.filter((x) => x !== s) : [...current, s];
                  handleFilterChange(next);
                }}
                style={{
                  padding: "2px 10px", borderRadius: 12, fontSize: "0.7rem", border: `1px solid ${STATUS_COLORS[s]}`,
                  background: active ? STATUS_COLORS[s] : "transparent",
                  color: active ? "#fff" : STATUS_COLORS[s],
                  opacity: active ? 1 : 0.5, cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {s.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ height: mapHeight, background: "var(--bg-primary)" }}>
        <MapContainer center={CASABLANCA_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filtered.map((wot) => (
            <Marker
              key={wot.id}
              position={[wot.lat!, wot.lng!]}
              icon={wotIcon(wot.status)}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <div style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
                  <strong>{wot.wotNumber}</strong><br />
                  {wot.clientName}<br />
                  <StatusBadge status={wot.status} />
                </div>
              </Tooltip>
            </Marker>
          ))}
          {showTechMarkers && visibleTechs.map((t) => (
            <Marker
              key={`tech-${t.id}`}
              position={[t.lat!, t.lng!]}
              icon={techIcon(t.name)}
            >
              <Tooltip direction="top" offset={[0, -14]}>
                <div style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
                  <strong>{t.name}</strong><br />
                  <span style={{ color: "#22c55e" }}>Technicien</span>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--bg-secondary)", boxShadow: "0 -1px 0 rgba(0,0,0,0.03)" }}>
        {filtered.length} intervention{filtered.length !== 1 ? "s" : ""} affichée{filtered.length !== 1 ? "s" : ""}
        {allWOTs.length !== filtered.length && ` (sur ${allWOTs.length} total)`}
        {showTechMarkers && visibleTechs.length > 0 && ` — ${visibleTechs.length} technicien${visibleTechs.length !== 1 ? "s" : ""}`}
      </div>
    </div>
  );
}
