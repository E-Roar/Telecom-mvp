"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/useClients";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { ArrowLeft, Phone, MapPin, FileText, Activity, Calendar, Mail } from "lucide-react";

const CLIENT_COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"];

export default function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getById } = useClients();
  const { workOrders } = useWorkOrders();
  const client = getById(id);
  const [showProfile, setShowProfile] = useState(false);

  const clientWOTs = useMemo(
    () => workOrders.filter((w) => w.clientId === id).sort((a, b) => b.createdAt - a.createdAt),
    [workOrders, id]
  );

  const stats = useMemo(() => ({
    total: clientWOTs.length,
    completed: clientWOTs.filter((w) => w.status === "completed").length,
    cancelled: clientWOTs.filter((w) => w.status === "cancelled").length,
    inProgress: clientWOTs.filter((w) => ["in_progress", "assigned", "new"].includes(w.status)).length,
  }), [clientWOTs]);

  if (!client) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
        Client introuvable
        <div style={{ marginTop: "1rem" }}><button className="btn btn--primary" onClick={() => router.push("/admin/clients")}>Retour</button></div>
      </div>
    );
  }

  const initial = client.name.charAt(0);
  const colorIndex = client.name.length % CLIENT_COLORS.length;
  const avatarColor = CLIENT_COLORS[colorIndex];

  return (
    <div className="page-enter">
      <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem", transition: "color 0.2s" }}
        onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Profile Card */}
        <div
          onClick={() => setShowProfile(true)}
          className="neu-card neu-card--interactive"
          style={{ padding: "1.25rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center",
              background: avatarColor, color: "white", fontSize: "1.3rem", fontWeight: 700, flexShrink: 0,
            }}>
              {initial}
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>{client.name}</h2>
              <span className={`data-badge ${
                client.status === "Livré" ? "data-badge--green" :
                client.status === "En cours" ? "data-badge--amber" :
                client.status === "Annulé" ? "data-badge--red" :
                "data-badge--neutral"
              }`}>
                {client.status || "Nouveau"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={14} color="var(--text-muted)" /> {client.phone1}{client.phone2 ? ` / ${client.phone2}` : ""}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} color="var(--text-muted)" /> {client.address}, {client.zone}, {client.city}</div>
            {client.wotNumber && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><FileText size={14} color="var(--text-muted)" /> WOT: {client.wotNumber}</div>
            )}
            {client.notes && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: "0.25rem" }}>
                <Activity size={14} color="var(--text-muted)" style={{ marginTop: 2 }} />
                <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic" }}>{client.notes}</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: "0.75rem", fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "right" }}>
            Cliquez pour voir la fiche complète
          </div>
        </div>

        {/* Stats + Work Orders */}
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
            <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius)", padding: "0.75rem", textAlign: "center", boxShadow: "var(--neu-pressed-sm)" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--info)" }}>{stats.total}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Total WOTs</div>
            </div>
            <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius)", padding: "0.75rem", textAlign: "center", boxShadow: "var(--neu-pressed-sm)" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent)" }}>{stats.completed}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Réalisés</div>
            </div>
            <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius)", padding: "0.75rem", textAlign: "center", boxShadow: "var(--neu-pressed-sm)" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--warning)" }}>{stats.inProgress}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>En cours</div>
            </div>
          </div>

          <div className="neu-card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem" }}>Interventions ({clientWOTs.length})</h3>
            <div style={{ maxHeight: 250, overflowY: "auto" }}>
              {clientWOTs.map((wot) => (
                <div
                  key={wot.id}
                  onClick={() => router.push(`/admin/work-orders/${wot.id}`)}
                  className="hover-lift"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0", cursor: "pointer", borderRadius: 0, boxShadow: "none" }}
                >
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{wot.wotNumber}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: 8 }}>{wot.zone}</span>
                  </div>
                  <StatusBadge status={wot.status} />
                </div>
              ))}
              {clientWOTs.length === 0 && (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Aucune intervention pour ce client
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card Popup */}
      <Modal open={showProfile} onClose={() => setShowProfile(false)} title="Fiche Client">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center",
              background: avatarColor, color: "white", fontSize: "1.5rem", fontWeight: 700, flexShrink: 0,
            }}>
              {initial}
            </div>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{client.name}</div>
              <span className={`data-badge ${
                client.status === "Livré" ? "data-badge--green" :
                client.status === "En cours" ? "data-badge--amber" :
                client.status === "Annulé" ? "data-badge--red" :
                "data-badge--neutral"
              }`}>
                {client.status || "Nouveau"}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label>Téléphone 1</label><input value={client.phone1} readOnly /></div>
            <div className="form-group"><label>Téléphone 2</label><input value={client.phone2 || "—"} readOnly /></div>
            <div className="form-group"><label>Ville</label><input value={client.city} readOnly /></div>
            <div className="form-group"><label>Zone</label><input value={client.zone} readOnly /></div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}><label>Adresse</label><input value={client.address} readOnly /></div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}><label>N° WOT</label><input value={client.wotNumber || "—"} readOnly /></div>
          </div>

          {client.notes && (
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={4} value={client.notes} readOnly style={{ background: "var(--bg-secondary)", resize: "none" }} />
            </div>
          )}

          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
            <span>Créé le {new Date(client.createdAt).toLocaleDateString("fr-FR")}</span>
            <span>Mis à jour le {new Date(client.updatedAt).toLocaleDateString("fr-FR")}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
