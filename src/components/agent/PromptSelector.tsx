"use client";
 
/* eslint-disable react-hooks/set-state-in-effect */
 


import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/db/mockdb";
import type { SavedPrompt } from "@/lib/db/types";
import { ChevronDown } from "lucide-react";

interface PromptSelectorProps {
  onSelect: (content: string) => void;
}

export default function PromptSelector({ onSelect }: PromptSelectorProps) {
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = db.getAll<SavedPrompt>("savedPrompts");
    setPrompts(saved.sort((a, b) => b.usageCount - a.usageCount));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (p: SavedPrompt) => {
    onSelect(p.prompt);
    setOpen(false);
  };

  return (
    <div className="prompt-selector" ref={ref}>
      <button
        className="prompt-selector__trigger"
        onClick={() => setOpen(!open)}
        title="Saved Prompts"
      >
        <ChevronDown size={14} />
        <span>Prompts</span>
      </button>
      {open && (
        <div className="prompt-selector__dropdown">
          {prompts.length === 0 && (
            <div className="prompt-selector__empty">Aucun prompt enregistré</div>
          )}
          {prompts.map((p) => (
            <button
              key={p.id}
              className="prompt-selector__item"
              onClick={() => handleSelect(p)}
            >
              <span className="prompt-selector__item-title">{p.title}</span>
              <span className="prompt-selector__item-count">{p.usageCount}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
