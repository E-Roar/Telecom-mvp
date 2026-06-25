"use client";
 
/* eslint-disable react-hooks/set-state-in-effect */
 


import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db/mockdb";
import type { Technician } from "@/lib/db/types";

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setTechnicians(db.getAll<Technician>("technicians"));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getById = useCallback((id: string) => db.getById<Technician>("technicians", id), []);
  const create = useCallback((data: Omit<Technician, "id" | "createdAt" | "updatedAt">) => {
    const t = db.create("technicians", data);
    refresh();
    return t;
  }, [refresh]);
  const update = useCallback((id: string, updates: Partial<Technician>) => {
    const result = db.update("technicians", id, updates);
    if (result) refresh();
    return result;
  }, [refresh]);
  const remove = useCallback((id: string) => {
    const result = db.delete("technicians", id);
    if (result) refresh();
    return result;
  }, [refresh]);

  return { technicians, loading, refresh, getById, create, update, remove };
}
