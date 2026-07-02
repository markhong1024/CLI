"use client";

import { useState } from "react";
import { Center } from "../data/mock";
import { useCenters } from "../context/CentersContext";
import { downloadCentersExcel } from "../utils/excel";
import { Search, X, ChevronDown, ChevronUp, Download, Pencil, RotateCcw } from "lucide-react";
import { getRecentYears, YEAR_KEY } from "../utils/years";

const SCORE_COLORS: Record<string, string> = {
  S: "bg-violet-100 text-violet-700",
  A: "bg-blue-100 text-blue-700",
  B: "bg-emerald-100 text-emerald-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-red-100 text-red-700",
};

const BIZ_TYPE_LABELS: { key: keyof Center; label: string }[] = [
  { key: "jikja", label: "재직자" },
  { key: "ptech", label: "P-TECH" },
  { key: "yr4", label: "4년제" },
  { key: "college", label: "전문대" },
  { key: "specialized", label: "특화대학" },
  { key: "graduate", label: "대학원" },
  { key: "career", label: "경력개발" },
  { key: "hitech", label: "첨단산업" },
  { key: "jobseeker", label: "구직자" },
  { key: "foreign", label: "외국인" },
];

const GRADES = ["", "S", "A", "B", "C", "D", "신규", "미운영", "포기", "지정취소", "평가유예"];

const allManagers = (centers: Center[]) =>
  ["전체", ...Array.from(new Set(centers.map((c) => c.manager))).sort((a, b) => a.localeCompare(b, "ko"))];

