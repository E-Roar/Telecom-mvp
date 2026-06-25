import { z } from 'zod/v4';

export type UserRole = 'admin' | 'technician';

export interface AuthUser {
  email: string;
  role: UserRole;
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
}

export type WOTStatus = 'new' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkOrder {
  id: string;
  wotNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  technicianId: string | null;
  technicianName: string | null;
  status: WOTStatus;
  zone: string;
  address: string;
  city: string;
  phone1: string;
  phone2: string;
  notes: string;
  photos: string[];
  category: string;
  interventionType: string | null;
  scheduledDate: number | null;
  lat: number | null;
  lng: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Client {
  id: string;
  name: string;
  phone1: string;
  phone2: string;
  address: string;
  city: string;
  zone: string;
  status: string;
  notes: string;
  wotNumber: string;
  createdAt: number;
  updatedAt: number;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  zones: string[];
  activeWots: number;
  completedWots: number;
  lat: number | null;
  lng: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  tags: string[];
  usageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface InvoiceEntry {
  clientId: string;
  workOrderIds: string[];
}

export interface ReportFilters {
  status?: WOTStatus | '';
  zone?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type TableColumn<T = Record<string, unknown>> = {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
};

export type SortDirection = 'asc' | 'desc';

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
};

export const ZONES = [
  'RACC',
  'Bourgogne',
  'Gauthier',
  'Val d\'Or',
  'California',
  'Anfa',
  'Maârif',
  'Palmier',
  'Beauséjour',
  'Oasis',
  'Mers Sultan',
  'Hôpital',
  'Sidi Othmane',
  'Aïn Chock',
  'Hay Hassani',
  'Moulay Rachid',
  'Sidi Bernoussi',
  'Sbata',
  'Médiouna',
  'Nouaceur',
  'Bouskoura',
] as const;

export type Zone = typeof ZONES[number];

export const WOT_STATUS_LABELS: Record<WOTStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const WOT_STATUS_COLORS: Record<WOTStatus, string> = {
  new: '#0891b2',
  assigned: '#f59e0b',
  in_progress: '#ea580c',
  completed: '#16a34a',
  cancelled: '#ef4444',
};

// ---- Zod Schemas ----
export const ZWorkOrder = z.object({
  id: z.string(),
  wotNumber: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  clientPhone: z.string(),
  technicianId: z.string().nullable(),
  technicianName: z.string().nullable(),
  status: z.enum(['new', 'assigned', 'in_progress', 'completed', 'cancelled']),
  zone: z.string(),
  address: z.string(),
  city: z.string(),
  phone1: z.string(),
  phone2: z.string(),
  notes: z.string(),
  photos: z.array(z.string()),
  category: z.string(),
  interventionType: z.string().nullable(),
  scheduledDate: z.number().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ZClient = z.object({
  id: z.string(),
  name: z.string(),
  phone1: z.string(),
  phone2: z.string(),
  address: z.string(),
  city: z.string(),
  zone: z.string(),
  status: z.string(),
  notes: z.string(),
  wotNumber: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ZTechnician = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  avatar: z.string(),
  rating: z.number(),
  zones: z.array(z.string()),
  activeWots: z.number(),
  completedWots: z.number(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ZSavedPrompt = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  tags: z.array(z.string()),
  usageCount: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
