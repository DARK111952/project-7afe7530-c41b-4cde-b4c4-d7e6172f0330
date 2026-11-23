import { useSyncExternalStore } from "react";
import { useHydrated } from "@tanstack/react-router";
import { createDemoTransactions, type Transaction } from "./finance";

const STORAGE_KEY = "student-finance:transactions:v1";
const EMPTY: Transaction[] = [];
const listeners = new Set<() => void>();
let cache: Transaction[] | null = null;

function isTransaction(v: unknown): v is Transaction {
  if (!v || typeof v !== "object") return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t["id"] === "string" &&
    (t["type"] === "income" || t["type"] === "expense") &&
    typeof t["amount"] === "number" &&
    typeof t["category"] === "string" &&
    typeof t["date"] === "string"
  );
}

function read(): Transaction[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      cache = createDemoTransactions(new Date());
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } else {
      const parsed: unknown = JSON.parse(raw);
      cache = Array.isArray(parsed) ? parsed.filter(isTransaction) : [];
    }
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Transaction[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable: keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useTransactions() {
  const transactions = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useHydrated();
  return { transactions, ready };
}

export function addTransaction(t: Omit<Transaction, "id" | "createdAt">) {
  const item: Transaction = {
    ...t,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
    createdAt: Date.now(),
  };
  write([item, ...read()]);
  return item;
}

export function deleteTransaction(id: string) {
  write(read().filter((t) => t.id !== id));
}

export function restoreTransaction(t: Transaction) {
  write([t, ...read().filter((x) => x.id !== t.id)]);
}
