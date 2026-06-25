"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
 


import { useState, useMemo, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T) => ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  emptyMessage?: string;
}

export default function Table<T extends Record<string, any>>({
  columns, data, keyField, onRowClick, pageSize = 20, emptyMessage = "Aucune donnée",
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!filter) return data;
    const q = filter.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const val = item[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, filter, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ position: "relative", maxWidth: 300 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(0); }}
            style={{ paddingLeft: "2.2rem" }}
          />
        </div>
      </div>

      <div className="neu-card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{
                      cursor: col.sortable ? "pointer" : "default",
                      width: col.width,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {col.label}
                      {col.sortable && (
                        sortKey === col.key
                          ? (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
                          : <ChevronsUpDown size={12} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paged.map((item, idx) => (
                  <tr
                    key={item[keyField]}
                    onClick={() => onRowClick?.(item)}
                    style={{
                      cursor: onRowClick ? "pointer" : "default",
                      animation: `fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.03}s forwards`,
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-muted)" }}>
            {sorted.length} résultat{sorted.length > 1 ? "s" : ""}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              className="btn neu-button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              style={{ padding: "0.35rem 0.7rem", fontSize: "0.8rem" }}
            >
              Précédent
            </button>
            <span style={{ display: "flex", alignItems: "center", padding: "0 0.5rem", color: "var(--text-secondary)" }}>
              {page + 1} / {totalPages}
            </span>
            <button
              className="btn neu-button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              style={{ padding: "0.35rem 0.7rem", fontSize: "0.8rem" }}
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