export default function CentersPage() {
  const { centers, updateCenter, resetAll } = useCenters();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("전체");
  const [bizFilter, setBizFilter] = useState("전체");
  const [managerFilter, setManagerFilter] = useState("전체");
  const [selected, setSelected] = useState<Center | null>(null);
  const [editing, setEditing] = useState<Center | null>(null);
  const recentYears = getRecentYears(centers, 2);
  const [sortCol, setSortCol] = useState<"id" | "name" | "region" | "manager" | "s24">("id");
  const [sortAsc, setSortAsc] = useState(true);

  const bizTypes = ["전체", "재직자", "P-TECH", "4년제", "전문대", "특화대학", "대학원", "경력개발", "첨단산업", "구직자", "외국인"];

  const filtered = centers.filter((c) => {
    const matchSearch = c.name.includes(search) || c.manager.includes(search) || c.note.includes(search);
    const matchRegion = regionFilter === "전체" || c.region === regionFilter;
    const matchBiz = bizFilter === "전체" || (
      bizFilter === "재직자" ? c.jikja : bizFilter === "P-TECH" ? c.ptech :
      bizFilter === "4년제" ? c.yr4 : bizFilter === "전문대" ? c.college :
      bizFilter === "특화대학" ? c.specialized : bizFilter === "대학원" ? c.graduate :
      bizFilter === "경력개발" ? c.career : bizFilter === "첨단산업" ? c.hitech :
      bizFilter === "구직자" ? c.jobseeker : bizFilter === "외국인" ? c.foreign : true
    );
    const matchManager = managerFilter === "전체" || c.manager === managerFilter;
    return matchSearch && matchRegion && matchBiz && matchManager;
  }).sort((a, b) => {
    const va = a[sortCol] as string ?? "";
    const vb = b[sortCol] as string ?? "";
    const cmp = sortCol === "id" ? Number(va) - Number(vb) : va.localeCompare(vb, "ko");
    return sortAsc ? cmp : -cmp;
  });

  function handleSort(col: typeof sortCol) {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  }

  function SortIcon({ col }: { col: typeof sortCol }) {
    if (sortCol !== col) return <ChevronDown size={11} className="inline ml-0.5 text-slate-300" />;
    return sortAsc ? <ChevronUp size={11} className="inline ml-0.5" /> : <ChevronDown size={11} className="inline ml-0.5" />;
  }

  function openEdit(c: Center, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing({ ...c });
  }

  function saveEdit() {
    if (!editing) return;
    // typeCount 자동 계산
    const typeCount = ["jikja", "ptech", "yr4", "college", "specialized", "graduate", "career", "hitech", "jobseeker", "foreign"]
      .filter((k) => editing[k as keyof Center]).length;
    updateCenter(editing.id, { ...editing, typeCount });
    setEditing(null);
    setSelected(null);
  }

  function editField<K extends keyof Center>(key: K, value: Center[K]) {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">기관 현황</h2>
          <p className="text-slate-500 text-sm mt-1">총 {centers.length}개 공동훈련센터 · {filtered.length}개 표시 중</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { if (confirm("모든 데이터를 원본으로 초기화하시겠습니까?")) resetAll(); }}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm hover:bg-slate-50"
          >
            <RotateCcw size={14} /> 초기화
          </button>
          <button
            onClick={() => downloadCentersExcel(filtered)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <Download size={15} /> 엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="기관명, 담당자, 특이사항 검색"
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="select">
          {["전체", "수도강원", "충청전라", "경상"].map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={bizFilter} onChange={(e) => setBizFilter(e.target.value)} className="select">
          {bizTypes.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)} className="select">
          {allManagers(centers).map((m) => <option key={m}>{m}</option>)}
        </select>
        {(search || regionFilter !== "전체" || bizFilter !== "전체" || managerFilter !== "전체") && (
          <button onClick={() => { setSearch(""); setRegionFilter("전체"); setBizFilter("전체"); setManagerFilter("전체"); }}
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
              <Th onClick={() => handleSort("id")} label={<>연번<SortIcon col="id" /></>} />
              <Th onClick={() => handleSort("region")} label={<>지역<SortIcon col="region" /></>} />
              <Th onClick={() => handleSort("name")} label={<>공동훈련센터명<SortIcon col="name" /></>} />
              <Th onClick={() => handleSort("manager")} label={<>담당자<SortIcon col="manager" /></>} />
              <th className="th">사업유형</th>
              <th className="th">기수</th>
              {recentYears.map((y) => (
                <Th key={y} onClick={() => handleSort("s24")} label={<>{y.slice(2)}년 등급<SortIcon col="s24" /></>} />
              ))}
              <th className="th">특이사항</th>
              <th className="th">편집</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                <td className="td text-slate-400 font-mono text-xs">{c.id}</td>
                <td className="td">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.region === "수도강원" ? "bg-blue-50 text-blue-700" :
                    c.region === "충청전라" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                  }`}>{c.region}</span>
                </td>
                <td className="td font-medium text-slate-800">{c.name}</td>
                <td className="td text-slate-600">{c.manager}</td>
                <td className="td">
                  <div className="flex flex-wrap gap-1">
                    {BIZ_TYPE_LABELS.filter(({ key }) => c[key]).map(({ key, label }) => (
                      <span key={key} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{label}</span>
                    ))}
                  </div>
                </td>
                <td className="td text-slate-500 text-xs">{c.generation}</td>
                {recentYears.map((y) => {
                  const grade = c[YEAR_KEY[y]];
                  return (
                    <td key={y} className="td">
                      {grade ? <span className={`px-2 py-0.5 rounded text-xs font-bold ${SCORE_COLORS[grade] ?? "bg-slate-100 text-slate-500"}`}>{grade}</span>
                        : <span className="text-slate-300 text-xs">-</span>}
                    </td>
                  );
                })}
                <td className="td max-w-[180px]">
                  {c.note && <p className="text-xs text-amber-700 truncate">{c.note}</p>}
                </td>
                <td className="td">
                  <button onClick={(e) => openEdit(c, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-12 text-slate-400">검색 결과가 없습니다.</p>}
      </div>

      {/* 상세 모달 */}
      {selected && !editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selected.region === "수도강원" ? "bg-blue-50 text-blue-700" :
                      selected.region === "충청전라" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                    }`}>{selected.region}</span>
                    <span className="text-xs text-slate-400">연번 {selected.id}</span>
                    {selected.generation && <span className="text-xs text-slate-400">{selected.generation}</span>}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{selected.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">담당: {selected.manager}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => openEdit(selected, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    <Pencil size={13} /> 편집
                  </button>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">참여 사업유형</p>
                <div className="flex flex-wrap gap-2">
                  {BIZ_TYPE_LABELS.filter(({ key }) => selected[key]).map(({ key, label }) => (
                    <span key={key} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">{label}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">성과평가 이력</p>
                <div className="flex gap-3">
                  {recentYears.map((year) => {
                    const grade = selected[YEAR_KEY[year]];
                    return (
                      <div key={year} className="flex-1 text-center">
                        <p className="text-xs text-slate-400 mb-1">{year}</p>
                        <span className={`inline-flex w-9 h-9 rounded-xl items-center justify-center text-sm font-bold ${
                          grade ? (SCORE_COLORS[grade] ?? "bg-slate-100 text-slate-500") : "bg-slate-50 text-slate-300"
                        }`}>{grade || "-"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {selected.note && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">특이사항</p>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800">{selected.note}</div>
                </div>
              )}
              {selected.note2 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">비고</p>
                  <p className="text-sm text-slate-600">{selected.note2}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 편집 모달 */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{editing.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">연번 {editing.id} · {editing.region}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* 기본정보 */}
              <Section title="기본 정보">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="담당자">
                    <input value={editing.manager} onChange={(e) => editField("manager", e.target.value)} className="input" />
                  </Field>
                  <Field label="기수">
                    <input value={editing.generation} onChange={(e) => editField("generation", e.target.value)} className="input" placeholder="예: 1기" />
                  </Field>
                </div>
              </Section>

              {/* 사업유형 */}
              <Section title="참여 사업유형">
                <div className="flex flex-wrap gap-2">
                  {BIZ_TYPE_LABELS.map(({ key, label }) => (
                    <label key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                      editing[key] ? "border-blue-400 bg-blue-50 text-blue-700 font-medium" : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}>
                      <input type="checkbox" checked={!!editing[key]} onChange={(e) => editField(key as keyof Center, e.target.checked as never)} className="hidden" />
                      {label}
                    </label>
                  ))}
                </div>
              </Section>

              {/* 성과평가 */}
              <Section title="성과평가 등급">
                <div className="grid grid-cols-4 gap-2">
                  {(["s20","s21","s22","s23","s24","s25","s26","s27","s28","s29","s30","s31","s32","s33","s34","s35"] as const).map((key, i) => (
                    <Field key={key} label={`${2020 + i}년`}>
                      <select value={editing[key] ?? ""} onChange={(e) => editField(key as keyof Center, e.target.value as never)} className="input">
                        {GRADES.map((g) => <option key={g} value={g}>{g || "-"}</option>)}
                      </select>
                    </Field>
                  ))}
                </div>
              </Section>

              {/* 특이사항 */}
              <Section title="특이사항 / 비고">
                <Field label="특이사항">
                  <textarea value={editing.note} onChange={(e) => editField("note", e.target.value)} className="input resize-none" rows={3} placeholder="특이사항 입력" />
                </Field>
                <Field label="비고">
                  <textarea value={editing.note2} onChange={(e) => editField("note2", e.target.value)} className="input resize-none" rows={2} placeholder="비고 입력" />
                </Field>
              </Section>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">취소</button>
              <button onClick={saveEdit} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">저장</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .select { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; outline: none; }
        .select:focus { box-shadow: 0 0 0 2px #3b82f6; }
        .th { text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .td { padding: 0.75rem 1rem; }
        .input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.875rem; outline: none; }
        .input:focus { box-shadow: 0 0 0 2px #3b82f6; }
      `}</style>
    </div>
  );
}

function Th({ onClick, label }: { onClick: () => void; label: React.ReactNode }) {
  return (
    <th onClick={onClick} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">{label}</th>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
