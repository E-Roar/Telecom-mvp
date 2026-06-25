"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
  


import { useMemo, useState } from "react";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { Plus, X, Star, Mail, Phone, MapPin, Calendar, Activity, CheckCircle2 } from "lucide-react";

const TECH_COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"];

export default function TechniciansPage() {
  const router = useRouter();
  const { technicians, loading, remove, create } = useTechnicians();
  const { workOrders } = useWorkOrders();
  const [showNew, setShowNew] = useState(false);
  const [showProfile, setShowProfile] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ name: "", email: "", phone: "", zones: [] as string[] });

  const zones = useMemo(() => [...new Set(workOrders.map((w) => w.zone))].sort(), [workOrders]);

  const stats = useMemo(() => {
    const m: Record<string, { total: number; completed: number; cancelled: number; inProgress: number; lastActivity: number | null; zones: Set<string> }> = {};
    technicians.forEach((t) => {
      m[t.id] = { total: 0, completed: 0, cancelled: 0, inProgress: 0, lastActivity: null, zones: new Set(t.zones || []) };
    });
    workOrders.forEach((w) => {
      if (w.technicianId && m[w.technicianId]) {
        m[w.technicianId].total++;
        if (w.status === "completed") m[w.technicianId].completed++;
        if (w.status === "cancelled") m[w.technicianId].cancelled++;
        if (w.status === "in_progress" || w.status === "assigned") m[w.technicianId].inProgress++;
        if (w.updatedAt > (m[w.technicianId].lastActivity || 0)) m[w.technicianId].lastActivity = w.updatedAt;
        if (w.zone) m[w.technicianId].zones.add(w.zone);
      }
    });
    return m;
  }, [technicians, workOrders]);

  const handleCreate = () => {
    if (!newForm.name || !newForm.phone) return;
    create({
      name: newForm.name,
      email: newForm.email || `${newForm.name.toLowerCase().replace(/\s+/g, ".")}@ftth.ma`,
      phone: newForm.phone,
      avatar: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="#22c55e"/><text x="40" y="50" text-anchor="middle" fill="white" font-size="32" font-weight="600" font-family="Inter,sans-serif">${newForm.name.charAt(0)}</text></svg>`)}`,
      rating: 4.0,
      zones: newForm.zones,
      activeWots: 0,
      completedWots: 0,
      lat: null,
      lng: null,
    });
    setShowNew(false);
    setNewForm({ name: "", email: "", phone: "", zones: [] });
  };

  const toggleZone = (zone: string) => {
    setNewForm((f) => ({
      ...f,
      zones: f.zones.includes(zone) ? f.zones.filter((z) => z !== zone) : [...f.zones, zone],
    }));
  };

  const profileTech = showProfile ? technicians.find((t) => t.id === showProfile) : null;

  const columns = [
    {
      key: "name", label: "Technicien", sortable: true, filterable: true,
      render: (t: any) => {
        const ci = t.name.length % TECH_COLORS.length;
        const s = stats[t.id];
        const completion = s && s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center",
              background: TECH_COLORS[ci], color: "white", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0,
              boxShadow: `0 0 0 3px ${TECH_COLORS[ci]}22`,
            }}>
              {t.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{t.name}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={10} color="var(--accent)" />
                {completion}% complété
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "contact", label: "Contact", width: "180px",
      render: (t: any) => (
        <div>
          <div style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}>
            <Phone size={11} color="var(--text-muted)" /> {t.phone}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Mail size={10} color="var(--text-muted)" /> {t.email}
          </div>
        </div>
      ),
    },
    {
      key: "rating", label: "Note", width: "80px",
      render: (t: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Star size={12} color="var(--warning)" fill="var(--warning)" />
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{t.rating?.toFixed(1) || "—"}</span>
        </div>
      ),
    },
    {
      key: "stats", label: "WOTs", width: "140px",
      render: (t: any) => {
        const s = stats[t.id];
        if (!s) return <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>—</span>;
        return (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}>
              <Activity size={11} color="var(--accent)" />
              <span>{s.completed}<span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>/{s.total}</span></span>
            </div>
            <div style={{ width: 60, height: 3, borderRadius: 2, background: "var(--bg-secondary)", marginTop: 4, overflow: "hidden", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ width: `${s.total > 0 ? (s.completed / s.total) * 100 : 0}%`, height: "100%", background: "var(--accent)", borderRadius: 2, transition: "width 0.5s" }} />
            </div>
          </div>
        );
      },
    },
    {
      key: "activeWots", label: "En cours", width: "80px",
      render: (t: any) => {
        const s = stats[t.id];
        const active = s?.inProgress || t.activeWots || 0;
        return (
          <span style={{ fontSize: "0.85rem", fontWeight: 500, color: active > 0 ? "var(--warning)" : "var(--text-muted)" }}>
            {active}
          </span>
        );
      },
    },
    {
      key: "zonesCount", label: "Zones", width: "100px",
      render: (t: any) => (
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          {stats[t.id]?.zones?.size || t.zones?.length || 0} zones
        </span>
      ),
    },
    {
      key: "lastActivity", label: "Dernière Act.", width: "100px",
      render: (t: any) => {
        const s = stats[t.id];
        return s?.lastActivity ? (
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={10} />
            {new Date(s.lastActivity).toLocaleDateString("fr-FR")}
          </span>
        ) : (
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>—</span>
        );
      },
    },
    {
      key: "actions", label: "", width: "90px",
      render: (t: any) => (
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={(e) => { e.stopPropagation(); setShowProfile(t.id); }} className="btn neu-button" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", color: "var(--accent)" }}>
            Fiche
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm("Supprimer ce technicien ?")) remove(t.id); }} style={{ color: "var(--text-muted)", padding: 4 }} title="Supprimer">
            <X size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600 }}>Techniciens</h1>
        <button className="btn btn--primary" onClick={() => setShowNew(true)}>
          <Plus size={16} /> Nouveau
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          <div className="loading-spinner" style={{ margin: "0 auto" }} />
        </div>
      ) : (
        <Table columns={columns} data={technicians} keyField="id" emptyMessage="Aucun technicien" />
      )}

      {/* New Technician Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouveau Technicien">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="form-group"><label>Nom *</label><input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nom du technicien" /></div>
          <div className="form-group"><label>Email</label><input value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@ftth.ma" /></div>
          <div className="form-group"><label>Téléphone *</label><input value={newForm.phone} onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+212 XXX XXX XXX" /></div>
          <div className="form-group">
            <label>Zones assignées</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", maxHeight: 150, overflowY: "auto", padding: "0.3rem 0" }}>
              {zones.map((z) => (
                <button
                  key={z}
                  onClick={() => toggleZone(z)}
                  style={{
                    padding: "3px 12px", borderRadius: 20, fontSize: "0.7rem", border: "none",
                    background: newForm.zones.includes(z) ? "var(--accent)" : "var(--bg-card)",
                    color: newForm.zones.includes(z) ? "white" : "var(--text-secondary)",
                    cursor: "pointer", transition: "all 0.2s",
                    boxShadow: newForm.zones.includes(z) ? "var(--neu-raised-accent)" : "var(--neu-raised-sm)",
                  }}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn--primary" onClick={handleCreate} disabled={!newForm.name || !newForm.phone}>Créer</button>
        </div>
      </Modal>

      {/* Profile Card Popup */}
      <Modal open={!!showProfile} onClose={() => setShowProfile(null)} title="Fiche Technicien">
        {profileTech && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <img src={profileTech.avatar} alt={profileTech.name} style={{ width: 64, height: 64, borderRadius: "var(--radius-lg)", objectFit: "cover" }} />
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{profileTech.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <Star size={14} color="var(--warning)" fill="var(--warning)" />
                  {profileTech.rating?.toFixed(1) || "4.0"}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label>Email</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", padding: "0.5rem 0" }}>
                  <Mail size={14} color="var(--text-muted)" /> {profileTech.email}
                </div>
              </div>
              <div className="form-group"><label>Téléphone</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", padding: "0.5rem 0" }}>
                  <Phone size={14} color="var(--text-muted)" /> {profileTech.phone}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Zones assignées</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", padding: "0.3rem 0" }}>
                {profileTech.zones?.map((z: string) => (
                  <span key={z} className="data-badge data-badge--green">{z}</span>
                ))}
                {(!profileTech.zones || profileTech.zones.length === 0) && (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Non assigné</span>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius)", padding: "0.75rem", textAlign: "center", boxShadow: "var(--neu-pressed-sm)" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--accent)" }}>{stats[profileTech.id]?.completed || 0}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Réalisés</div>
              </div>
              <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius)", padding: "0.75rem", textAlign: "center", boxShadow: "var(--neu-pressed-sm)" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--warning)" }}>{stats[profileTech.id]?.inProgress || profileTech.activeWots || 0}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>En cours</div>
              </div>
              <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius)", padding: "0.75rem", textAlign: "center", boxShadow: "var(--neu-pressed-sm)" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-secondary)" }}>{stats[profileTech.id]?.total || 0}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Total</div>
              </div>
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
              <span>Créé le {new Date(profileTech.createdAt).toLocaleDateString("fr-FR")}</span>
              <span>Mis à jour le {new Date(profileTech.updatedAt).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
