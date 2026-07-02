import { Center } from "../data/mock";

export const YEARS = ["2020","2021","2022","2023","2024","2025","2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"] as const;
export type Year = typeof YEARS[number];
export type ScoreKey = "s20"|"s21"|"s22"|"s23"|"s24"|"s25"|"s26"|"s27"|"s28"|"s29"|"s30"|"s31"|"s32"|"s33"|"s34"|"s35";

export const YEAR_KEY: Record<Year, ScoreKey> = {
  "2020":"s20","2021":"s21","2022":"s22","2023":"s23","2024":"s24","2025":"s25",
  "2026":"s26","2027":"s27","2028":"s28","2029":"s29","2030":"s30",
  "2031":"s31","2032":"s32","2033":"s33","2034":"s34","2035":"s35",
};

/**
 * 현재 연도를 제외하고 직전 count개 연도를 반환 (오래된 순).
 * 예: 현재 2026년 → [2023, 2024, 2025]
 */
export function getRecentYears(_centers: Center[], count = 3): Year[] {
  const currentYear = new Date().getFullYear().toString();
  const currentIdx = YEARS.indexOf(currentYear as Year);
  // 현재 연도가 범위 밖이면 마지막 연도를 기준으로 사용
  const endIdx = currentIdx > 0 ? currentIdx - 1 : YEARS.length - 1;
  const startIdx = Math.max(endIdx - count + 1, 0);
  return Array.from(YEARS.slice(startIdx, endIdx + 1)) as Year[];
}
