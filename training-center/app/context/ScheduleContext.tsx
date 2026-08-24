"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ConsultingEvent {
  id: string;
  centerId: string;
  centerName: string;
  date: string; // YYYY-MM-DD
  purpose: string;
  status: "예정" | "확정" | "완료";
  note: string;
}

interface ScheduleContextType {
  events: ConsultingEvent[];
  addEvent: (data: Omit<ConsultingEvent, "id">) => void;
  updateEvent: (id: string, data: Partial<ConsultingEvent>) => void;
  deleteEvent: (id: string) => void;
}

const ScheduleContext = createContext<ScheduleContextType | null>(null);

const STORAGE_KEY = "training-center-consulting";

function loadLocal(): ConsultingEvent[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveLocal(events: ConsultingEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ConsultingEvent[]>([]);

  useEffect(() => {
    setEvents(loadLocal());
  }, []);

  function addEvent(data: Omit<ConsultingEvent, "id">) {
    const newEvent: ConsultingEvent = {
      ...data,
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setEvents((prev) => {
      const next = [...prev, newEvent];
      saveLocal(next);
      return next;
    });
  }

  function updateEvent(id: string, data: Partial<ConsultingEvent>) {
    setEvents((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...data } : e));
      saveLocal(next);
      return next;
    });
  }

  function deleteEvent(id: string) {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveLocal(next);
      return next;
    });
  }

  return (
    <ScheduleContext.Provider value={{ events, addEvent, updateEvent, deleteEvent }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used within ScheduleProvider");
  return ctx;
}
