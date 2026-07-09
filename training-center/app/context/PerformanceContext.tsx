"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { performanceRecords as initialRecords, PerformanceRecord, PERF_DATA_VERSION } from "../data/performance";

interface PerformanceContextType {
  records: PerformanceRecord[];
  updateRecord: (id: string, updates: Partial<PerformanceRecord>) => void;
  resetAll: () => void;
  syncing: boolean;
  manualSync: () => Promise<void>;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

const DATA_KEY = "training-center-performance-data";
const VERSION_KEY = "training-center-performance-version";
const CFG_URL_KEY = "tc-supabase-url";
const CFG_KEY_KEY = "tc-supabase-key";

function getConfig() {
  if (typeof window === "undefined") return { url: "", key: "" };
  return {
    url: localStorage.getItem(CFG_URL_KEY) ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    key: localStorage.getItem(CFG_KEY_KEY) ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

function baseHeaders(key: string) {
  return {
    "Content-Type": "application/json",
    "apikey": key,
    "Authorization": `Bearer ${key}`,
  };
}

async function fetchRemote(url: string, key: string): Promise<PerformanceRecord[] | null> {
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/app_data?key=eq.performance&select=value`, {
      headers: baseHeaders(key),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    const payload = rows?.[0]?.value;
    if (!payload) return null;
    if (payload.version !== PERF_DATA_VERSION) return null;
    return payload.data ?? null;
  } catch {
    return null;
  }
}

async function saveRemote(url: string, key: string, records: PerformanceRecord[]): Promise<boolean> {
  if (!url || !key) return false;
  try {
    await fetch(`${url}/rest/v1/app_data?key=eq.performance`, {
      method: "DELETE",
      headers: baseHeaders(key),
    });
    const res = await fetch(`${url}/rest/v1/app_data`, {
      method: "POST",
      headers: { ...baseHeaders(key), "Prefer": "return=minimal" },
      body: JSON.stringify({ key: "performance", value: { version: PERF_DATA_VERSION, data: records } }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function loadLocal(): PerformanceRecord[] | null {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    if (version !== PERF_DATA_VERSION) return null;
    const saved = localStorage.getItem(DATA_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveLocal(data: PerformanceRecord[]) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  localStorage.setItem(VERSION_KEY, PERF_DATA_VERSION);
}

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<PerformanceRecord[]>(initialRecords);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    const { url, key } = getConfig();

    async function load() {
      setSyncing(true);
      if (url && key) {
        const remote = await fetchRemote(url, key);
        if (remote) {
          setRecords(remote);
          saveLocal(remote);
          setSyncing(false);
          return;
        }
        const local = loadLocal();
        const data = local ?? initialRecords;
        setRecords(data);
        await saveRemote(url, key, data);
      } else {
        const local = loadLocal();
        if (local) setRecords(local);
      }
      setSyncing(false);
    }
    load();
  }, []);

  const persist = useCallback((next: PerformanceRecord[]) => {
    saveLocal(next);
    const { url, key } = getConfig();
    saveRemote(url, key, next);
  }, []);

  function updateRecord(id: string, updates: Partial<PerformanceRecord>) {
    setRecords((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      persist(next);
      return next;
    });
  }

  function resetAll() {
    setRecords(initialRecords);
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(VERSION_KEY);
    const { url, key } = getConfig();
    saveRemote(url, key, initialRecords);
  }

  const manualSync = useCallback(async () => {
    const { url, key } = getConfig();
    if (!url || !key) return;
    setSyncing(true);
    const local = loadLocal();
    const data = local ?? records;
    await saveRemote(url, key, data);
    setSyncing(false);
  }, [records]);

  return (
    <PerformanceContext.Provider value={{ records, updateRecord, resetAll, syncing, manualSync }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const ctx = useContext(PerformanceContext);
  if (!ctx) throw new Error("usePerformance must be used within PerformanceProvider");
  return ctx;
}
