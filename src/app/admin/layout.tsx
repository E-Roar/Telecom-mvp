"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AgentPanel from "@/components/agent/AgentPanel";
import GenerativeUI, { type GenUIContent } from "@/components/agent/GenerativeUI";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Wrench,
  FileText,
  Receipt,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Work Orders", href: "/admin/work-orders", icon: ClipboardList },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Techniciens", href: "/admin/technicians", icon: Wrench },
  { label: "Rapports", href: "/admin/reports", icon: FileText },
  { label: "Factures", href: "/admin/invoices", icon: Receipt },
];

const VIEW_ROUTE_MAP: Record<string, string> = {
  dashboard: "/admin",
  table: "/admin/work-orders",
  chart: "/admin/reports",
  technicians: "/admin/technicians",
  clients: "/admin/clients",
  "work-orders": "/admin/work-orders",
  reports: "/admin/reports",
  invoices: "/admin/invoices",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const [genUI, setGenUI] = useState<GenUIContent | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    setGenUI(null);
  }, [pathname]);

  const handleRenderUI = useCallback((e: Event) => {
    const { view, filters, data, title, columns, chart } = (e as CustomEvent).detail as GenUIContent;

    if (view === "map") {
      setGenUI({ view: "map", filters });
      return;
    }

    if (data && data.length > 0) {
      setGenUI({ view, data, title, filters, columns, chart });
      return;
    }

    const route = VIEW_ROUTE_MAP[view];
    if (route) {
      if (filters) {
        try { sessionStorage.setItem("agent_view_filters", JSON.stringify(filters)); } catch { /* ignore */ }
      }
      router.push(route);
    }
  }, [router]);

  const handleUpdateMapFilters = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    setGenUI({ view: "map", filters: detail });
  }, []);

  const handleDataChanged = useCallback(() => {
    window.dispatchEvent(new CustomEvent("page:refresh"));
  }, []);

  useEffect(() => {
    window.addEventListener("agent:render-ui", handleRenderUI);
    window.addEventListener("agent:update-map-filters", handleUpdateMapFilters);
    window.addEventListener("agent:data-changed", handleDataChanged);
    return () => {
      window.removeEventListener("agent:render-ui", handleRenderUI);
      window.removeEventListener("agent:update-map-filters", handleUpdateMapFilters);
      window.removeEventListener("agent:data-changed", handleDataChanged);
    };
  }, [handleRenderUI, handleUpdateMapFilters, handleDataChanged]);

  if (isLoading || !user) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${sidebarCollapsed ? "sidebar--collapsed" : ""}`}>
        <div className="sidebar__header">
          {!sidebarCollapsed && <span className="sidebar__logo">FTTH</span>}
          <button
            className="sidebar__toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__link sidebar__link--logout" onClick={() => { logout(); router.push("/"); }}>
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
          {!sidebarCollapsed && (
            <div className="sidebar__user">
              <span className="sidebar__user-email">{user.email}</span>
              <span className="sidebar__user-role">Admin</span>
            </div>
          )}
        </div>
      </aside>

      <div className={`main-area ${agentPanelOpen ? "main-area--with-panel" : ""}`}>
        <div className="main-content">
          <GenerativeUI content={genUI} onClose={() => setGenUI(null)} />
          {children}
        </div>
      </div>

      <AgentPanel
        open={agentPanelOpen}
        onToggle={() => setAgentPanelOpen(!agentPanelOpen)}
      />
    </div>
  );
}
