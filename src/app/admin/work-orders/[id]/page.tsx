"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import StatusBadge from "@/components/ui/StatusBadge";
import { WOT_STATUS_LABELS, type WOTStatus } from "@/lib/db/types";
import { ArrowLeft, Save, MapPin, Phone, User, Tag, Calendar } from "lucide-react";

export default function WorkOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getById, update } = useWorkOrders();
  const wot = getById(id);

  const [status, setStatus] = useState<WOTStatus>(wot?.status || "new");
  const [notes, setNotes] = useState(wot?.notes || "");
  const [saving, setSaving] = useState(false);

  if (!wot) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
        WOT introuvable
        <div style={{ marginTop: "1rem" }}>
          <button className="btn btn--primary" onClick={() => router.push("/admin/work-orders")}>
            Retour aux WOTs
          </button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    setSaving(true);
    update(id, { status, notes });
    setTimeout(() => setSaving(false), 400);
  };

  return (
    <div className="page-enter">
      <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem", transition: "color 0.2s" }}
        onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <div className="neu-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{wot.wotNumber}</h2>
              <StatusBadge status={wot.status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <User size={11} /> Client
                </span>
                <span>{wot.clientName}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <Phone size={11} /> Téléphone
                </span>
                <span>{wot.clientPhone}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <MapPin size={11} /> Zone
                </span>
                <span>{wot.zone}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: 2 }}>Ville</span>
                <span> {wot.city}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <Tag size={11} /> Catégorie
                </span>
                <span>{wot.category}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: 2 }}>Type</span>
                <span> {wot.interventionType || "-"}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: 2 }}>Technicien</span>
                <span> {wot.technicianName || "Non assigné"}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <Calendar size={11} /> Créé le
                </span>
                <span>{new Date(wot.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <MapPin size={11} /> Adresse
                </span>
                <span>{wot.address}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="neu-card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem" }}>Mise à Jour</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Statut</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as WOTStatus)}>
                  {(Object.keys(WOT_STATUS_LABELS) as WOTStatus[]).map((s) => (
                    <option key={s} value={s}>{WOT_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes sur l'intervention..." />
              </div>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
