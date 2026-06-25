export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const TOOLS: ToolDefinition[] = [
  {
    name: "create_wot",
    description: "Create a new work order (WOT) with client, category, zone, and optional technician assignment.",
    parameters: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "Client ID" },
        technicianId: { type: "string", description: "Technician ID to assign (optional)" },
        technicianName: { type: "string", description: "Technician name (optional, used with technicianId)" },
        category: { type: "string", enum: ["RACC", "SAV"] },
        interventionType: { type: "string", enum: ["FAT", "JARETIERE", "CABLE", "SLIMBOX", "CONFIGURATION_ONT", "AUTRE"] },
        zone: { type: "string" },
        address: { type: "string" },
        notes: { type: "string" },
      },
      required: ["clientId", "category"],
    },
  },
  {
    name: "search_clients",
    description: "Search and filter clients by name, zone, or phone. Can sort and limit results. Use displayColumns for custom table columns. Use displayChart to show a bar chart (e.g. by zone).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Client name (partial match)" },
        zone: { type: "string", description: "Filter by zone (e.g. CAS-HABOUS)" },
        phone: { type: "string", description: "Phone number (partial match)" },
        sortBy: { type: "string", enum: ["name", "zone", "createdAt", "status"], description: "Sort results by this field" },
        sortOrder: { type: "string", enum: ["asc", "desc"], description: "Sort order (default asc)" },
        limit: { type: "integer", description: "Max results to return (e.g. 1 for the oldest/newest)" },
        displayColumns: { type: "array", items: { type: "object", properties: { key: { type: "string" }, label: { type: "string" } } }, description: "Custom columns for the table display" },
        displayChart: { type: "object", properties: { type: { type: "string", enum: ["bar"] }, groupBy: { type: "string" } }, description: "Show a bar chart grouped by a field" },
      },
    },
  },
  {
    name: "search_wots",
    description: "Search and filter work orders by status, zone, technician, client, or date range. Can sort and limit results. Use displayColumns for custom table columns. Use displayChart to show a bar chart.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string" },
        zone: { type: "string" },
        technicianName: { type: "string" },
        clientName: { type: "string" },
        dateFrom: { type: "number" },
        dateTo: { type: "number" },
        sortBy: { type: "string", enum: ["createdAt", "wotNumber", "zone", "status", "clientName"] },
        sortOrder: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "integer" },
        displayColumns: { type: "array", items: { type: "object", properties: { key: { type: "string" }, label: { type: "string" } } } },
        displayChart: { type: "object", properties: { type: { type: "string", enum: ["bar"] }, groupBy: { type: "string" } } },
      },
    },
  },
  {
    name: "update_wot_status",
    description: "Update the status of an existing work order.",
    parameters: {
      type: "object",
      properties: {
        wotId: { type: "string", description: "Work order ID" },
        status: { type: "string", enum: ["EN_ATTENTE", "PLANIFIE", "EN_COURS", "REALISE", "ANNULER", "REFUSE", "INJOIGNABLE"] },
        notes: { type: "string" },
      },
      required: ["wotId", "status"],
    },
  },
  {
    name: "generate_advanced_invoice",
    description: "Generate an elegant PDF invoice for selected clients with optional period/status filters.",
    parameters: {
      type: "object",
      properties: {
        clientIds: { type: "array", items: { type: "string" }, description: "Array of client IDs" },
        period: { type: "string", description: "Billing period (e.g., 'Juin 2026')" },
        filterStatus: { type: "string", description: "Filter by WOT status" },
      },
      required: ["clientIds"],
    },
  },
  {
    name: "render_ui",
    description: "Render a view in the main area. Use with 'data' to show search results as an interactive table.",
    parameters: {
      type: "object",
      properties: {
        view: { type: "string", enum: ["dashboard", "map", "table", "chart", "technicians", "clients", "work-orders", "reports", "invoices"] },
        filters: { type: "object", description: "Optional filters for the view" },
        title: { type: "string", description: "Optional title for the rendered view" },
      },
      required: ["view"],
    },
  },
  {
    name: "navigate_to",
    description: "Navigate to a pre-built page in the application.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Route path (e.g., /admin/work-orders)" },
      },
      required: ["path"],
    },
  },
  {
    name: "update_map_filters",
    description: "Change the visible data on the interactive Casablanca map.",
    parameters: {
      type: "object",
      properties: {
        statusFilter: { type: "array", items: { type: "string" } },
        zoneFilter: { type: "array", items: { type: "string" } },
        centerLat: { type: "number" },
        centerLng: { type: "number" },
        zoom: { type: "number" },
      },
    },
  },
  {
    name: "manage_prompts",
    description: "Save, list, or delete favorite prompts for the agent panel.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["save", "list", "delete"] },
        promptId: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
      },
      required: ["action"],
    },
  },
];

export function getToolDefinitions() {
  return TOOLS.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}
