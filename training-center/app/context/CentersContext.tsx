"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { centers as initialCenters, Center } from "../data/mock";

interface CentersContextType {
  centers: Center[];
  updateCenter: (id: string, updates: Partial<Center>) => void;
  resetAll: () => void;
  syncing: boolean;
}

const CentersContext = createContext<CentersContextType | null>(null);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STORAGE_KEY = "training-center-data";

// Supabase REST API: app_data 테이블의 key='centers' 행에 전체 데이터를 JSON으로 저장
function supabaseHeaders() {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY!,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    "Prefer": "resolution=merge-duplicates",
  };
}

async function fetchFromSupabase(): Promise<Center[] | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_data?key=eq.centers&select=value`,
      { headers: supabaseHeaders() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.value ?? null;
  } catch {
    return null;
  }
}

async function saveToSupabase(centers: Center[]): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/app_data`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({ key: "centers", value: centers }),
    });
  } catch {
    // localStorage가 백업 역할
  }
}

export function CentersProvider({ children }: { children: ReactNode }) {
  const [centers, setCenters] = useState<Center[]>(initialCenters);
  const [syncing, setSyncing] = useState(!!(SUPABASE_URL && SUPABASE_ANON_KEY));

  // 초기 로드: Supabase 우선, 없으면 localStorage
  useEffect(() => {
    async function load() {
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        const remote = await fetchFromSupabase();
        if (remote) {
          setCenters(remote);
          setSyncing(false);
          return;
        }
      }
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setCenters(JSON.parse(saved));
      } catch { /* ignore */ }
      setSyncing(false);
    }
    load();
  }, []);

  const persist = useCallback((next: Center[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    saveToSupabase(next);
  }, []);

  function updateCenter(id: string, updates: Partial<Center>) {
    setCenters((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      persist(next);
      return next;
    });
  }

  function resetAll() {
    setCenters(initialCenters);
    localStorage.removeItem(STORAGE_KEY);
    saveToSupabase(initialCenters);
  }

  return (
    <CentersContext.Provider value={{ centers, updateCenter, resetAll, syncing }}>
      {children}
    </CentersContext.Provider>
  );
}

export function useCenters() {
  const ctx = useContext(CentersContext);
  if (!ctx) throw new Error("useCenters must be used within CentersProvider");
  return ctx;
}
