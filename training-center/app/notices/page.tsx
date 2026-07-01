"use client";

import { useState } from "react";
import { useCenters } from "../context/CentersContext";
import { downloadNoticesExcel } from "../utils/excel";
import { Search, AlertCircle, X, Download, Pencil } from "lucide-react";
import { Center } from "../data/mock";

const allManagers = (centers: Center[]) =>
  ["전체", ...Array.from(new Set(centers.map((c) => c.manager))).sort((a, b) => a.localeCompare(b, "ko"))];

export default function NoticesPage() {
  const { centers, updateCenter } = useCenters();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("전체");
  const [managerFilter, setManagerFilter] = useState("전체");
  const [editing, setEditing] = useState<Center | null>(null);

  const withNotes = centers.filter((c) => c.note || c.note2);
  const filtered = centers.filter((c) => {
    const matchSearch = c.name.includes(search) || c.note.includes(search) || c.note2.includes(search) || c.manager.includes(search);
    const matchRegion = regionFilter === "전체" || c.region === regionFilter;
    const matchManager = managerFilter === "전체" || c.manager === managerFilter;
    return matchSearch && matchRegion && matchManager;
  });

  function saveEdit() {
    if (!editing) return;
    updateCenter(editing.id, { note: editing.note, note2: editing.note2 });
    setEditing(null);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">특이사항 관리</h2>
          <p className="text-slate-500 text-sm mt-1">특이사항 기관 {withNotes.length}개 · {filtered.length}개 표시 중</p>
        </div>
        <button onClick={() => downloadNoticesExcel(filtered)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          <Download size={15} /> 엑셀 다운로드
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="기관명, 담당자, 내용 검색"
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {["전체", "수도강원", "충청전라", "경상"].map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {allManagers(centers).map((m) => <option key={m}>{m}</option>)}
        </select>
        {(search || regionFilter !== "전체" || managerFilter !== "전체") && (
          <button onClick={() => { setSearch(""); setRegionFilter("전체"); setManagerFilter("전체"); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <X size={14} /> 초기화
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-amber-300 transition-colors">
            <div className="flex items-start gap-4">
              <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-semibold text-slate-800">{c.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.region === "수도강원" ? "bg-blue-50 text-blue-700" :
                    c.region === "충청전라" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                  }`}>{c.region}</span>
                  <span className="text-xs text-slate-400">연번 {c.id} · 담당: {c.manager}</span>
                  {c.s24 && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      c.s24 === "S" ? "bg-violet-100 text-violet-700" : c.s24 === "A" ? "bg-blue-100 text-blue-700" :
                      c.s24 === "B" ? "bg-emerald-100 text-emerald-700" : c.s24 === "C" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    }`}>24년 {c.s24}</span>
                  )}
                </div>
                {c.note && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-amber-800 mb-2">{c.note}</div>
                )}
                {c.note2 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm text-slate-600">
                    <span className="text-xs font-medium text-slate-400 mr-2">비고</span>{c.note2}
                  </div>
                )}
              </div>
              <button onClick={() => setEditing({ ...c })}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <Pencil size={15} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 편집 모달 */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">{editing.name}</h3>
                <p className="text-xs text-slate-400">특이사항 / 비고 수정</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">특이사항</label>
                <textarea value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4} placeholder="특이사항 입력" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">비고</label>
                <textarea value={editing.note2} onChange={(e) => setEditing({ ...editing, note2: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3} placeholder="비고 입력" />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">취소</button>
              <button onClick={saveEdit} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
