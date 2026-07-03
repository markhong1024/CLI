"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { centers as initialCenters, Center, DATA_VERSION } from "../data/mock";

interface CentersContextType {
  centers: Center[];
  updateCenter: (id: string, updates: Partial<Center>) => void;
  resetAll: () => void;
  syncing: boolean;
  cloudStatus: "connected" | "local" | "loading" | "error";
  manualSync: () => Promise<void>;
  saveSettings: (url: string, key: string) => void;
  supabaseUrl: string;
  supabaseKey: string;
}

const CentersContext = createContext<CentersContextType | null>(null);

const DATA_KEY = "training-center-data";
const VERSION_KEY = "training-center-version";
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

async function fetchRemote(url: string, key: string): Promise<Center[] | null> {
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/app_data?key=eq.centers&select=value`, {
      headers: baseHeaders(key),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    const payload = rows?.[0]?.value;
    if (!payload) return null;
    // 버전 체크: Supabase 데이터가 현재 버전과 다르면 무시
    if (payload.version !== DATA_VERSION) return null;
    return payload.data ?? null;
  } catch {
    return null;
  }
}

async function saveRemote(url: string, key: string, centers: Center[]): Promise<boolean> {
  if (!url || !key) return false;
  try {
    await fetch(`${url}/rest/v1/app_data?key=eq.centers`, {
      method: "DELETE",
      headers: baseHeaders(key),
    });
    const res = await fetch(`${url}/rest/v1/app_data`, {
      method: "POST",
      headers: { ...baseHeaders(key), "Prefer": "return=minimal" },
      body: JSON.stringify({ key: "centers", value: { version: DATA_VERSION, data: centers } }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function loadLocal(): Center[] | null {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    if (version !== DATA_VERSION) return null; // 버전 다르면 무시
    const saved = localStorage.getItem(DATA_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveLocal(data: Center[]) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  localStorage.setItem(VERSION_KEY, DATA_VERSION);
}

export function CentersProvider({ children }: { children: ReactNode }) {
  const [centers, setCenters] = useState<Center[]>(initialCenters);
  const [syncing, setSyncing] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<"connected" | "local" | "loading" | "error">("loading");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");

  useEffect(() => {
    const { url, key } = getConfig();
    setSupabaseUrl(url);
    setSupabaseKey(key);

    async function load() {
      setSyncing(true);
      setCloudStatus("loading");

      if (url && key) {
        const remote = await fetchRemote(url, key);
        if (remote) {
          setCenters(remote);
          saveLocal(remote);
          setCloudStatus("connected");
          setSyncing(false);
          return;
        }
        // Supabase 비어있음 → 로컬 데이터 업로드 시도
        const local = loadLocal();
        const data = local ?? initialCenters;
        setCenters(data);
        const ok = await saveRemote(url, key, data);
        setCloudStatus(ok ? "connected" : "error");
      } else {
        const local = loadLocal();
        if (local) setCenters(local);
        setCloudStatus("local");
      }
      setSyncing(false);
    }
    load();
  }, []);

  const persist = useCallback((next: Center[]) => {
    saveLocal(next);
    const { url, key } = getConfig();
    saveRemote(url, key, next);
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
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(VERSION_KEY);
    const { url, key } = getConfig();
    saveRemote(url, key, initialCenters);
  }

  const manualSync = useCallback(async () => {
    const { url, key } = getConfig();
    if (!url || !key) { setCloudStatus("local"); return; }
    setSyncing(true);
    setCloudStatus("loading");
    const local = loadLocal();
    const data = local ?? centers;
    const ok = await saveRemote(url, key, data);
    setCloudStatus(ok ? "connected" : "error");
    setSyncing(false);
  }, [centers]);

  function saveSettings(url: string, key: string) {
    localStorage.setItem(CFG_URL_KEY, url.trim());
    localStorage.setItem(CFG_KEY_KEY, key.trim());
    setSupabaseUrl(url.trim());
    setSupabaseKey(key.trim());
    // 즉시 연결 시도
    setSyncing(true);
    setCloudStatus("loading");
    const local = loadLocal();
    const data = local ?? centers;
    saveRemote(url.trim(), key.trim(), data).then((ok) => {
      setCloudStatus(ok ? "connected" : "error");
      setSyncing(false);
    });
  }

  return (
    <CentersContext.Provider value={{
      centers, updateCenter, resetAll,
      syncing, cloudStatus, manualSync,
      saveSettings, supabaseUrl, supabaseKey,
    }}>
      {children}
    </CentersContext.Provider>
  );
}

export function useCenters() {
  const ctx = useContext(CentersContext);
  if (!ctx) throw new Error("useCenters must be used within CentersProvider");
  return ctx;
}
