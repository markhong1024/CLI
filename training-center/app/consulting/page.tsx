"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2, Calendar } from "lucide-react";
import { useCenters } from "../context/CentersContext";
import { useSchedule, ConsultingEvent } from "../context/ScheduleContext";

const STATUS_CONFIG = {
  예정: { chip: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400", bar: "border-l-blue-400" },
  확정: { chip: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", bar: "border-l-emerald-400" },
  완료: { chip: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-300", bar: "border-l-slate-300" },
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
  centerId: "",
  centerName: "",
  date: "",
  type: "정기",
  purpose: "",
  status: "예정",
  note: "",
};

export default function ConsultingPage() {
  const { centers } = useCenters();
  const { events, addEvent, updateEvent, deleteEvent } = useSchedule();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<ConsultingEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // 달력 계산
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();

  // 현재 월 이벤트
  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthEvents = useMemo(() => events.filter((e) => e.date.startsWith(monthStr)), [events, monthStr]);
  const eventsByDate = useMemo(() => {
    const map: Record<string, ConsultingEvent[]> = {};
    monthEvents.forEach((e) => { (map[e.date] ??= []).push(e); });
    return map;
  }, [monthEvents]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }
  function goToday() { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }

  function openAdd(date?: string) {
    setForm({ ...EMPTY_FORM, date: date ?? "" });
    setEditing(null);
    setShowModal(true);
  }
  function openEdit(ev: ConsultingEvent) {
    setForm({ centerId: ev.centerId, centerName: ev.centerName, date: ev.date, type: ev.type ?? "정기", purpose: ev.purpose, status: ev.status, note: ev.note });
    setEditing(ev);
    setShowModal(true);
  }
  function handleCenterChange(id: string) {
    const c = centers.find((c) => c.id === id);
    setForm((f) => ({ ...f, centerId: id, centerName: c?.name ?? "" }));
  }
  function saveForm() {
    if (!form.centerId || !form.date || !form.purpose.trim()) return;
    if (editing) updateEvent(editing.id, form);
    else addEvent(form);
    setShowModal(false);
    setSelectedDate(form.date);
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // 달력 셀 배열
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">컨설팅 일정 관리</h2>
          <p className="text-slate-500 text-sm mt-1">
            이번 달 {monthEvents.length}건 · 전체 {events.length}건 등록됨
          </p>
        </div>
        <button onClick={() => openAdd()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={15} /> 일정 추가
        </button>
      </div>

      {/* 상태 범례 */}
      <div className="flex gap-5 mb-5">
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
        {/* 월 네비게이션 */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronLeft size={18} className="text-slate-500" />
          </button>
          <h3 className="text-lg font-bold text-slate-800 min-w-[120px] text-center">
            {viewYear}년 {viewMonth + 1}월
          </h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <ChevronRight size={18} className="text-slate-500" />
          </button>
          <button onClick={goToday} className="ml-2 px-3 py-1 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
            오늘
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`py-2.5 text-center text-xs font-semibold ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-500" : "text-slate-500"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return (
              <div key={`e-${idx}`} className={`min-h-[110px] border-slate-100 bg-slate-50/50 ${idx % 7 !== 6 ? "border-r" : ""} border-b`} />
            );
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvs = eventsByDate[dateStr] ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dow = (firstDow + day - 1) % 7;

            return (
              <div key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`min-h-[110px] border-slate-100 p-1.5 cursor-pointer transition-colors
                  ${idx % 7 !== 6 ? "border-r" : ""} border-b
                  ${isSelected ? "bg-blue-50" : "hover:bg-slate-50/80"}`}
              >
                {/* 날짜 숫자 + 추가 버튼 */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? "bg-blue-600 text-white" : dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-500" : "text-slate-600"}`}>
                    {day}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); openAdd(dateStr); }}
                    className="p-0.5 rounded hover:bg-blue-100 text-slate-300 hover:text-blue-600 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
                {/* 이벤트 칩 */}
                <div className="space-y-0.5">
                  {dayEvs.slice(0, 3).map((ev) => (
                    <div key={ev.id}
                      className={`px-1.5 py-0.5 rounded text-xs truncate border ${STATUS_CONFIG[ev.status].chip}`}>
                      <span className="opacity-60 mr-1">[{ev.type ?? "정기"}]</span>{ev.centerName}
                    </div>
                  ))}
                  {dayEvs.length > 3 && (
                    <p className="text-xs text-slate-400 px-1">+{dayEvs.length - 3}건 더</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 선택 날짜 상세 패널 */}
      {selectedDate && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              <h4 className="font-semibold text-slate-800">
                {selectedDate.replace(/-/g, ". ")}
              </h4>
              <span className="text-xs text-slate-400">{selectedEvents.length}건</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openAdd(selectedDate)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                <Plus size={12} /> 추가
              </button>
              <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
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
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        (ev.type ?? "정기") === "정기"
                          ? "bg-violet-50 text-violet-600 border-violet-200"
                          : "bg-orange-50 text-orange-600 border-orange-200"
                      }`}>{ev.type ?? "정기"}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1 whitespace-pre-wrap">{ev.purpose}</p>
                    {ev.note && <p className="text-xs text-slate-400">{ev.note}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(ev)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => { if (confirm("일정을 삭제하시겠습니까?")) deleteEvent(ev.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 추가 / 편집 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">{editing ? "일정 수정" : "일정 추가"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">컨설팅 일정 정보를 입력하세요</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* 센터 + 날짜 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">공동훈련센터 <span className="text-red-400">*</span></label>
                  <select value={form.centerId} onChange={(e) => handleCenterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">센터 선택</option>
                    {[...centers].sort((a, b) => a.name.localeCompare(b.name, "ko")).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">일정 날짜 <span className="text-red-400">*</span></label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* 컨설팅 구분 + 진행 상태 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">컨설팅 구분 <span className="text-red-400">*</span></label>
                  <div className="flex gap-2">
                    {(["정기", "수시"] as const).map((t) => (
                      <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          form.type === t
                            ? t === "정기"
                              ? "bg-violet-50 text-violet-700 border-violet-300 font-bold"
                              : "bg-orange-50 text-orange-700 border-orange-300 font-bold"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}>
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
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          form.status === s ? STATUS_CONFIG[s].chip + " font-bold" : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 컨설팅 목적 */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">컨설팅 목적 <span className="text-red-400">*</span></label>
                <textarea value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  rows={4} placeholder="컨설팅 목적 및 세부 내용을 입력하세요"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* 비고 */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">비고</label>
                <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="추가 메모 (선택사항)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                취소
              </button>
              <button onClick={saveForm} disabled={!form.centerId || !form.date || !form.purpose.trim()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
