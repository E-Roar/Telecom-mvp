"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, HardHat } from "lucide-react";

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--neu-bg)", maxWidth: 480, margin: "0 auto" }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem 1rem", background: "var(--bg-card)",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: "var(--radius)",
            background: "var(--bg-card)", boxShadow: "var(--neu-raised-sm)",
          }}>
            <HardHat size={18} color="var(--accent)" />
          </div>
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>FTTH Tech</span>
        </div>
        <button onClick={() => { logout(); router.push("/"); }}
          className="neu-button"
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
        >
          <LogOut size={14} /> Quitter
        </button>
      </header>
      {children}
    </div>
  );
}
