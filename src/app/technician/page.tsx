"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useAuth } from "@/hooks/useAuth";
import StatusBadge from "@/components/ui/StatusBadge";
import { ClipboardCheck, AlertTriangle, Clock, CheckCircle2, ChevronRight, Percent, HardHat, MapPin } from "lucide-react";

const MapWidget = dynamic(() => import("@/components/ui/MapWidget"), { ssr: false });

const isToday = (ts: number | null) => {
  if (!ts) return false;
  const d = new Date(ts);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
};

export default function TechnicianDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { workOrders, loading: wotsLoading } = useWorkOrders();
  const { technicians, loading: techLoading } = useTechnicians();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const tech = useMemo(() => {
    if (!user?.email || !technicians.length) return null;
    return technicians.find((t) => t.email.toLowerCase() === user.email!.toLowerCase());
  }, [technicians, user]);

  const techId = tech?.id;

  const assignedWOTs = useMemo(() => {
    if (!techId) return [];
    return workOrders.filter((w) => w.technicianId === techId).sort((a, b) => b.createdAt - a.createdAt);
  }, [workOrders, techId]);

  const stats = useMemo(() => {
    const total = assignedWOTs.length;
    const today = assignedWOTs.filter((w) => isToday(w.scheduledDate)).length;
    const realised = assignedWOTs.filter((w) => w.status === "completed").length;
    const anomalies = assignedWOTs.filter((w) => w.status === "cancelled").length;
    const completionRate = total > 0 ? Math.round((realised / total) * 100) : 0;
    return { total, today, realised, anomalies, completionRate };
  }, [assignedWOTs]);

  const activeWOTs = useMemo(() => assignedWOTs.filter((w) => !["completed", "cancelled"].includes(w.status)), [assignedWOTs]);
  const historyWOTs = useMemo(() => assignedWOTs.filter((w) => ["completed", "cancelled"].includes(w.status)), [assignedWOTs]);

  const loading = wotsLoading || techLoading || !mounted;

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "var(--text-muted)" }}>
        <div className="loading-spinner" />
        <span style={{ fontSize: "0.85rem" }}>Chargement...</span>
      </div>
    );
  }

  if (!tech) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div className="neu-card" style={{ padding: "2rem" }}>
          <HardHat size={40} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Compte technicien non trouvé</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
            Votre compte ({user?.email}) n&apos;est associé à aucun technicien.<br />
            Essayez de vider le cache et rafraîchir la page.
          </p>
          <button className="btn btn--primary" onClick={() => router.push("/")}>Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stagger" style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Bonjour, {tech?.name?.split(" ")[0] || "Technicien"}</h1>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.4rem", marginBottom: "1.5rem" }}>
        <div className="stat-card" style={{ padding: "0.6rem 0.4rem", textAlign: "center" }}>
          <ClipboardCheck size={14} style={{ color: "var(--accent)", marginBottom: 2 }} />
          <div className="stat-card__value" style={{ fontSize: "1rem" }}>{stats.total}</div>
          <div className="stat-card__label">Total</div>
        </div>
        <div className="stat-card" style={{ padding: "0.6rem 0.4rem", textAlign: "center" }}>
          <Clock size={14} style={{ color: "var(--info)", marginBottom: 2 }} />
          <div className="stat-card__value" style={{ fontSize: "1rem" }}>{stats.today}</div>
          <div className="stat-card__label">Auj.</div>
        </div>
        <div className="stat-card" style={{ padding: "0.6rem 0.4rem", textAlign: "center" }}>
          <CheckCircle2 size={14} style={{ color: "var(--success)", marginBottom: 2 }} />
          <div className="stat-card__value" style={{ fontSize: "1rem" }}>{stats.realised}</div>
          <div className="stat-card__label">Fait</div>
        </div>
        <div className="stat-card" style={{ padding: "0.6rem 0.4rem", textAlign: "center" }}>
          <AlertTriangle size={14} style={{ color: "var(--danger)", marginBottom: 2 }} />
          <div className="stat-card__value" style={{ fontSize: "1rem" }}>{stats.anomalies}</div>
          <div className="stat-card__label">Anom.</div>
        </div>
        <div className="stat-card" style={{ padding: "0.6rem 0.4rem", textAlign: "center" }}>
          <Percent size={14} style={{ color: "var(--warning)", marginBottom: 2 }} />
          <div className="stat-card__value" style={{ fontSize: "1rem" }}>{stats.completionRate}%</div>
          <div className="stat-card__label">Tx Réussite</div>
        </div>
      </div>

      <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "1.5rem", boxShadow: "var(--neu-raised-sm)" }}>
        <div style={{ height: 200 }}>
          <MapWidget mapHeight={200} techId={techId} showTechMarkers={false} />
        </div>
      </div>

      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Interventions en cours ({activeWOTs.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {activeWOTs.length === 0 ? (
          <div className="neu-card" style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Aucune intervention en cours
          </div>
        ) : (
          activeWOTs.map((wot) => (
            <div
              key={wot.id}
              onClick={() => router.push(`/technician/${wot.id}`)}
              className="neu-card--interactive"
              style={{ padding: "0.75rem 1rem", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{wot.wotNumber}</span>
                <StatusBadge status={wot.status} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{wot.clientName} — {wot.zone}</span>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            </div>
          ))
        )}
      </div>

      {historyWOTs.length > 0 && (
        <>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Historique ({historyWOTs.length})</h2>
          <div className="neu-card" style={{ padding: "0.5rem 0.75rem" }}>
            {historyWOTs.slice(0, 15).map((wot) => (
              <div key={wot.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0", fontSize: "0.85rem", borderBottom: "1px solid var(--border)" }}>
                <span>{wot.wotNumber} — {wot.clientName}</span>
                <StatusBadge status={wot.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
