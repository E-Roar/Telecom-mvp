"use client";

import type { WOTStatus } from "@/lib/db/types";
import { WOT_STATUS_LABELS } from "@/lib/db/types";

const BADGE_MAP: Record<string, string> = {
  completed: "data-badge--green",
  realised: "data-badge--green",
  in_progress: "data-badge--amber",
  en_cours: "data-badge--amber",
  new: "data-badge--neutral",
  assigned: "data-badge--blue",
  cancelled: "data-badge--red",
  refused: "data-badge--red",
  annuler: "data-badge--red",
  injoignable: "data-badge--neutral",
  en_attente: "data-badge--amber",
};

export default function StatusBadge({ status }: { status: string }) {
  const label = WOT_STATUS_LABELS[status as WOTStatus] || status.replace(/_/g, " ");
  const cls = BADGE_MAP[status] || "data-badge--neutral";
  return (
    <span className={`data-badge ${cls}`}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
      {label}
    </span>
  );
}
