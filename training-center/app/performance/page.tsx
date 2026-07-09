"use client";

import Link from "next/link";
import { usePerformance } from "../context/PerformanceContext";
import { downloadPerformanceExcel } from "../utils/excel";
import { BIZ_TYPES, getRate, getStatus } from "../utils/performance";
import { Download, Target, TrendingUp, TrendingDown, FileQuestion, Users, ArrowRight } from "lucide-react";

export default function PerformanceOverviewPage() {
  const { records, syncing } = usePerformance();

  const totalTarget = records.reduce((s, r) => s + r.target, 0);
  const totalActual = records.reduce((s, r) => s + (r.actual ?? 0), 0);
  const overallRate = totalTarget > 0 ? totalActual / totalTarget : 0;

  const overCount = records.filter((r) => getStatus(r) === "초과").length;
  const underCount = records.filter((r) => getStatus(r) === "미달").length;
  const unreportedCount = records.filter((r) => getStatus(r) === "미보고").length;

  const bizStats = BIZ_TYPES.map((type) => {
    const rows = records.filter((r) => r.bizType === type);
    const target = rows.reduce((s, r) => s + r.target, 0);
    const actual = rows.reduce((s, r) => s + (r.actual ?? 0), 0);
    const rate = target > 0 ? actual / target : 0;
    return { type, target, actual, rate, count: rows.length };
  }).filter((b) => b.count > 0);

  const maxTarget = Math.max(...bizStats.map((b) => Math.max(b.target, b.actual)), 1);

  const worst = [...records]
    .filter((r) => getRate(r) !== null)
    .sort((a, b) => getRate(a)! - getRate(b)!)
    .slice(0, 5);

  const best = [...records]
    .filter((r) => getRate(r) !== null)
    .sort((a, b) => getRate(b)! - getRate(a)!)
    .slice(0, 5);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">실적 총괄현황</h2>
          <p className="text-slate-500 text-sm mt-1">2026년 사업유형별 학습근로자 목표 대비 실적 · {records.length}건</p>
        </div>
        <button
          onClick={() => downloadPerformanceExcel(records)}
          disabled={syncing}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={15} /> {syncing ? "로딩 중..." : "엑셀 다운로드"}
        </button>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <StatCard title="총 학습근로자 목표" value={totalTarget.toLocaleString()} sub="명" icon={<Target size={22} />} color="blue" />
        <StatCard title="총 학습근로자 실적" value={totalActual.toLocaleString()} sub="명" icon={<Users size={22} />} color="violet" />
        <StatCard title="전체 달성율" value={`${Math.round(overallRate * 1000) / 10}%`} sub={`목표 ${totalTarget.toLocaleString()}명 중`} icon={<TrendingUp size={22} />} color="emerald" />
      </div>
      <div className="grid grid-cols-3 gap-5 mb-8">
        <StatCard title="목표 초과 달성" value={overCount} sub={`${records.length}건 중`} icon={<TrendingUp size={22} />} color="emerald" />
        <StatCard title="목표 미달" value={underCount} sub={`${records.length}건 중`} icon={<TrendingDown size={22} />} color="red" />
        <StatCard title="실적 미보고" value={unreportedCount} sub="집계 대기" icon={<FileQuestion size={22} />} color="amber" />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* 사업유형별 목표/실적 */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Target size={16} className="text-blue-500" /> 사업유형별 목표 대비 실적
          </h3>
          <div className="space-y-4">
            {bizStats.map(({ type, target, actual, rate, count }) => (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{type} <span className="text-slate-400 font-normal">({count}개 유형)</span></span>
                  <span className={`font-semibold ${rate >= 1 ? "text-emerald-600" : "text-red-500"}`}>
                    {actual.toLocaleString()} / {target.toLocaleString()}명 ({Math.round(rate * 1000) / 10}%)
                  </span>
                </div>
                <div className="relative w-full bg-slate-100 rounded-full h-2.5">
                  <div className="absolute inset-y-0 left-0 bg-slate-300 rounded-full" style={{ width: `${(target / maxTarget) * 100}%` }} />
                  <div className={`absolute inset-y-0 left-0 rounded-full ${rate >= 1 ? "bg-emerald-500" : "bg-blue-500"}`}
                    style={{ width: `${(Math.min(actual, maxTarget) / maxTarget) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full bg-slate-300 inline-block" /> 목표</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full bg-blue-500 inline-block" /> 실적(미달)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full bg-emerald-500 inline-block" /> 실적(초과)</span>
          </div>
        </div>

        {/* 바로가기 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col">
          <h3 className="font-semibold text-slate-700 mb-4">초과/미달 상세 확인</h3>
          <p className="text-sm text-slate-500 mb-4 flex-1">
            기관별·사업유형별 목표 대비 실적 초과/미달 현황을 검색·필터링하여 확인할 수 있습니다.
          </p>
          <Link href="/performance/status"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            초과/미달 현황 보기 <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 실적 미달 상위 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingDown size={16} className="text-red-500" /> 달성율 최저 기관 (Top 5)
          </h3>
          <div className="space-y-2">
            {worst.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm p-2.5 bg-red-50 rounded-lg border border-red-100">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{r.centerName}</p>
                  <p className="text-xs text-slate-500">{r.bizType} · 목표 {r.target} / 실적 {r.actual}</p>
                </div>
                <span className="font-bold text-red-600 shrink-0 ml-2">{Math.round(getRate(r)! * 1000) / 10}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 실적 초과 상위 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" /> 달성율 최고 기관 (Top 5)
          </h3>
          <div className="space-y-2">
            {best.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{r.centerName}</p>
                  <p className="text-xs text-slate-500">{r.bizType} · 목표 {r.target} / 실적 {r.actual}</p>
                </div>
                <span className="font-bold text-emerald-600 shrink-0 ml-2">{Math.round(getRate(r)! * 1000) / 10}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }: {
  title: string; value: string | number; sub: string; icon: React.ReactNode;
  color: "blue" | "violet" | "emerald" | "amber" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500">{title}</p>
        <span className={`p-2 rounded-lg ${colors[color]}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}
