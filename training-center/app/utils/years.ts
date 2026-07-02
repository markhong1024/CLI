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
 * 데이터가 있는 가장 최근 연도를 기준으로 count개 연도를 반환 (오래된 순).
 * 마지막은 최근 데이터 연도 + 1년(다음 연도)까지 포함하여
 * 아직 미입력된 연도도 공란으로 표시할 수 있도록 한다.
 */
export function getRecentYears(centers: Center[], count = 3): Year[] {
  let latestIdx = -1;
  for (let i = YEARS.length - 1; i >= 0; i--) {
    if (centers.some((c) => c[YEAR_KEY[YEARS[i]]])) { latestIdx = i; break; }
  }
  if (latestIdx === -1) return [];
  const endIdx = Math.min(latestIdx + 1, YEARS.length - 1);
  const startIdx = Math.max(endIdx - count + 1, 0);
  return Array.from(YEARS.slice(startIdx, endIdx + 1)) as Year[];
}
