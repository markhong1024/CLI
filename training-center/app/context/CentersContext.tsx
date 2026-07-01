"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { centers as initialCenters, Center } from "../data/mock";

interface CentersContextType {
  centers: Center[];
  updateCenter: (id: string, updates: Partial<Center>) => void;
  resetAll: () => void;
}

const CentersContext = createContext<CentersContextType | null>(null);

const STORAGE_KEY = "training-center-data";

export function CentersProvider({ children }: { children: ReactNode }) {
  const [centers, setCenters] = useState<Center[]>(() => {
    if (typeof window === "undefined") return initialCenters;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialCenters;
    } catch {
      return initialCenters;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(centers));
  }, [centers]);

  function updateCenter(id: string, updates: Partial<Center>) {
    setCenters((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  function resetAll() {
    setCenters(initialCenters);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <CentersContext.Provider value={{ centers, updateCenter, resetAll }}>
      {children}
    </CentersContext.Provider>
  );
}

export function useCenters() {
  const ctx = useContext(CentersContext);
  if (!ctx) throw new Error("useCenters must be used within CentersProvider");
  return ctx;
}
