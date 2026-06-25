"use client";
 
/* eslint-disable react-hooks/set-state-in-effect */
 


import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db/mockdb";
import type { WorkOrder, WOTStatus } from "@/lib/db/types";

export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const data = db.getAll<WorkOrder>("workOrders");
    setWorkOrders(data.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getById = useCallback((id: string) => db.getById<WorkOrder>("workOrders", id), []);

  const create = useCallback((data: Omit<WorkOrder, "id" | "createdAt" | "updatedAt">) => {
    const wot = db.create("workOrders", data);
    refresh();
    return wot;
  }, [refresh]);

  const update = useCallback((id: string, updates: Partial<WorkOrder>) => {
    const result = db.update("workOrders", id, updates);
    if (result) refresh();
    return result;
  }, [refresh]);

  const remove = useCallback((id: string) => {
    const result = db.delete("workOrders", id);
    if (result) refresh();
    return result;
  }, [refresh]);

  return { workOrders, loading, refresh, getById, create, update, remove };
}

export function useWorkOrdersByStatus(status: WOTStatus) {
  const { workOrders } = useWorkOrders();
  return workOrders.filter((w) => w.status === status);
}
