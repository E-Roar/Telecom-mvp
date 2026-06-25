"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import { use, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import type { WOTStatus } from "@/lib/db/types";
import StatusBadge from "@/components/ui/StatusBadge";
import { ArrowLeft, Mic, Save, MapPin, Phone, User, Tag, CheckCircle, XCircle, Clock, Camera, Trash2, Maximize2 } from "lucide-react";

const MapWidget = dynamic(() => import("@/components/ui/MapWidget"), { ssr: false });

const STATUS_OPTIONS: { value: WOTStatus; label: string; icon: typeof Clock }[] = [
  { value: "in_progress", label: "EN_COURS", icon: Clock },
  { value: "completed", label: "REALISE", icon: CheckCircle },
  { value: "cancelled", label: "INJOIGNABLE", icon: XCircle },
];

function compressImage(file: File, maxW = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const w = Math.min(img.width, maxW);
        const h = (img.height / img.width) * w;
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function useFieldDictation(fieldKey: string) {
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggle = useCallback((onResult: (text: string) => void) => {
    if (recording) {
      if (recognitionRef.current) recognitionRef.current.abort();
      setRecording(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setRecording(true);
    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let t = "";
      for (let i = event.resultIndex; i < event.results.length; i++) t += event.results[i][0].transcript;
      onResult(t);
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
  }, [recording]);

  useEffect(() => () => { if (recognitionRef.current) recognitionRef.current.abort(); }, []);

  return { recording, toggle };
}

function DictationField({ label, value, onChange, placeholder, rows, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; multiline?: boolean;
}) {
  const { recording, toggle } = useFieldDictation(label);
  return (
    <div className="form-group">
      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{label}</span>
        <button type="button" onClick={() => toggle((text) => onChange(value ? value + " " + text : text))}
          className={recording ? "recording-pulse" : "neu-button"}
          style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: recording ? "white" : "var(--text-secondary)", background: recording ? "var(--accent)" : undefined }}
          title="Dicter">
          <Mic size={14} />
        </button>
      </label>
      {multiline ? (
        <textarea rows={rows || 3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

export default function TechnicianWOTUpdate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getById, update } = useWorkOrders();
  const wot = getById(id);

  const [status, setStatus] = useState<WOTStatus>(wot?.status || "in_progress");
  const [notes, setNotes] = useState(wot?.notes || "");
  const [address, setAddress] = useState(wot?.address || "");
  const [phone, setPhone] = useState(wot?.phone1 || "");
  const [photos, setPhotos] = useState<string[]>(wot?.photos || []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoView, setPhotoView] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!wot) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Intervention introuvable
        <div style={{ marginTop: "1rem" }}>
          <button className="btn btn--primary" onClick={() => router.push("/technician")}>Retour</button>
        </div>
      </div>
    );
  }

  const hasLocation = wot.lat != null && wot.lng != null;

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      setPhotos((prev) => [...prev, dataUrl]);
    } catch (err) {
      console.error("Photo compression failed", err);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    update(id, { status, notes, address, phone1: phone, photos });
    setTimeout(() => { setSaving(false); router.push("/technician"); }, 400);
  };

  return (
    <div className="page-enter" style={{ padding: "1rem" }}>
      <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem" }}>
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="neu-card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{wot.wotNumber}</h2>
            <StatusBadge status={wot.status} />
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{wot.clientName} — {wot.zone}</p>
          {wot.interventionType && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Tag size={12} color="var(--accent)" />
              <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 500 }}>{wot.interventionType}</span>
            </div>
          )}
        </div>

        <div className="neu-inset" style={{ padding: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={12} color="var(--text-muted)" /> {wot.clientName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} color="var(--text-muted)" /> {wot.clientPhone}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, gridColumn: "1 / -1" }}><MapPin size={12} color="var(--text-muted)" /> {wot.address}</div>
            <div><span style={{ color: "var(--text-muted)" }}>Zone:</span> {wot.zone}</div>
            <div><span style={{ color: "var(--text-muted)" }}>Ville:</span> {wot.city}</div>
            <div><span style={{ color: "var(--text-muted)" }}>Catégorie:</span> {wot.category}</div>
            <div><span style={{ color: "var(--text-muted)" }}>Type:</span> {wot.interventionType || "-"}</div>
          </div>
        </div>
      </div>

      {hasLocation && (
        <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "1rem", boxShadow: "var(--neu-raised-sm)" }}>
          <div style={{ height: 180 }}>
            <MapWidget mapHeight={180} wotId={id} showTechMarkers={false} />
          </div>
        </div>
      )}

      <div className="neu-card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="form-group">
            <label>Statut</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = status === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                    className={active ? "neu-button neu-button--accent" : "neu-button"}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "0.6rem 0.4rem", fontSize: "0.75rem", fontWeight: active ? 600 : 400 }}>
                    <Icon size={18} color={active ? "var(--accent)" : "var(--text-muted)"} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <DictationField label="Adresse" value={address} onChange={setAddress} placeholder="Adresse de l'intervention" />
          <DictationField label="Téléphone" value={phone} onChange={setPhone} placeholder="Téléphone du client" />
          <DictationField label="Notes" value={notes} onChange={setNotes} placeholder="Notes sur l'intervention..." multiline rows={3} />
        </div>
      </div>

      <div className="neu-card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div className="form-group">
          <label>Photos ({photos.length})</label>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            onChange={handlePhoto} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="neu-button"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, width: 72, height: 72, borderRadius: "var(--radius)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
              <Camera size={20} />
              {uploading ? "..." : "Photo"}
            </button>
            {photos.map((dataUrl, i) => (
              <div key={i} style={{ position: "relative", width: 72, height: 72, borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--neu-pressed-sm)" }}>
                <img src={dataUrl} alt={`Photo ${i + 1}`} onClick={() => setPhotoView(dataUrl)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} />
                <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem" }}>
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="btn btn--primary btn--full" onClick={handleSave} disabled={saving}>
        <Save size={16} /> {saving ? "Sauvegarde..." : "Sauvegarder"}
      </button>

      {photoView && (
        <div onClick={() => setPhotoView(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", cursor: "pointer" }}>
          <img src={photoView} alt="Photo plein écran" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
