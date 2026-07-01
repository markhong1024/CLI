"use client";

import { useState } from "react";
import { useCenters } from "../context/CentersContext";
import { downloadScoresExcel } from "../utils/excel";
import { Download, Pencil, X } from "lucide-react";
import { Center } from "../data/mock";

const GRADES = ["S", "A", "B", "C", "D"];
const SPECIAL = ["신규", "미운영", "포기", "지정취소"];
const ALL_GRADES = ["", "S", "A", "B", "C", "D", "신규", "미운영", "포기", "지정취소"];
const SCORE_COLORS: Record<string, string> = {
  S: "bg-violet-100 text-violet-700",
  A: "bg-blue-100 text-blue-700",
  B: "bg-emerald-100 text-emerald-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-red-100 text-red-700",
};
const SCORE_BAR: Record<string, string> = {
  S: "bg-violet-500", A: "bg-blue-500", B: "bg-emerald-500", C: "bg-amber-500", D: "bg-red-500",
};

const YEARS = ["2020","2021","2022","2023","2024","2025","2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"] as const;
type Year = typeof YEARS[number];
type ScoreKey = "s20"|"s21"|"s22"|"s23"|"s24"|"s25"|"s26"|"s27"|"s28"|"s29"|"s30"|"s31"|"s32"|"s33"|"s34"|"s35";
const YEAR_KEY: Record<Year, ScoreKey> = {
  "2020":"s20","2021":"s21","2022":"s22","2023":"s23","2024":"s24","2025":"s25",
  "2026":"s26","2027":"s27","2028":"s28","2029":"s29","2030":"s30",
  "2031":"s31","2032":"s32","2033":"s33","2034":"s34","2035":"s35",
};

