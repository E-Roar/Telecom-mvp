/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { callOpenRouter } from "@/lib/llm/openrouter";
import { compressContext, type Message } from "@/lib/agent/compressor";
import { AgentResponseSchema, getToolSchema, type AgentResponse } from "@/lib/agent/schemas";
import { getToolDefinitions } from "@/lib/agent/tools";
import { db } from "@/lib/db/mockdb";
import type { SavedPrompt } from "@/lib/db/types";

const SYSTEM_PROMPT = `Tu es un assistant IA pour la gestion d'interventions fibré (FTTH) au Maroc. Tu aides l'administrateur à gérer les ordres de travail (WOTs), les clients, les techniciens, et les factures.

CAPACITÉS DES OUTILS DE RECHERCHE:
- search_clients: chercher des clients par nom, zone, téléphone. PEUT TRIER (sortBy: "createdAt"|"name"|"zone"|"status") avec sortOrder: "asc"|"desc" et LIMITER les résultats (limit: 1 pour le plus ancien/récent).
- search_wots: chercher des ordres de travail. PEUT TRIER par createdAt|wotNumber et LIMITER les résultats.

PERSONNALISATION DE L'AFFICHAGE:
Tu peux personnaliser ce qui est affiché dans la popup en utilisant ces paramètres dans search_clients/search_wots:
- displayColumns: [{key:"name",label:"Nom"},{key:"phone1",label:"Téléphone"}] — montre seulement ces colonnes.
- displayChart: {type:"bar", groupBy:"zone"} — montre un graphique à barres groupé par champ.
Exemple: "tableau avec juste nom et téléphone" → search_clients({ displayColumns: [{key:"name",label:"Nom"},{key:"phone1",label:"Téléphone"}] })
Exemple: "graphique clients par zone" → search_clients({ displayChart: {type:"bar", groupBy:"zone"} })

RÈGLES GÉNÉRATIVES:
- Quand l'utilisateur demande à VOIR des données (clients, WOTs, techniciens, carte), utilise TOUJOURS un outil (search_clients, search_wots, render_ui). Les résultats s'affichent automatiquement.
- search_clients et search_wots: les résultats s'affichent dans une popup modale interactive.
- "show map" / "affiche la carte": utilise render_ui({ view: "map" }).
- "show technicians": utilise render_ui({ view: "technicians" }).
- Pour "client le plus ancien/récent", utilise sortBy:"createdAt" avec limit:1.
- Pour un graphique à barres (ex: "clients par zone"), utilise displayChart: {type:"bar", groupBy:"zone"}.

CRÉATION DE WOT:
- Quand tu crées une WOT, tu PEUX assigner un technicien en incluant technicianId (trouvé via search_technicians au préalable).
- Exemple: create_wot({ clientId: "...", technicianId: "...", category: "RACC", interventionType: "FAT" }).

FORMAT DE RÉPONSE:
- Pour toute action, réponds en JSON:
{ "reasoning": "Explication en français", "tool": { "name": "nom_outil", "arguments": { ... } }, "confirmBeforeExecute": true/false }
- confirmBeforeExecute: true pour les actions qui modifient des données (create, update, delete). false pour les recherches et consultations.
- Réponds toujours en français, sois concis.`;

export interface HarnessMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface HarnessResult {
  success: boolean;
  response: AgentResponse | null;
  error?: string;
  rawContent?: string;
}

export class AgentHarness {
  private history: HarnessMessage[] = [];

  addMessage(role: "user" | "assistant", content: string) {
    this.history.push({ role, content, timestamp: Date.now() });
  }

  getHistory(): HarnessMessage[] {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }

  async process(input: string): Promise<HarnessResult> {
    this.addMessage("user", input);

    const messages: Message[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...this.buildContextMessages(),
      { role: "user", content: this.buildUserMessage(input) },
    ];

    const compressed = compressContext(messages);

    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const content = await callOpenRouter(compressed);

        const parsed = this.parseResponse(content);
        if (!parsed) {
          lastError = "Failed to parse agent response";
          compressed.push({
            role: "user",
            content: `Parse error: ${lastError}. Please respond with valid JSON in the format: { "reasoning": "...", "tool": { "name": "...", "arguments": {...} }, "confirmBeforeExecute": true/false }`,
          });
          continue;
        }

        this.addMessage("assistant", parsed.reasoning);
        return { success: true, response: parsed, rawContent: content };
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Unknown error";
        if (attempt < 2) {
          compressed.push({
            role: "user",
            content: `Error: ${lastError}. Please try again with a valid response.`,
          });
        }
      }
    }

    return {
      success: false,
      response: null,
      error: lastError,
    };
  }

  private buildContextMessages(): Message[] {
    const recent = this.history.slice(-4);
    return recent.map((h) => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content,
    }));
  }

  private buildUserMessage(input: string): string {
    const prompts = db.getAll<SavedPrompt>("savedPrompts");
    const wotCount = (db as any).getAll?.("workOrders")?.length ?? 0;
    const clientCount = (db as any).getAll?.("clients")?.length ?? 0;

    return `Question: ${input}

Contexte actuel:
- ${wotCount} ordres de travail
- ${clientCount} clients
- ${prompts.length} prompts enregistrés

Instructions: Si tu utilises un outil, réponds UNIQUEMENT avec le JSON structuré décrit dans le prompt système. Sinon, réponds normalement en français.`;
  }

  private parseResponse(content: string): AgentResponse | null {
    const trimmed = content.trim();

    let jsonStr = trimmed;

    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonStr);
      const result = AgentResponseSchema.parse(parsed);
      return result;
    } catch {
      if (trimmed.length > 0 && !trimmed.startsWith("{")) {
        return {
          reasoning: trimmed,
          confirmBeforeExecute: false,
        };
      }
      return null;
    }
  }
}

export function createHarness(): AgentHarness {
  return new AgentHarness();
}
