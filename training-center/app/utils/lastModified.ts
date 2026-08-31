const LAST_MODIFIED_KEY = "tc-last-modified";

/** 오늘 날짜를 localStorage에 저장하고, 사이드바에 변경 이벤트를 알린다. */
export function touchLastModified() {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  try {
    localStorage.setItem(LAST_MODIFIED_KEY, today);
    window.dispatchEvent(new Event("tc-data-updated"));
  } catch {}
}

/** 정적 버전 상수들과 localStorage 저장일 중 가장 최신 날짜를 반환한다. */
export function getLastModified(staticVersions: string[]): string {
  const base = [...staticVersions].sort().at(-1) ?? "";
  if (typeof window === "undefined") return base;
  try {
    const stored = localStorage.getItem(LAST_MODIFIED_KEY) ?? "";
    return [base, stored].filter(Boolean).sort().at(-1) ?? base;
  } catch {
    return base;
  }
}
