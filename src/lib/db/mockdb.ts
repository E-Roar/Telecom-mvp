/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
import { Client, WorkOrder, Technician, SavedPrompt } from "./types";
import { seedDatabase } from "./seed";

const isBrowser = typeof window !== "undefined";

const PREFIX = "mockdb_";

type CollectionKey = "clients" | "workOrders" | "technicians" | "invoices" | "savedPrompts";

class MockDB {
  private getStorageKey(col: CollectionKey) {
    return `${PREFIX}${col}`;
  }

  private read<T>(col: CollectionKey): T[] {
    if (!isBrowser) return [];
    const data = localStorage.getItem(this.getStorageKey(col));
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error parsing ${col} from localStorage`, e);
      return [];
    }
  }

  private write<T>(col: CollectionKey, data: T[]): void {
    if (!isBrowser) return;
    localStorage.setItem(this.getStorageKey(col), JSON.stringify(data));
  }

  // --- Initialization ---
  
  public async init() {
    if (!isBrowser) return;
    const version = localStorage.getItem(`${PREFIX}version`);
    if (version !== "6") {
      localStorage.removeItem(`${PREFIX}clients`);
      localStorage.removeItem(`${PREFIX}workOrders`);
      localStorage.removeItem(`${PREFIX}technicians`);
      localStorage.removeItem(`${PREFIX}invoices`);
      localStorage.removeItem(`${PREFIX}savedPrompts`);
      localStorage.setItem(`${PREFIX}version`, "6");
    }
    const clients = this.read<Client>("clients");
    if (clients.length === 0) {
      console.log("MockDB empty, seeding data...");
      seedDatabase(this);
    }
  }

  // --- CRUD Generic ---

  public getAll<T>(col: CollectionKey): T[] {
    return this.read<T>(col);
  }

  public getById<T extends { id: string }>(col: CollectionKey, id: string): T | undefined {
    const items = this.read<T>(col);
    return items.find((item) => item.id === id);
  }

  public create<T extends { id?: string; createdAt?: number; updatedAt?: number }>(
    col: CollectionKey,
    item: Omit<T, "id" | "createdAt" | "updatedAt">
  ): T {
    const items = this.read<T>(col);
    const now = Date.now();
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as T;
    
    items.push(newItem);
    this.write(col, items);
    if (isBrowser) window.dispatchEvent(new CustomEvent("agent:data-changed", { detail: { collection: col } }));
    return newItem;
  }

  public update<T extends Record<string, any>>(
    col: CollectionKey,
    id: string,
    updates: Partial<T>
  ): T | null {
    const items = this.read<T>(col);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...items[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    items[index] = updatedItem;
    this.write(col, items);
    if (isBrowser) window.dispatchEvent(new CustomEvent("agent:data-changed", { detail: { collection: col } }));
    return updatedItem;
  }

  public delete(col: CollectionKey, id: string): boolean {
    const items = this.read<{ id: string }>(col);
    const filtered = items.filter((item) => item.id !== id);
    if (filtered.length === items.length) return false;
    
    this.write(col, filtered);
    return true;
  }

  // --- Specific Queries ---

  public getWOTsByTechnician(technicianId: string): WorkOrder[] {
    const wots = this.read<WorkOrder>("workOrders");
    return wots.filter(w => w.technicianId === technicianId);
  }

  public getWOTsByStatus(status: string): WorkOrder[] {
    const wots = this.read<WorkOrder>("workOrders");
    return wots.filter(w => w.status === status);
  }
}

export const db = new MockDB();
