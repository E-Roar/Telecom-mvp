"use client";

/* eslint-disable react-hooks/set-state-in-effect */


import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSpeechToText } from "@/lib/stt/useSpeechToText";
import { useTextToSpeech } from "@/lib/tts/useTextToSpeech";
import AgentMessage from "./AgentMessage";
import ConfirmAction from "./ConfirmAction";
import PromptSelector from "./PromptSelector";
import TTSPlayer from "./TTSPlayer";
import { createHarness, type HarnessMessage } from "@/lib/agent/AgentHarness";
import type { AgentResponse } from "@/lib/agent/schemas";
import { db } from "@/lib/db/mockdb";
import type { WorkOrder, Client, SavedPrompt } from "@/lib/db/types";
import { Mic, Send, X, Bot, ChevronRight, Loader2 } from "lucide-react";

interface AgentPanelProps {
  open: boolean;
  onToggle: () => void;
}

interface ClientAlias {
  patterns: RegExp[];
  tool: string;
  args: Record<string, unknown>;
  response: string;
}

function formatWOTsForChat(wots: WorkOrder[]): string {
  if (wots.length === 0) return "Aucun résultat trouvé.";
  let s = `**${wots.length} WOT(s) trouvé(s) :**\n`;
  wots.slice(0, 10).forEach((w) => {
    s += `• ${w.wotNumber} — ${w.clientName} (${w.zone}) — ${w.status.replace(/_/g, " ")}\n`;
  });
  if (wots.length > 10) s += `\n... et ${wots.length - 10} autre(s).`;
  return s;
}

function formatClientsForChat(clients: Client[]): string {
  if (clients.length === 0) return "Aucun client trouvé.";
  let s = `**${clients.length} client(s) trouvé(s) :**\n`;
  clients.slice(0, 10).forEach((c) => {
    s += `• ${c.name} — ${c.zone} — ${c.phone1}\n`;
  });
  if (clients.length > 10) s += `\n... et ${clients.length - 10} autre(s).`;
  return s;
}

const FAST_ROUTES: ClientAlias[] = [
  {
    patterns: [/^(?:show|affiche|montre)\s*(?:la\s+)?carte\b/i, /^(?:carte|map)\s*$/i],
    tool: "render_ui",
    args: { view: "map" },
    response: "Carte interactive affichée.",
  },
  {
    patterns: [/^(?:show|affiche|montre)\s*(?:les\s+)?clients?\b/i, /^(?:clients?)\s*$/i],
    tool: "render_ui",
    args: { view: "clients" },
    response: "Liste des clients affichée.",
  },
  {
    patterns: [/^(?:show|affiche|montre)\s*(?:les\s+)?techniciens?\b/i, /^(?:techniciens?)\s*$/i],
    tool: "render_ui",
    args: { view: "technicians" },
    response: "Liste des techniciens affichée.",
  },
  {
    patterns: [/^(?:show|affiche|montre|va\s+à|va\s+sur)\s*(?:les\s+)?(?:ordres\s+de\s+travail|wot|work.?orders?)\b/i, /^(?:wots?|work.?orders?)\s*$/i],
    tool: "navigate_to",
    args: { path: "/admin/work-orders" },
    response: "Navigation vers Work Orders...",
  },
  {
    patterns: [/^(?:show|affiche|montre|va\s+à|va\s+sur)\s*(?:le\s+)?dashboard\b/i, /^(?:dashboard|accueil)\s*$/i],
    tool: "navigate_to",
    args: { path: "/admin" },
    response: "Navigation vers le Dashboard...",
  },
  {
    patterns: [/^(?:show|affiche|montre)\s*(?:les\s+)?factures?\b/i, /^(?:factures?|invoices?)\s*$/i],
    tool: "navigate_to",
    args: { path: "/admin/invoices" },
    response: "Navigation vers Factures...",
  },
  {
    patterns: [/^(?:show|affiche|montre)\s*(?:les\s+)?rapports?\b/i, /^(?:rapports?|reports?)\s*$/i],
    tool: "navigate_to",
    args: { path: "/admin/reports" },
    response: "Navigation vers Rapports...",
  },
];

