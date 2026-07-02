"use client";

import { useCenters } from "./context/CentersContext";
import { Building2, Users, BarChart2, AlertCircle } from "lucide-react";
import { getRecentYears, YEAR_KEY } from "./utils/years";

const REGIONS = ["수도강원", "충청전라", "경상"];
const BIZ_TYPES = ["재직자", "P-TECH", "4년제", "전문대", "특화대학", "대학원", "경력개발", "첨단산업", "구직자", "외국인"];
const SCORE_GRADES = ["S", "A", "B", "C", "D"];
const SCORE_COLORS: Record<string, string> = {
  S: "bg-violet-100 text-violet-700",
  A: "bg-blue-100 text-blue-700",
  B: "bg-emerald-100 text-emerald-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-red-100 text-red-700",
};
const SCORE_BAR_COLORS: Record<string, string> = {
  S: "bg-violet-500", A: "bg-blue-500", B: "bg-emerald-500", C: "bg-amber-500", D: "bg-red-500",
};

export default function Dashboard() {
  const { centers } = useCenters();
  const total = centers.length;
  const withNotes = centers.filter((c) => c.note).length;
  const managers = Array.from(new Set(centers.map((c) => c.manager))).length;

  const regionCounts = REGIONS.map((r) => ({
    name: r,
    count: centers.filter((c) => c.region === r).length,
  }));

  const bizCounts = BIZ_TYPES.map((type) => {
    const key = type === "재직자" ? "jikja" : type === "P-TECH" ? "ptech" : type === "4년제" ? "yr4"
      : type === "전문대" ? "college" : type === "특화대학" ? "specialized" : type === "대학원" ? "graduate"
      : type === "경력개발" ? "career" : type === "첨단산업" ? "hitech"
      : type === "구직자" ? "jobseeker" : "foreign";
    return { name: type, count: centers.filter((c) => c[key as keyof typeof c]).length };
  }).filter((b) => b.count > 0);

  // 최근 2개 연도 성과등급 분포
  const recentYears = getRecentYears(centers, 3);
  const scoreDists = recentYears.map((year) => {
    const key = YEAR_KEY[year];
    const dist = SCORE_GRADES.map((g) => ({ grade: g, count: centers.filter((c) => c[key] === g).length }));
    const total = dist.reduce((s, d) => s + d.count, 0);
    return { year, dist, total };
  });

  const recentNotes = centers.filter((c) => c.note).slice(0, 6);

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">현황 대시보드</h2>
        <p className="text-slate-500 mt-1 text-sm">2026년 공동훈련센터 기관현황 · 2026.06.08. 기준</p>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard title="총 공동훈련센터" value={total} sub="전국 기준" icon={<Building2 size={22} />} color="blue" />
        <StatCard title="담당 컨설턴트" value={managers} sub={`명`} icon={<Users size={22} />} color="violet" />
        <StatCard title="특이사항 기관" value={withNotes} sub={`${total}개 중`} icon={<AlertCircle size={22} />} color="amber" />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* 지역별 현황 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-blue-500" /> 지역별 기관 현황
          </h3>
          <div className="space-y-3">
            {regionCounts.map(({ name, count }) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{name}</span>
                  <span className="text-slate-500">{count}개소</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사업유형별 현황 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-violet-500" /> 참여 사업유형 현황
          </h3>
          <div className="space-y-2">
            {bizCounts.sort((a, b) => b.count - a.count).map(({ name, count }) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-slate-700 font-medium w-10 text-right">{count}개</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 2개 연도 성과등급 분포 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-emerald-500" /> 연도별 성과평가 분포
          </h3>
          {scoreDists.length === 0 ? (
            <p className="text-sm text-slate-400">등록된 성과평가 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-5">
              {scoreDists.map(({ year, dist, total: t }) => (
                <div key={year}>
                  <p className="text-xs font-semibold text-slate-500 mb-2">{year}년도 <span className="font-normal text-slate-400">(평가 {t}개)</span></p>
                  <div className="space-y-1.5">
                    {dist.map(({ grade, count }) => (
                      <div key={grade} className="flex items-center gap-2 text-sm">
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${SCORE_COLORS[grade]}`}>{grade}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${SCORE_BAR_COLORS[grade]}`}
                            style={{ width: t > 0 ? `${(count / t) * 100}%` : "0%" }} />
                        </div>
                        <span className="text-slate-500 w-16 text-right text-xs">{count}개 ({t > 0 ? Math.round((count / t) * 100) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 특이사항 기관 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-500" /> 주요 특이사항 기관 (최근 {recentNotes.length}개)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {recentNotes.map((c) => (
            <div key={c.id} className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="shrink-0 w-6 h-6 rounded bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">{c.id}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                <p className="text-xs text-slate-500 truncate">{c.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }: {
  title: string; value: string | number; sub: string; icon: React.ReactNode;
  color: "blue" | "violet" | "emerald" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
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
