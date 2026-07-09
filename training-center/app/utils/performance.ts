import { PerformanceRecord } from "../data/performance";

export const BIZ_TYPES = [
  "재직자", "P-TECH", "4년제", "전문대재학생", "특화대학",
  "대학원", "경력개발", "첨단산업", "구직자", "외국인",
] as const;

export type PerfStatus = "초과" | "미달" | "미보고" | "해당없음";

export function getRate(r: PerformanceRecord): number | null {
  if (r.actual === null || r.target === 0) return null;
  return r.actual / r.target;
}

export function getStatus(r: PerformanceRecord): PerfStatus {
  if (r.actual === null) return "미보고";
  if (r.target === 0) return "해당없음";
  return r.actual / r.target >= 1 ? "초과" : "미달";
}

export const STATUS_COLORS: Record<PerfStatus, string> = {
  "초과": "bg-emerald-100 text-emerald-700",
  "미달": "bg-red-100 text-red-700",
  "미보고": "bg-slate-100 text-slate-500",
  "해당없음": "bg-slate-50 text-slate-400",
};

export const STATUS_BAR: Record<PerfStatus, string> = {
  "초과": "bg-emerald-500",
  "미달": "bg-red-500",
  "미보고": "bg-slate-300",
  "해당없음": "bg-slate-200",
};
