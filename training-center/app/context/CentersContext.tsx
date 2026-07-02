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

const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DB_URL; // e.g. https://xxx-default-rtdb.firebaseio.com
const ENDPOINT = DB_URL ? `${DB_URL}/centers.json` : null;
const STORAGE_KEY = "training-center-data";

async function fetchFromFirebase(): Promise<Center[] | null> {
  if (!ENDPOINT) return null;
  try {
    const res = await fetch(ENDPOINT);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function saveToFirebase(centers: Center[]): Promise<void> {
  if (!ENDPOINT) return;
  try {
    await fetch(ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(centers),
    });
  } catch {
    // silent fail — localStorage acts as fallback
  }
}

export function CentersProvider({ children }: { children: ReactNode }) {
  const [centers, setCenters] = useState<Center[]>(initialCenters);
  const [syncing, setSyncing] = useState(!!ENDPOINT);

  // 초기 로드: Firebase 우선, 없으면 localStorage
  useEffect(() => {
    async function load() {
      if (ENDPOINT) {
        const remote = await fetchFromFirebase();
        if (remote) {
          setCenters(remote);
          setSyncing(false);
          return;
        }
      }
      // Firebase 미설정 or 실패 → localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setCenters(JSON.parse(saved));
      } catch { /* ignore */ }
      setSyncing(false);
    }
    load();
  }, []);

  // 변경사항 동기화
  const persist = useCallback((next: Center[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    saveToFirebase(next);
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
    saveToFirebase(initialCenters);
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
