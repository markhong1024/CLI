"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2, Calendar, Target, Settings2 } from "lucide-react";
import { useCenters } from "../context/CentersContext";
import { useSchedule, ConsultingEvent } from "../context/ScheduleContext";
import { touchLastModified } from "../utils/lastModified";

const STATUS_CONFIG = {
  예정: { chip: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400", bar: "border-l-blue-400", bar2: "bg-blue-400" },
  확정: { chip: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", bar: "border-l-emerald-400", bar2: "bg-emerald-400" },
  완료: { chip: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-300", bar: "border-l-slate-300", bar2: "bg-slate-400" },
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type FormState = {
  centerId: string;
  centerName: string;
  date: string;
  type: "정기" | "수시";
  purpose: string;
  status: "예정" | "확정" | "완료";
  note: string;
};

const EMPTY_FORM: FormState = {
  centerId: "", centerName: "", date: "", type: "정기", purpose: "", status: "예정", note: "",
};

type Goals = { total: number; jeonggi: number; susi: number };
const DEFAULT_GOALS: Goals = { total: 0, jeonggi: 0, susi: 0 };

function goalsKey(year: number) { return `tc-consulting-goals-${year}`; }
function loadGoals(year: number): Goals {
  try { const s = localStorage.getItem(goalsKey(year)); return s ? JSON.parse(s) : DEFAULT_GOALS; }
  catch { return DEFAULT_GOALS; }
}
function saveGoals(year: number, g: Goals) {
  localStorage.setItem(goalsKey(year), JSON.stringify(g));
  touchLastModified();
}

function pct(actual: number, goal: number) {
  if (!goal) return null;
  return Math.round((actual / goal) * 100);
}

function ProgressBar({ actual, goal, color }: { actual: number; goal: number; color: string }) {
  const p = goal > 0 ? Math.min((actual / goal) * 100, 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${p}%` }} />
    </div>
  );
}

export default function ConsultingPage() {
  const { centers } = useCenters();
  const { events, addEvent, updateEvent, deleteEvent } = useSchedule();

  const today = new Date();
  const thisYear = today.getFullYear();

  const [viewYear, setViewYear] = useState(thisYear);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<ConsultingEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [statPeriod, setStatPeriod] = useState<"전체" | "올해" | "이번달">("올해");

  // 목표 설정
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState<Goals>(DEFAULT_GOALS);

  useEffect(() => { setGoals(loadGoals(thisYear)); }, []);

  function openGoalModal() { setGoalForm({ ...goals }); setShowGoalModal(true); }
  function saveGoalForm() {
    const g: Goals = {
      total: Number(goalForm.total) || 0,
      jeonggi: Number(goalForm.jeonggi) || 0,
      susi: Number(goalForm.susi) || 0,
    };
    saveGoals(thisYear, g);
    setGoals(g);
    setShowGoalModal(false);
  }

  // 달력
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthEvents = useMemo(() => events.filter((e) => e.date.startsWith(monthStr)), [events, monthStr]);
  const eventsByDate = useMemo(() => {
    const map: Record<string, ConsultingEvent[]> = {};
    monthEvents.forEach((e) => { (map[e.date] ??= []).push(e); });
    return map;
  }, [monthEvents]);

  // 통계 필터
  const statEvents = useMemo(() => {
    const y = String(thisYear);
    const ym = `${y}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    if (statPeriod === "올해") return events.filter((e) => e.date.startsWith(y));
    if (statPeriod === "이번달") return events.filter((e) => e.date.startsWith(ym));
    return events;
  }, [events, statPeriod]);

  const statJeonggi = statEvents.filter((e) => (e.type ?? "정기") === "정기");
  const statSusi = statEvents.filter((e) => (e.type ?? "정기") === "수시");

  // 수시 목적별 그룹
  const susiByPurpose = useMemo(() => {
    const map: Record<string, ConsultingEvent[]> = {};
    statSusi.forEach((e) => { const k = e.purpose.trim() || "(목적 미입력)"; (map[k] ??= []).push(e); });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [statSusi]);

  const maxPurposeCount = susiByPurpose.length > 0 ? susiByPurpose[0][1].length : 1;

  // 달력 함수
  function prevMonth() { if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else setViewMonth((m) => m - 1); }
  function nextMonth() { if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else setViewMonth((m) => m + 1); }
  function goToday() { setViewYear(thisYear); setViewMonth(today.getMonth()); }

  function openAdd(date?: string) { setForm({ ...EMPTY_FORM, date: date ?? "" }); setEditing(null); setShowModal(true); }
  function openEdit(ev: ConsultingEvent) {
    setForm({ centerId: ev.centerId, centerName: ev.centerName, date: ev.date, type: ev.type ?? "정기", purpose: ev.purpose, status: ev.status, note: ev.note });
    setEditing(ev); setShowModal(true);
  }
  function handleCenterChange(id: string) {
    if (id === "__direct__") {
      setForm((f) => ({ ...f, centerId: "__direct__", centerName: "" }));
    } else {
      const c = centers.find((c) => c.id === id);
      setForm((f) => ({ ...f, centerId: id, centerName: c?.name ?? "" }));
    }
  }
  function saveForm() {
    if (!form.centerId || (form.centerId === "__direct__" && !form.centerName.trim()) || !form.date || !form.purpose.trim()) return;
    if (editing) updateEvent(editing.id, form); else addEvent(form);
    setShowModal(false); setSelectedDate(form.date);
  }

  const todayStr = `${thisYear}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">컨설팅 일정 관리</h2>
          <p className="text-slate-500 text-sm mt-1">이번 달 {monthEvents.length}건 · 전체 {events.length}건 등록됨</p>
        </div>
        <button onClick={() => openAdd()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={15} /> 일정 추가
        </button>
      </div>

      {/* ── 통계 섹션 ── */}
      <div className="mb-6 space-y-4">

        {/* 기간 탭 + 목표 설정 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {(["전체", "올해", "이번달"] as const).map((p) => (
              <button key={p} onClick={() => setStatPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statPeriod === p ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={openGoalModal}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Settings2 size={14} /> {thisYear}년 목표 설정
          </button>
        </div>

        {/* 목표 대비 실적 카드 3개 */}
        <div className="grid grid-cols-3 gap-4">
          {/* 총 컨설팅 */}
          {[
            { label: "총 컨설팅", actual: statEvents.length, goal: goals.total, evs: statEvents, accent: "text-slate-800", border: "border-slate-200", prog: "bg-slate-500" },
            { label: "정기 컨설팅", actual: statJeonggi.length, goal: goals.jeonggi, evs: statJeonggi, accent: "text-violet-700", border: "border-violet-200", prog: "bg-violet-500" },
            { label: "수시 컨설팅", actual: statSusi.length, goal: goals.susi, evs: statSusi, accent: "text-orange-600", border: "border-orange-200", prog: "bg-orange-500" },
          ].map(({ label, actual, goal, evs, accent, border, prog }) => {
            const p = pct(actual, goal);
            return (
              <div key={label} className={`bg-white rounded-xl border ${border} p-5`}>
                <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
                <div className="flex items-end gap-2 mb-1">
                  <span className={`text-3xl font-bold ${accent}`}>{actual}</span>
                  <span className="text-sm text-slate-400 mb-0.5">건</span>
                  {goal > 0 && (
                    <span className="text-sm text-slate-400 mb-0.5">/ 목표 {goal}건</span>
                  )}
                </div>
                {goal > 0 ? (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">달성률</span>
                      <span className={`font-bold ${p! >= 100 ? "text-emerald-600" : p! >= 70 ? "text-blue-600" : "text-amber-600"}`}>
                        {p}%
                      </span>
                    </div>
                    <ProgressBar actual={actual} goal={goal} color={prog} />
                  </div>
                ) : (
                  <div className="mb-3">
                    <p className="text-xs text-slate-300 italic">목표 미설정</p>
                    <ProgressBar actual={0} goal={1} color={prog} />
                  </div>
                )}
                <div className="space-y-1 pt-2 border-t border-slate-50">
                  {(["완료", "확정", "예정"] as const).map((s) => (
                    <div key={s} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                        <span className="text-slate-500">{s}</span>
                      </div>
                      <span className="font-semibold text-slate-700">{evs.filter((e) => e.status === s).length}건</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 수시 목적별 현황 + 가로 막대 그래프 */}
        {statSusi.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Target size={14} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-slate-700">수시 컨설팅 목적별 실적</h3>
              <span className="text-xs text-slate-400">총 {statSusi.length}건</span>
            </div>

            <div className="p-5 space-y-3">
              {susiByPurpose.map(([purpose, evs]) => {
                const done = evs.filter((e) => e.status === "완료").length;
                const confirmed = evs.filter((e) => e.status === "확정").length;
                const planned = evs.filter((e) => e.status === "예정").length;
                const total = evs.length;
                const barPct = (n: number) => `${(n / maxPurposeCount) * 100}%`;

                return (
                  <div key={purpose}>
                    <div className="flex items-start justify-between mb-1.5 gap-3">
                      <p className="text-sm text-slate-700 flex-1 leading-snug line-clamp-2">{purpose}</p>
                      <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                        <span className="font-bold text-slate-800">{total}건</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500">완료 {done}</span>
                        <span className="text-emerald-600">확정 {confirmed}</span>
                        <span className="text-blue-600">예정 {planned}</span>
                      </div>
                    </div>
                    {/* 스택 바 */}
                    <div className="flex h-5 rounded-lg overflow-hidden bg-slate-100 gap-px">
                      {done > 0 && (
                        <div className="bg-slate-400 flex items-center justify-center text-white text-xs font-bold transition-all"
                          style={{ width: barPct(done) }} title={`완료 ${done}건`}>
                          {done > 0 && done}
                        </div>
                      )}
                      {confirmed > 0 && (
                        <div className="bg-emerald-400 flex items-center justify-center text-white text-xs font-bold transition-all"
                          style={{ width: barPct(confirmed) }} title={`확정 ${confirmed}건`}>
                          {confirmed}
                        </div>
                      )}
                      {planned > 0 && (
                        <div className="bg-blue-400 flex items-center justify-center text-white text-xs font-bold transition-all"
                          style={{ width: barPct(planned) }} title={`예정 ${planned}건`}>
                          {planned}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 범례 */}
              <div className="flex gap-4 pt-2 border-t border-slate-100">
                {[
                  { label: "완료", color: "bg-slate-400" },
                  { label: "확정", color: "bg-emerald-400" },
                  { label: "예정", color: "bg-blue-400" },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`w-3 h-3 rounded-sm ${color}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 상태 범례 */}
      <div className="flex gap-5 mb-4">
        {(["예정", "확정", "완료"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
            <span>{s}</span>
            <span className="text-slate-400">({monthEvents.filter((e) => e.status === s).length})</span>
          </div>
        ))}
      </div>

      {/* 월력 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronLeft size={18} className="text-slate-500" />
          </button>
          <h3 className="text-lg font-bold text-slate-800 min-w-[120px] text-center">{viewYear}년 {viewMonth + 1}월</h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronRight size={18} className="text-slate-500" />
          </button>
          <button onClick={goToday} className="ml-2 px-3 py-1 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">오늘</button>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`py-2.5 text-center text-xs font-semibold ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-500" : "text-slate-500"}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className={`min-h-[110px] border-slate-100 bg-slate-50/50 ${idx % 7 !== 6 ? "border-r" : ""} border-b`} />;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvs = eventsByDate[dateStr] ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dow = (firstDow + day - 1) % 7;
            return (
              <div key={dateStr} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`min-h-[110px] border-slate-100 p-1.5 cursor-pointer transition-colors ${idx % 7 !== 6 ? "border-r" : ""} border-b ${isSelected ? "bg-blue-50" : "hover:bg-slate-50/80"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white" : dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-500" : "text-slate-600"}`}>{day}</span>
                  <button onClick={(e) => { e.stopPropagation(); openAdd(dateStr); }} className="p-0.5 rounded hover:bg-blue-100 text-slate-300 hover:text-blue-600 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {dayEvs.slice(0, 3).map((ev) => (
                    <div key={ev.id} className={`px-1.5 py-0.5 rounded text-xs truncate border ${STATUS_CONFIG[ev.status].chip}`}>
                      <span className="opacity-60 mr-1">[{ev.type ?? "정기"}]</span>{ev.centerName}
                    </div>
                  ))}
                  {dayEvs.length > 3 && <p className="text-xs text-slate-400 px-1">+{dayEvs.length - 3}건 더</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 선택 날짜 상세 */}
      {selectedDate && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              <h4 className="font-semibold text-slate-800">{selectedDate.replace(/-/g, ". ")}</h4>
              <span className="text-xs text-slate-400">{selectedEvents.length}건</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openAdd(selectedDate)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                <Plus size={12} /> 추가
              </button>
              <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">등록된 일정이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev) => (
                <div key={ev.id} className={`flex items-start gap-3 p-4 rounded-lg border border-l-4 border-slate-100 ${STATUS_CONFIG[ev.status].bar}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800">{ev.centerName}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${STATUS_CONFIG[ev.status].chip}`}>{ev.status}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${(ev.type ?? "정기") === "정기" ? "bg-violet-50 text-violet-600 border-violet-200" : "bg-orange-50 text-orange-600 border-orange-200"}`}>{ev.type ?? "정기"}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1 whitespace-pre-wrap">{ev.purpose}</p>
                    {ev.note && <p className="text-xs text-slate-400">{ev.note}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => { if (confirm("일정을 삭제하시겠습니까?")) deleteEvent(ev.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 일정 추가/편집 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">{editing ? "일정 수정" : "일정 추가"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">컨설팅 일정 정보를 입력하세요</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">공동훈련센터 <span className="text-red-400">*</span></label>
                  <select value={form.centerId} onChange={(e) => handleCenterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">센터 선택</option>
                    {[...centers].sort((a, b) => a.name.localeCompare(b.name, "ko")).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="__direct__">직접 입력 (기타)</option>
                  </select>
                  {form.centerId === "__direct__" && (
                    <input
                      type="text"
                      value={form.centerName}
                      onChange={(e) => setForm((f) => ({ ...f, centerName: e.target.value }))}
                      placeholder="센터명 직접 입력"
                      className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">일정 날짜 <span className="text-red-400">*</span></label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">컨설팅 구분 <span className="text-red-400">*</span></label>
                  <div className="flex gap-2">
                    {(["정기", "수시"] as const).map((t) => (
                      <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === t ? (t === "정기" ? "bg-violet-50 text-violet-700 border-violet-300 font-bold" : "bg-orange-50 text-orange-700 border-orange-300 font-bold") : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">진행 상태 <span className="text-red-400">*</span></label>
                  <div className="flex gap-2">
                    {(["예정", "확정", "완료"] as const).map((s) => (
                      <button key={s} onClick={() => setForm((f) => ({ ...f, status: s }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.status === s ? STATUS_CONFIG[s].chip + " font-bold" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">컨설팅 목적 <span className="text-red-400">*</span></label>
                <textarea value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  rows={4} placeholder="컨설팅 목적 및 세부 내용을 입력하세요"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">비고</label>
                <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="추가 메모 (선택사항)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">취소</button>
              <button onClick={saveForm} disabled={!form.centerId || !form.date || !form.purpose.trim()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 목표 설정 모달 */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowGoalModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">{thisYear}년 컨설팅 목표</h3>
                <p className="text-xs text-slate-400 mt-0.5">당해년도 컨설팅 목표 횟수를 입력하세요</p>
              </div>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: "total" as const, label: "총 목표", color: "focus:ring-slate-400" },
                { key: "jeonggi" as const, label: "정기 목표", color: "focus:ring-violet-400" },
                { key: "susi" as const, label: "수시 목표", color: "focus:ring-orange-400" },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} value={goalForm[key] || ""}
                      onChange={(e) => setGoalForm((g) => ({ ...g, [key]: Number(e.target.value) }))}
                      placeholder="0"
                      className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 ${color}`} />
                    <span className="text-sm text-slate-400 shrink-0">건</span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                목표를 0으로 설정하면 달성률이 표시되지 않습니다.
              </p>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowGoalModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">취소</button>
              <button onClick={saveGoalForm} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
