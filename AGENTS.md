<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-architecture -->
# FTTH Work Order Management — MVP System Architecture

Read this document **entirely** before writing a single line of code. This is your ground truth.

## WHAT THIS IS

A PWA for a telecom FTTH subcontracting company in Casablanca/Berrechid, Morocco. They install and maintain fiber optic for INWI/Traces FTTH. They currently use Excel + WhatsApp. This app replaces that.

## NON-NEGOTIABLE RULES

1. **NO SERVER-SIDE AI**: All LLM orchestration (`AgentHarness`, OpenRouter calls) MUST run client-side via `"use client"`. Vercel free tier = 10s timeout. No API routes for AI.
2. **NO REAL BACKEND**: Use `localStorage` via `MockDB` (`src/lib/db/mockdb.ts`). No Convex, no Supabase, no external DB.
3. **NO TAILWIND**: Vanilla CSS only. All styles in `globals.css` or CSS modules.
4. **ZOD ON EVERY LLM OUTPUT**: Parse all OpenRouter responses with Zod. On failure, retry with error injected (max 2 retries).
5. **CONFIRM BEFORE MUTATE**: Agent must show parsed action to Admin → wait for "Confirm" click → then write to MockDB.
6. **NATIVE STT/TTS ONLY**: Use `window.SpeechRecognition` / `webkitSpeechRecognition` for STT and `window.speechSynthesis` for TTS. No third-party libraries.
7. **SEED ON FIRST LOAD**: If `localStorage` empty, auto-seed WOTs, clients, technicians, and map data (Casablanca coordinates).
8. **DO NOT INSTALL**: `convex`, `tailwindcss`, `tesseract.js`, `transformers.js`, `@ai-sdk/*`, `langchain`, `chart.js`, `recharts`, or any charting library.

## INSTALLED DEPENDENCIES

```json
{
  "next": "16.x", "react": "19.x", "react-dom": "19.x",
  "zod": "^4.x", "lucide-react": "^1.x",
  "xlsx": "^0.18.x", "jspdf": "^2.x", "jspdf-autotable": "^3.x",
  "leaflet": "^1.9.4", "react-leaflet": "^4.2.1"
}
```

---

## DATA MODEL

All data in `localStorage` via `MockDB`. Keys: `mockdb_clients`, `mockdb_workOrders`, `mockdb_technicians`, `mockdb_invoices`, `mockdb_savedPrompts`.

*(Data schemas are defined in `src/lib/db/types.ts`)*

---

## FILE STRUCTURE

```
src/
├── app/
│   ├── layout.tsx              
│   ├── page.tsx                # LOGIN SCREEN
│   ├── globals.css             
│   ├── admin/
│   │   ├── layout.tsx          # Admin shell: sidebar nav + AG-UI panel (right, collapsible)
│   │   ├── page.tsx            # Dashboard: KPI cards, Map, recent WOTs
│   │   ├── work-orders/
│   │   │   ├── page.tsx        # Detailed WOT list: advanced filters, search, table
│   │   │   └── [id]/page.tsx   
│   │   ├── clients/
│   │   │   ├── page.tsx        # Detailed Client list
│   │   │   └── [id]/page.tsx   
│   │   ├── technicians/page.tsx
│   │   ├── reports/page.tsx    
│   │   └── invoices/page.tsx   # Advanced Invoice generation
│   └── technician/
│       ├── layout.tsx          
│       ├── page.tsx            
│       └── [id]/page.tsx       # WOT update form with per-field STT
│
├── components/
│   ├── ui/
│   │   ├── MapWidget.tsx       # Interactive Leaflet map (mock data)
│   │   ├── Table.tsx           # Detailed CRUD table (sort/filter)
│   │   └── ... (Button, Input, Modal, etc.)
│   ├── agent/
│   │   ├── AgentPanel.tsx      # Collapsible side panel, never overlays UI
│   │   ├── AgentMessage.tsx    
│   │   ├── ConfirmAction.tsx   
│   │   ├── PromptSelector.tsx  # Dropdown for saved favorite prompts
│   │   └── TTSPlayer.tsx       # TTS controls
│   └── ... (forms, data)
│
├── lib/
│   ├── agent/
│   │   ├── AgentHarness.ts     
│   │   ├── tools.ts            # Includes render_ui, update_map_filters, manage_prompts
│   │   ├── schemas.ts          
│   │   └── compressor.ts       
│   ├── llm/
│   │   └── openrouter.ts       
│   ├── stt/
│   │   └── useSpeechToText.ts  
│   ├── tts/
│   │   └── useTextToSpeech.ts  
│   ├── db/
│   │   └── ... (mockdb, seed, types)
│   ├── pdf/
│   │   ├── reportGenerator.ts  
│   │   └── invoiceGenerator.ts # Elegant design, logo placeholder, multiple clients
│   └── excel/
│       └── ... (importer, exporter)
└── hooks/
    └── ... (useAuth, useWorkOrders, useClients, useTechnicians, useSavedPrompts)
```

