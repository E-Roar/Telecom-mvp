import { z } from "zod";

export const ColumnDef = z.object({
  key: z.string(),
  label: z.string(),
  width: z.string().optional(),
});

export const ChartConfig = z.object({
  type: z.enum(["bar", "pie"]),
  groupBy: z.string().optional(),
  label: z.string().optional(),
});

export const ToolName = z.enum([
  "create_wot",
  "search_wots",
  "search_clients",
  "update_wot_status",
  "generate_advanced_invoice",
  "render_ui",
  "navigate_to",
  "update_map_filters",
  "manage_prompts",
]);

export const CreateWOTSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  technicianId: z.string().optional(),
  category: z.enum(["RACC", "SAV"]),
  interventionType: z.enum(["FAT", "JARETIERE", "CABLE", "SLIMBOX", "CONFIGURATION_ONT", "AUTRE"]).optional(),
  zone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const SearchClientsSchema = z.object({
  name: z.string().optional(),
  zone: z.string().optional(),
  phone: z.string().optional(),
  sortBy: z.enum(["name", "zone", "createdAt", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  limit: z.number().positive().optional(),
  displayColumns: z.array(ColumnDef).optional(),
  displayChart: ChartConfig.optional(),
});

export const SearchWOTsSchema = z.object({
  status: z.string().optional(),
  zone: z.string().optional(),
  technicianName: z.string().optional(),
  clientName: z.string().optional(),
  dateFrom: z.number().optional(),
  dateTo: z.number().optional(),
  sortBy: z.enum(["createdAt", "wotNumber", "zone", "status", "clientName"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  limit: z.number().positive().optional(),
  displayColumns: z.array(ColumnDef).optional(),
  displayChart: ChartConfig.optional(),
});

export const UpdateWOTStatusSchema = z.object({
  wotId: z.string().min(1),
  status: z.enum(["EN_ATTENTE", "PLANIFIE", "EN_COURS", "REALISE", "ANNULER", "REFUSE", "INJOIGNABLE"]),
  notes: z.string().optional(),
});

export const GenerateInvoiceSchema = z.object({
  clientIds: z.array(z.string()).min(1, "At least one client required"),
  period: z.string().optional(),
  filterStatus: z.string().optional(),
});

export const RenderUISchema = z.object({
  view: z.enum(["dashboard", "map", "table", "chart", "technicians", "clients", "work-orders", "reports", "invoices"]),
  filters: z.record(z.string(), z.unknown()).optional(),
  data: z.array(z.record(z.string(), z.unknown())).optional(),
  title: z.string().optional(),
  columns: z.array(ColumnDef).optional(),
  chart: ChartConfig.optional(),
});

export const NavigateToSchema = z.object({
  path: z.string().min(1),
});

export const UpdateMapFiltersSchema = z.object({
  statusFilter: z.array(z.string()).optional(),
  zoneFilter: z.array(z.string()).optional(),
  centerLat: z.number().optional(),
  centerLng: z.number().optional(),
  zoom: z.number().optional(),
});

export const ManagePromptsSchema = z.object({
  action: z.enum(["save", "list", "delete"]),
  promptId: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
});

const toolSchemas: Record<string, z.ZodTypeAny> = {
  create_wot: CreateWOTSchema,
  search_wots: SearchWOTsSchema,
  search_clients: SearchClientsSchema,
  update_wot_status: UpdateWOTStatusSchema,
  generate_advanced_invoice: GenerateInvoiceSchema,
  render_ui: RenderUISchema,
  navigate_to: NavigateToSchema,
  update_map_filters: UpdateMapFiltersSchema,
  manage_prompts: ManagePromptsSchema,
};

export function getToolSchema(name: string): z.ZodTypeAny | undefined {
  return toolSchemas[name];
}

export const AgentResponseSchema = z.object({
  reasoning: z.string(),
  tool: z.object({
    name: ToolName,
    arguments: z.record(z.string(), z.unknown()),
  }).optional(),
  confirmBeforeExecute: z.boolean().default(true),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type ToolNames = z.infer<typeof ToolName>;
