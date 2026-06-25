"use client";
 
/* eslint-disable react-hooks/set-state-in-effect */
 


import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db/mockdb";
import type { SavedPrompt } from "@/lib/db/types";

export function useSavedPrompts() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const data = db.getAll<SavedPrompt>("savedPrompts");
    setPrompts(data.sort((a, b) => b.usageCount - a.usageCount));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback((title: string, content: string) => {
    const p = db.create("savedPrompts", { title, content, usageCount: 0 });
    refresh();
    return p;
  }, [refresh]);

  const incrementUsage = useCallback((id: string) => {
    const prompt = db.getById<SavedPrompt>("savedPrompts", id);
    if (prompt) {
      db.update("savedPrompts", id, { usageCount: prompt.usageCount + 1 });
      refresh();
    }
  }, [refresh]);

  const remove = useCallback((id: string) => {
    const result = db.delete("savedPrompts", id);
    if (result) refresh();
    return result;
  }, [refresh]);

  return { prompts, loading, refresh, save, incrementUsage, remove };
}