export default function AgentPanel({ open, onToggle }: AgentPanelProps) {
  const router = useRouter();
  const { isListening, transcript, interimTranscript, startListening, stopListening, setTranscript } = useSpeechToText();
  const { isSpeaking, speak, stop } = useTextToSpeech();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<HarnessMessage[]>([]);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [pendingAction, setPendingAction] = useState<AgentResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const harnessRef = useRef(createHarness());

  const fastRoutes = useMemo(() => FAST_ROUTES, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (pendingAction?.reasoning && ttsEnabled) {
      speak(pendingAction.reasoning);
    }
  }, [pendingAction, ttsEnabled, speak]);

  const executeTool = useCallback(async (tool: NonNullable<AgentResponse["tool"]>): Promise<string> => {
    const args = tool.arguments;
    switch (tool.name) {
      case "navigate_to": {
        const path = String(args.path || "/admin");
        router.push(path);
        return `Navigation vers ${path}...`;
      }

      case "render_ui": {
        window.dispatchEvent(new CustomEvent("agent:render-ui", { detail: args }));
        return `Affichage de la vue "${args.view}"...`;
      }

      case "update_map_filters": {
        window.dispatchEvent(new CustomEvent("agent:update-map-filters", { detail: args }));
        return "Filtres de la carte mis à jour.";
      }

      case "search_wots": {
        const allWOTs = db.getAll<WorkOrder>("workOrders");
        let filtered = allWOTs;
        if (args.status) filtered = filtered.filter((w) => w.status === args.status);
        if (args.zone) filtered = filtered.filter((w) => w.zone === args.zone);
        if (args.technicianName) filtered = filtered.filter((w) => w.technicianName?.toLowerCase().includes(String(args.technicianName).toLowerCase()));
        if (args.clientName) filtered = filtered.filter((w) => w.clientName.toLowerCase().includes(String(args.clientName).toLowerCase()));
        if (args.dateFrom) filtered = filtered.filter((w) => w.createdAt >= Number(args.dateFrom));
        if (args.dateTo) filtered = filtered.filter((w) => w.createdAt <= Number(args.dateTo));
        if (args.sortBy) {
          const key = args.sortBy as keyof WorkOrder;
          const dir = args.sortOrder === "desc" ? -1 : 1;
          filtered = [...filtered].sort((a, b) => {
            const av = a[key], bv = b[key];
            if (av == null) return 1; if (bv == null) return -1;
            return String(av).localeCompare(String(bv)) * dir;
          });
        }
        if (args.limit) filtered = filtered.slice(0, Number(args.limit));
        window.dispatchEvent(new CustomEvent("agent:render-ui", {
          detail: { view: "work-orders", data: filtered, title: `WOTs — ${String(args.zone || args.status || args.clientName || "Tous")}`, columns: args.displayColumns, chart: args.displayChart },
        }));
        return formatWOTsForChat(filtered);
      }

      case "search_clients": {
        const allClients = db.getAll<Client>("clients");
        let filtered = allClients;
        if (args.name) filtered = filtered.filter((c) => c.name.toLowerCase().includes(String(args.name).toLowerCase()));
        if (args.zone) filtered = filtered.filter((c) => c.zone === args.zone);
        if (args.phone) filtered = filtered.filter((c) => c.phone1.includes(String(args.phone)) || c.phone2?.includes(String(args.phone)));
        if (args.sortBy) {
          const key = args.sortBy as keyof Client;
          const dir = args.sortOrder === "desc" ? -1 : 1;
          filtered = [...filtered].sort((a, b) => {
            const av = a[key], bv = b[key];
            if (av == null) return 1; if (bv == null) return -1;
            return String(av).localeCompare(String(bv)) * dir;
          });
        }
        if (args.limit) filtered = filtered.slice(0, Number(args.limit));
        window.dispatchEvent(new CustomEvent("agent:render-ui", {
          detail: { view: "clients", data: filtered, title: `Clients — ${String(args.zone || args.name || "Tous")}`, columns: args.displayColumns, chart: args.displayChart },
        }));
        return formatClientsForChat(filtered);
      }

      case "create_wot": {
        const allWOTs = db.getAll<WorkOrder>("workOrders");
        const nextNum = allWOTs.length + 1;
        const wotNumber = `WOT-${String(nextNum).padStart(4, "0")}`;
        const client = db.getById<Client>("clients", String(args.clientId));
        const tech = args.technicianId ? db.getById<import("@/lib/db/types").Technician>("technicians", String(args.technicianId)) : null;
        const wot = db.create<WorkOrder>("workOrders", {
          wotNumber,
          clientId: String(args.clientId),
          clientName: client?.name || "Inconnu",
          clientPhone: client?.phone1 || "",
          technicianId: tech?.id || null,
          technicianName: tech?.name || (typeof args.technicianName === "string" ? args.technicianName : null),
          status: "new",
          zone: String(args.zone || client?.zone || ""),
          address: String(args.address || client?.address || ""),
          city: client?.city || "",
          phone1: client?.phone1 || "",
          phone2: client?.phone2 || "",
          notes: String(args.notes || ""),
          photos: [],
          category: String(args.category || "RACC"),
          interventionType: String(args.interventionType || null),
          scheduledDate: null,
          lat: null,
          lng: null,
        });
        return `WOT ${wot.wotNumber} créé avec succès pour ${wot.clientName}${tech ? ` (technicien: ${tech.name})` : ""}.`;
      }

      case "update_wot_status": {
        const wotId = String(args.wotId);
        const wot = db.getById<WorkOrder>("workOrders", wotId);
        if (!wot) return `WOT ${wotId} introuvable.`;
        db.update("workOrders", wotId, {
          status: args.status as WorkOrder["status"],
          notes: args.notes !== undefined ? String(args.notes) : wot.notes,
        });
        return `Statut du WOT ${wot.wotNumber} mis à jour: ${String(args.status).replace(/_/g, " ")}.`;
      }

      case "generate_advanced_invoice": {
        window.dispatchEvent(new CustomEvent("agent:generate-invoice", { detail: args }));
        return `Facture lancée pour ${(args.clientIds as string[])?.length || 0} client(s).`;
      }

      case "manage_prompts": {
        const action = String(args.action);
        if (action === "save" && args.title && args.content) {
          db.create<SavedPrompt>("savedPrompts", {
            title: String(args.title),
            prompt: String(args.content),
            tags: [],
            usageCount: 0,
          });
          return `Prompt "${args.title}" enregistré.`;
        }
        if (action === "delete" && args.promptId) {
          db.delete("savedPrompts", String(args.promptId));
          return "Prompt supprimé.";
        }
        if (action === "list") {
          const prompts = db.getAll<SavedPrompt>("savedPrompts");
          if (prompts.length === 0) return "Aucun prompt enregistré.";
          return prompts.map((p) => `• ${p.title} (${p.usageCount} utilisations)`).join("\n");
        }
        return "Action de gestion de prompts non reconnue.";
      }

      default:
        return `Outil "${tool.name}" exécuté avec les paramètres: ${JSON.stringify(args)}`;
    }
  }, [router]);

  const handleFastRoute = useCallback((text: string): { toolName: string; args: Record<string, unknown>; response: string } | null => {
    for (const route of fastRoutes) {
      for (const pattern of route.patterns) {
        if (pattern.test(text)) {
          return { toolName: route.tool, args: route.args, response: route.response };
        }
      }
    }
    return null;
  }, [fastRoutes]);

  const handleSend = useCallback(async () => {
    const text = input.trim() || transcript.trim();
    if (!text || isProcessing) return;

    setInput("");
    setTranscript("");
    setIsProcessing(true);
    if (isListening) stopListening();

    const userMsg: HarnessMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    const fastRoute = handleFastRoute(text);
    if (fastRoute) {
      const result = await executeTool({ name: fastRoute.toolName as any, arguments: fastRoute.args });
      const msg: HarnessMessage = { role: "assistant", content: `✅ ${result}`, timestamp: Date.now() };
      setMessages((prev) => [...prev, msg]);
      setIsProcessing(false);
      return;
    }

    const result = await harnessRef.current.process(text);

    if (result.success && result.response) {
      const assistantMsg: HarnessMessage = {
        role: "assistant",
        content: result.response.reasoning,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (result.response.confirmBeforeExecute && result.response.tool) {
        setPendingAction(result.response);
      } else if (result.response.tool) {
        const execResult = await executeTool(result.response.tool);
        const execMsg: HarnessMessage = {
          role: "assistant",
          content: `✅ Action exécutée : ${execResult}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, execMsg]);
      }
    } else {
      const errorMsg: HarnessMessage = {
        role: "assistant",
        content: `Désolé, une erreur est survenue: ${result.error || "Impossible de traiter la demande"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setIsProcessing(false);
  }, [input, transcript, isProcessing, isListening, stopListening, setTranscript, executeTool, handleFastRoute]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptSelect = (content: string) => {
    setInput(content);
  };

  const handleConfirm = async () => {
    if (pendingAction?.tool) {
      const execResult = await executeTool(pendingAction.tool);
      const execMsg: HarnessMessage = {
        role: "assistant",
        content: `✅ Action exécutée : ${execResult}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, execMsg]);
    }
    setPendingAction(null);
  };

  const handleCancel = () => {
    setPendingAction(null);
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!open) {
    return (
      <button className="agent-panel-tab" onClick={onToggle} title="Ouvrir l'agent">
        <Bot size={20} />
        <ChevronRight size={14} />
      </button>
    );
  }

  return (
    <aside className="agent-panel animate-slide-in">
      <div className="agent-panel__header">
        <div className="agent-panel__header-left">
          <Bot size={18} />
          <span>Agent IA</span>
        </div>
        <div className="agent-panel__header-right">
          <TTSPlayer
            enabled={ttsEnabled}
            onToggle={() => setTtsEnabled(!ttsEnabled)}
            isSpeaking={isSpeaking}
          />
          <PromptSelector onSelect={handlePromptSelect} />
          <button className="agent-panel__close" onClick={onToggle} title="Fermer">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="agent-panel__messages">
        {messages.length === 0 && (
          <div className="agent-panel__empty">
            <Bot size={32} />
            <p>Bonjour ! Je suis votre assistant FTTH.</p>
            <p>Dictée ou tapez votre demande.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <AgentMessage
            key={i}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}

        {isProcessing && (
          <div className="agent-msg agent-msg--assistant">
            <div className="agent-msg__avatar">
              <Bot size={14} />
            </div>
            <div className="agent-msg__body">
              <div className="agent-msg__text">
                <div className="agent-thinking">
                  <span className="agent-thinking__dot" />
                  <span className="agent-thinking__dot" />
                  <span className="agent-thinking__dot" />
                </div>
              </div>
            </div>
          </div>
        )}

        {pendingAction && (
          <ConfirmAction
            action={pendingAction}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}

        {isListening && interimTranscript && (
          <div className="agent-panel__interim">
            <span className="recording-pulse-indicator" />
            {interimTranscript}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="agent-panel__input">
        <button
          className={`agent-panel__mic ${isListening ? "recording-pulse" : ""}`}
          onClick={handleMicToggle}
          title={isListening ? "Arrêter" : "Dicter"}
        >
          <Mic size={18} />
        </button>
        <input
          className="agent-panel__text"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Parlez..." : "Tapez votre demande..."}
          disabled={isProcessing}
        />
        <button
          className="agent-panel__send"
          onClick={handleSend}
          disabled={isProcessing || (!input.trim() && !transcript.trim())}
        >
          <Send size={16} />
        </button>
      </div>
    </aside>
  );
}
