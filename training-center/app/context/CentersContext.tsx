"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { centers as initialCenters, Center } from "../data/mock";

interface CentersContextType {
  centers: Center[];
  updateCenter: (id: string, updates: Partial<Center>) => void;
  resetAll: () => void;
  syncing: boolean;
  cloudEnabled: boolean;
  cloudStatus: "connected" | "local" | "loading" | "error";
  manualSync: () => Promise<void>;
}

const CentersContext = createContext<CentersContextType | null>(null);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STORAGE_KEY = "training-center-data";

function baseHeaders() {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY!,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

async function fetchFromSupabase(): Promise<Center[] | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_data?key=eq.centers&select=value`,
      { headers: baseHeaders() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.value ?? null;
  } catch {
    return null;
  }
}

async function saveToSupabase(centers: Center[]): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    // 1단계: 기존 행 삭제
    await fetch(`${SUPABASE_URL}/rest/v1/app_data?key=eq.centers`, {
      method: "DELETE",
      headers: baseHeaders(),
    });
    // 2단계: 새 데이터 삽입
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_data`, {
      method: "POST",
      headers: { ...baseHeaders(), "Prefer": "return=minimal" },
      body: JSON.stringify({ key: "centers", value: centers }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function loadLocal(): Center[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

export function CentersProvider({ children }: { children: ReactNode }) {
  const [centers, setCenters] = useState<Center[]>(initialCenters);
  const [syncing, setSyncing] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<"connected" | "local" | "loading" | "error">("loading");
  const cloudEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

  useEffect(() => {
    async function load() {
      setSyncing(true);
      setCloudStatus("loading");

      if (cloudEnabled) {
        const remote = await fetchFromSupabase();
        if (remote) {
          // Supabase에 데이터 있음 → 사용
          setCenters(remote);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
          setCloudStatus("connected");
          setSyncing(false);
          return;
        }

        // Supabase 비어있음 → 로컬 데이터가 있으면 업로드
        const local = loadLocal();
        const data = local ?? initialCenters;
        setCenters(data);
        const ok = await saveToSupabase(data);
        setCloudStatus(ok ? "connected" : "error");
      } else {
        // Supabase 미설정 → 로컬만 사용
        const local = loadLocal();
        if (local) setCenters(local);
        setCloudStatus("local");
      }
      setSyncing(false);
    }
    load();
  }, [cloudEnabled]);

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

  // 수동 동기화: 현재 로컬 데이터를 Supabase에 강제 업로드
  const manualSync = useCallback(async () => {
    setSyncing(true);
    setCloudStatus("loading");
    const local = loadLocal();
    const data = local ?? centers;
    const ok = await saveToSupabase(data);
    setCloudStatus(ok ? "connected" : "error");
    setSyncing(false);
  }, [centers]);

  return (
    <CentersContext.Provider value={{ centers, updateCenter, resetAll, syncing, cloudEnabled, cloudStatus, manualSync }}>
      {children}
    </CentersContext.Provider>
  );
}

export function useCenters() {
  const ctx = useContext(CentersContext);
  if (!ctx) throw new Error("useCenters must be used within CentersProvider");
  return ctx;
}