export default function ScoresPage() {
  const { centers, updateCenter } = useCenters();
  const [selectedYear, setSelectedYear] = useState<Year>("2024");
  const [regionFilter, setRegionFilter] = useState("전체");
  const [gradeFilter, setGradeFilter] = useState("전체");
  const [editing, setEditing] = useState<Center | null>(null);

  const key = YEAR_KEY[selectedYear];

  const filtered = centers.filter((c) => {
    const matchRegion = regionFilter === "전체" || c.region === regionFilter;
    const matchGrade = gradeFilter === "전체" || c[key] === gradeFilter;
    return matchRegion && matchGrade;
  });

  const dist = GRADES.map((g) => ({
    grade: g,
    count: centers.filter((c) => c[key] === g && (regionFilter === "전체" || c.region === regionFilter)).length,
  }));
  const total = dist.reduce((s, d) => s + d.count, 0);

  const specialCounts = SPECIAL.map((s) => ({
    label: s,
    count: centers.filter((c) => c[key] === s && (regionFilter === "전체" || c.region === regionFilter)).length,
  })).filter((s) => s.count > 0);

  function saveEdit() {
    if (!editing) return;
    updateCenter(editing.id, {
      s20: editing.s20, s21: editing.s21, s22: editing.s22, s23: editing.s23,
      s24: editing.s24, s25: editing.s25, s26: editing.s26, s27: editing.s27,
      s28: editing.s28, s29: editing.s29, s30: editing.s30, s31: editing.s31,
      s32: editing.s32, s33: editing.s33, s34: editing.s34, s35: editing.s35,
      rate24: editing.rate24, manager: editing.manager,
    });
    setEditing(null);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">성과평가 현황</h2>
          <p className="text-slate-500 text-sm mt-1">연도별 성과평가 등급 분포 및 기관별 현황</p>
        </div>
        <button onClick={() => downloadScoresExcel(filtered)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          <Download size={15} /> 엑셀 다운로드
        </button>
      </div>

      {/* 연도 탭 */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {YEARS.map((y) => (
          <button key={y} onClick={() => setSelectedYear(y)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${selectedYear === y ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {y}년
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex gap-3 mb-6">
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="select">
          {["전체", "수도강원", "충청전라", "경상"].map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="select">
          <option value="전체">전체 등급</option>
          {GRADES.map((g) => <option key={g}>{g}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 등급 분포 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">{selectedYear}년 등급 분포</h3>
          <div className="space-y-3 mb-4">
            {dist.map(({ grade, count }) => (
              <div key={grade}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${SCORE_COLORS[grade]}`}>{grade}</span>
                  <span className="text-slate-500">{count}개 ({total > 0 ? Math.round((count / total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${SCORE_BAR[grade]}`} style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3 text-xs text-slate-400 space-y-0.5">
            <p>평가 대상: {total}개 기관</p>
            {specialCounts.map(({ label, count }) => <p key={label}>{label}: {count}개</p>)}
          </div>
        </div>

        {/* 기관 목록 */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">{selectedYear}년 기관별 평가 현황</h3>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length}개 기관 · 연필 아이콘으로 등급 수정 가능</p>
          </div>
          <div className="overflow-y-auto max-h-[520px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="th">연번</th>
                  <th className="th">지역</th>
                  <th className="th">공동훈련센터명</th>
                  <th className="th">등급</th>
                  <th className="th">추이</th>
                  <th className="th">편집</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => {
                  const grade = c[key];
                  const trend = [c.s20,c.s21,c.s22,c.s23,c.s24,c.s25,c.s26,c.s27,c.s28,c.s29,c.s30,c.s31,c.s32,c.s33,c.s34,c.s35];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="td text-slate-400 text-xs font-mono">{c.id}</td>
                      <td className="td">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          c.region === "수도강원" ? "bg-blue-50 text-blue-700" :
                          c.region === "충청전라" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                        }`}>{c.region}</span>
                      </td>
                      <td className="td font-medium text-slate-700">{c.name}</td>
                      <td className="td">
                        {grade ? <span className={`px-2 py-0.5 rounded text-xs font-bold ${SCORE_COLORS[grade] ?? "bg-slate-100 text-slate-500"}`}>{grade}</span>
                          : <span className="text-slate-300 text-xs">미실시</span>}
                      </td>
                      <td className="td">
                        <div className="flex gap-0.5">
                          {trend.map((g, i) => (
                            <span key={i} className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold ${g ? (SCORE_COLORS[g] ?? "bg-slate-100 text-slate-400") : "bg-slate-50 text-slate-200"}`}>
                              {g ? g[0] : "·"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="td">
                        <button onClick={() => setEditing({ ...c })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 편집 모달 */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">{editing.name}</h3>
                <p className="text-xs text-slate-400">성과평가 등급 수정</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">연도별 등급</p>
                <div className="grid grid-cols-4 gap-2">
                  {(["s20","s21","s22","s23","s24","s25","s26","s27","s28","s29","s30","s31","s32","s33","s34","s35"] as const).map((k, i) => (
                    <div key={k}>
                      <label className="block text-xs text-slate-400 mb-1">
                        {2020 + i}년
                        {i >= 5 && <span className="ml-1 text-blue-400 text-xs">●</span>}
                      </label>
                      <select value={editing[k] ?? ""} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} className="select w-full">
                        {ALL_GRADES.map((g) => <option key={g} value={g}>{g || "-"}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">2024년 취업률 (%)</label>
                <input value={editing.rate24} onChange={(e) => setEditing({ ...editing, rate24: e.target.value })}
                  className="input w-40" placeholder="예: 85.3" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">담당자</label>
                <input value={editing.manager} onChange={(e) => setEditing({ ...editing, manager: e.target.value })} className="input" />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">취소</button>
              <button onClick={saveEdit} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">저장</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .select { padding: 0.5rem 0.625rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; outline: none; }
        .select:focus { box-shadow: 0 0 0 2px #3b82f6; }
        .th { text-align: left; padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 600; color: #64748b; }
        .td { padding: 0.625rem 1rem; }
        .input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; outline: none; }
        .input:focus { box-shadow: 0 0 0 2px #3b82f6; }
      `}</style>
    </div>
  );
}
