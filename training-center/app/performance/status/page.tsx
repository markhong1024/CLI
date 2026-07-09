"use client";

import { useState } from "react";
import { usePerformance } from "../../context/PerformanceContext";
import { downloadPerformanceExcel } from "../../utils/excel";
import { BIZ_TYPES, getRate, getStatus, STATUS_COLORS, STATUS_BAR, PerfStatus } from "../../utils/performance";
import { Search, X, ChevronDown, ChevronUp, Download } from "lucide-react";

const STATUSES: ("전체" | PerfStatus)[] = ["전체", "초과", "미달", "미보고", "해당없음"];

type SortCol = "centerName" | "bizType" | "target" | "actual" | "rate";

export default function PerformanceStatusPage() {
  const { records, syncing } = usePerformance();
  const [search, setSearch] = useState("");
  const [bizFilter, setBizFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState<"전체" | PerfStatus>("전체");
  const [sortCol, setSortCol] = useState<SortCol>("rate");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = records
    .filter((r) => {
      const matchSearch = r.centerName.includes(search);
      const matchBiz = bizFilter === "전체" || r.bizType === bizFilter;
      const matchStatus = statusFilter === "전체" || getStatus(r) === statusFilter;
      return matchSearch && matchBiz && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === "centerName" || sortCol === "bizType") {
        cmp = a[sortCol].localeCompare(b[sortCol], "ko");
      } else if (sortCol === "target" || sortCol === "actual") {
        cmp = (a[sortCol] ?? -1) - (b[sortCol] ?? -1);
      } else {
        const ra = getRate(a);
        const rb = getRate(b);
        cmp = (ra ?? -1) - (rb ?? -1);
      }
      return sortAsc ? cmp : -cmp;
    });

  const statusCounts = STATUSES.slice(1).map((s) => ({
    status: s as PerfStatus,
    count: records.filter((r) => getStatus(r) === s).length,
  }));

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(col === "centerName" || col === "bizType"); }
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ChevronDown size={11} className="inline ml-0.5 text-slate-300" />;
    return sortAsc ? <ChevronUp size={11} className="inline ml-0.5" /> : <ChevronDown size={11} className="inline ml-0.5" />;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">목표대비 초과/미달 현황</h2>
          <p className="text-slate-500 text-sm mt-1">총 {records.length}건 · {filtered.length}건 표시 중</p>
        </div>
        <button
          onClick={() => downloadPerformanceExcel(filtered)}
          disabled={syncing}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={15} /> {syncing ? "로딩 중..." : "엑셀 다운로드"}
        </button>
      </div>

      {/* 상태 요약 탭 */}
      <div className="flex gap-2 mb-6">
        {STATUSES.map((s) => {
          const count = s === "전체" ? records.length : statusCounts.find((c) => c.status === s)?.count ?? 0;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s} <span className={active ? "text-blue-100" : "text-slate-400"}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="공동훈련센터명 검색"
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={bizFilter} onChange={(e) => setBizFilter(e.target.value)} className="select">
          <option value="전체">전체 사업유형</option>
          {BIZ_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        {(search || bizFilter !== "전체" || statusFilter !== "전체") && (
          <button onClick={() => { setSearch(""); setBizFilter("전체"); setStatusFilter("전체"); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <X size={14} /> 초기화
          </button>
        )}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="th cursor-pointer" onClick={() => handleSort("centerName")}>공동훈련센터명<SortIcon col="centerName" /></th>
              <th className="th cursor-pointer" onClick={() => handleSort("bizType")}>사업유형<SortIcon col="bizType" /></th>
              <th className="th text-right cursor-pointer" onClick={() => handleSort("target")}>목표<SortIcon col="target" /></th>
              <th className="th text-right cursor-pointer" onClick={() => handleSort("actual")}>실적<SortIcon col="actual" /></th>
              <th className="th">달성 현황</th>
              <th className="th text-right cursor-pointer" onClick={() => handleSort("rate")}>달성율<SortIcon col="rate" /></th>
              <th className="th">상태</th>
              <th className="th">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((r) => {
              const rate = getRate(r);
              const status = getStatus(r);
              const pct = rate !== null ? Math.min(rate, 1.5) * 100 / 1.5 : 0;
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="td font-medium text-slate-700">{r.centerName}</td>
                  <td className="td text-slate-600">{r.bizType}</td>
                  <td className="td text-right text-slate-600">{r.target.toLocaleString()}</td>
                  <td className="td text-right text-slate-600">{r.actual !== null ? r.actual.toLocaleString() : <span className="text-slate-300">-</span>}</td>
                  <td className="td">
                    <div className="w-24 bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${STATUS_BAR[status]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                  <td className="td text-right font-semibold text-slate-700">
                    {rate !== null ? `${Math.round(rate * 1000) / 10}%` : <span className="text-slate-300 font-normal">-</span>}
                  </td>
                  <td className="td">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[status]}`}>{status}</span>
                  </td>
                  <td className="td text-slate-400 text-xs max-w-[220px] truncate">{r.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .select { padding: 0.5rem 0.625rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; outline: none; }
        .select:focus { box-shadow: 0 0 0 2px #3b82f6; }
        .th { text-align: left; padding: 0.625rem 1rem; font-size: 0.75rem; font-weight: 600; color: #64748b; user-select: none; }
        .td { padding: 0.625rem 1rem; white-space: nowrap; }
      `}</style>
    </div>
  );
}
