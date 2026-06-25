"use client";
 
/* eslint-disable react-hooks/set-state-in-effect */
 


import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db/mockdb";
import type { Client } from "@/lib/db/types";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const data = db.getAll<Client>("clients");
    setClients(data.sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getById = useCallback((id: string) => db.getById<Client>("clients", id), []);
  const create = useCallback((data: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
    const c = db.create("clients", data);
    refresh();
    return c;
  }, [refresh]);
  const update = useCallback((id: string, updates: Partial<Client>) => {
    const result = db.update("clients", id, updates);
    if (result) refresh();
    return result;
  }, [refresh]);
  const remove = useCallback((id: string) => {
    const result = db.delete("clients", id);
    if (result) refresh();
    return result;
  }, [refresh]);

  return { clients, loading, refresh, getById, create, update, remove };
}
