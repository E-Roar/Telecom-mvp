"use client";

import { useMemo, useState } from "react";
import type { AgentResponse } from "@/lib/agent/schemas";
import { db } from "@/lib/db/mockdb";
import type { Client, Technician } from "@/lib/db/types";

interface ConfirmActionProps {
  action: AgentResponse;
  onConfirm: () => void;
  onCancel: () => void;
}

function prettyParams(tool: NonNullable<AgentResponse["tool"]>): Record<string, string> {
  const args = tool.arguments;
  const out: Record<string, string> = {};

  if (args.clientId) {
    const client = db.getById<Client>("clients", String(args.clientId));
    out["Client"] = client?.name || String(args.clientId);
  }
  if (args.technicianId) {
    const tech = db.getById<Technician>("technicians", String(args.technicianId));
    out["Technicien"] = tech?.name || String(args.technicianId);
  }
  if (args.category) out["Catégorie"] = String(args.category);
  if (args.interventionType) out["Type"] = String(args.interventionType);
  if (args.zone) out["Zone"] = String(args.zone);
  if (args.address) out["Adresse"] = String(args.address);
  if (args.status) out["Statut"] = String(args.status).replace(/_/g, " ");
  if (args.wotId) {
    const wot = db.getById<import("@/lib/db/types").WorkOrder>("workOrders", String(args.wotId));
    out["WOT"] = wot?.wotNumber || String(args.wotId);
  }
  if (args.clientIds) {
    const ids = args.clientIds as string[];
    const names = ids.map((id) => db.getById<Client>("clients", id)?.name || id).join(", ");
    out["Clients"] = names;
  }
  if (args.notes) out["Notes"] = String(args.notes);

  return out;
}

export default function ConfirmAction({ action, onConfirm, onCancel }: ConfirmActionProps) {
  const [confirmed, setConfirmed] = useState(false);
  const params = useMemo(() => action.tool ? prettyParams(action.tool) : {}, [action.tool]);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm();
  };

  if (confirmed) {
    return (
      <div className="confirm-action confirm-action--done animate-fade-in">
        <span className="confirm-action__icon">&#10003;</span>
        <span>Action exécutée</span>
      </div>
    );
  }

  return (
    <div className="confirm-action animate-fade-in">
      <div className="confirm-action__header">
        <strong>Action proposée par l&apos;agent :</strong>
      </div>
      <div className="confirm-action__reasoning">{action.reasoning}</div>
      {action.tool && (
        <div className="confirm-action__tool">
          <code>{action.tool.name}</code>
          <div className="confirm-action__params">
            {Object.entries(params).map(([key, val]) => (
              <div key={key} style={{ display: "flex", gap: 6, fontSize: "0.82rem", padding: "2px 0" }}>
                <span style={{ color: "var(--text-muted)", minWidth: 80, flexShrink: 0 }}>{key}:</span>
                <span>{val}</span>
              </div>
            ))}
            {Object.keys(params).length === 0 && (
              <pre style={{ fontSize: "0.78rem", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(action.tool.arguments, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
      <div className="confirm-action__buttons">
        <button className="btn btn--success" onClick={handleConfirm}>Confirmer</button>
        <button className="btn btn--danger" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