---

## AGENT TOOLS & CAPABILITIES

The AgentHarness has access to these tools. Each tool has a strict Zod input schema and returns structured data.

| Tool Name | Purpose |
|---|---|
| `create_wot` | Create a work order |
| `search_wots` | Filter/search WOTs |
| `update_wot_status` | Change WOT status |
| `generate_advanced_invoice` | Generate elegant PDF invoice for selected clients/filters |
| `render_ui` | Instruct dashboard to show specific view (map, filtered table, chart) |
| `navigate_to` | Open pre-built page (e.g., `/admin/work-orders`) |
| `update_map_filters` | Change visible map data |
| `manage_prompts` | Save/retrieve favorite prompts |

### Generative UI
The AG-UI can generate the dashboard UI based on admin needs. It returns structured JSON instructing the main shell to render specific components (`MapWidget`, `Table`, etc.) instead of just chat text.

---

## AGENT UI SPECIFICATIONS

1. **Collapsible Panel**: The chat panel must be collapsible to the side. It must *push* the main content, NEVER overlaying it.
2. **STT/TTS**: Prominent Mic button for dictation. TTS toggle to have the agent speak responses.
3. **Saved Prompts**: A dropdown menu displaying the Admin's most used favorite prompts.

---

## TECHNICIAN VIEW SPEC

**Mobile-first** layout (max-width 480px optimized).

`/technician/page.tsx`:
- Dashboard showing **Personal Stats**: completion rate, total WOTs today, anomalies reported.
- **History View**: List of past completed interventions.
- List of currently assigned WOTs (filter by `technicianId`). Each card shows: WOT#, client name, zone, status badge. Tap → navigate to detail.

`/technician/[id]/page.tsx`: Form to update a WOT:
- Status dropdown (only: EN_COURS, REALISE, INJOIGNABLE)
- Notes textarea
- **Each text field has a small mic icon**. Tapping activates STT for THAT specific field only.
- Submit button saves to MockDB.

---

## STYLING & RESPONSIVENESS

- **Vanilla CSS only** in `globals.css`
- **Dark theme** as default (the Admin works late)
- **Responsiveness**:
  - The **Admin Dashboard** is desktop-first but MUST be fully mobile-ready and responsive (collapsing sidebars, stacking KPI cards on small screens).
  - The **Technician View** MUST be purely mobile-first.
- **Color palette**: Deep navy (`#0a0f1c`) background, electric blue (`#3b82f6`) accents, green (`#22c55e`) for REALISE, red (`#ef4444`) for ANNULER/REFUSE, amber (`#f59e0b`) for EN_ATTENTE, gray for INJOIGNABLE.

---

## INVOICE SPECIFICATION (`invoiceGenerator.ts`)

- **Advanced Selection**: Admin can select multiple clients or use dynamic filters (e.g., "All REALISE WOTs in Zone X for June").
- **Design**: MUST be elegant. Include a placeholder for the company logo. Professional header (Company details, INWI sub-contractor info, Date, Invoice #).
- **Details**: Grouped by Client/Zone, listing WOTs, unit prices, and total MAD. Extensive use of `jspdf-autotable` for layout.

---

## MAP SPECIFICATION (`MapWidget.tsx`)

- Simulated map data within Casablanca.
- Interactive dynamic filters (e.g., filter by WOT status, zone).
- UI controls built-in.
- The Agent can manipulate the map (via `update_map_filters` or `render_ui`).

<!-- END:project-architecture -->
