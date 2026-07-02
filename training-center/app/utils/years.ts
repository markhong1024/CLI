import { Center } from "../data/mock";

export const YEARS = ["2020","2021","2022","2023","2024","2025","2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"] as const;
export type Year = typeof YEARS[number];
export type ScoreKey = "s20"|"s21"|"s22"|"s23"|"s24"|"s25"|"s26"|"s27"|"s28"|"s29"|"s30"|"s31"|"s32"|"s33"|"s34"|"s35";

export const YEAR_KEY: Record<Year, ScoreKey> = {
  "2020":"s20","2021":"s21","2022":"s22","2023":"s23","2024":"s24","2025":"s25",
  "2026":"s26","2027":"s27","2028":"s28","2029":"s29","2030":"s30",
  "2031":"s31","2032":"s32","2033":"s33","2034":"s34","2035":"s35",
};

/** 데이터가 입력된 가장 최근 N개 연도를 반환 (오래된 순) */
export function getRecentYears(centers: Center[], count = 2): Year[] {
  const result: Year[] = [];
  for (let i = YEARS.length - 1; i >= 0 && result.length < count; i--) {
    const key = YEAR_KEY[YEARS[i]];
    if (centers.some((c) => c[key])) result.unshift(YEARS[i]);
  }
  return result;
}
