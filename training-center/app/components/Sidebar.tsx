"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, BarChart2, AlertCircle,
  ChevronRight, Cloud, HardDrive, CloudOff, RefreshCw, Settings, X,
} from "lucide-react";
import { useCenters } from "../context/CentersContext";

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/centers", label: "기관 현황", icon: Building2 },
  { href: "/scores", label: "성과평가 현황", icon: BarChart2 },
  { href: "/notices", label: "특이사항 관리", icon: AlertCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { syncing, cloudStatus, manualSync, saveSettings, supabaseUrl, supabaseKey } = useCenters();
  const [showSettings, setShowSettings] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [inputKey, setInputKey] = useState("");

  function openSettings() {
    setInputUrl(supabaseUrl);
    setInputKey(supabaseKey);
    setShowSettings(true);
  }

  function applySettings() {
    saveSettings(inputUrl, inputKey);
    setShowSettings(false);
  }

  const statusConfig = {
    connected: { icon: <Cloud size={12} />, text: "클라우드 연결됨", color: "text-emerald-400" },
    local:     { icon: <HardDrive size={12} />, text: "로컬 저장 (미연결)", color: "text-slate-500" },
    loading:   { icon: <RefreshCw size={12} className="animate-spin" />, text: "동기화 중...", color: "text-amber-400" },
    error:     { icon: <CloudOff size={12} />, text: "클라우드 오류", color: "text-red-400" },
  }[cloudStatus];

  return (
    <>
      <aside className="w-60 bg-slate-900 text-white flex flex-col min-h-screen shrink-0">
        <div className="px-6 py-5 border-b border-slate-700">
          <p className="text-xs text-slate-400 mb-0.5">고용노동부 · 일학습병행</p>
          <h1 className="text-sm font-bold leading-tight">공동훈련센터<br />현황관리 시스템</h1>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  active
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-b border-slate-700 text-xs text-slate-400">
          <p className="font-medium text-slate-300 mb-1">기준일</p>
          <p>2026. 06. 08. 현재</p>
        </div>
        <div className="px-6 py-4 space-y-2">
          <div className={`flex items-center gap-1.5 text-xs ${statusConfig.color}`}>
            {statusConfig.icon}
            <span>{statusConfig.text}</span>
          </div>
          {(cloudStatus === "error" || cloudStatus === "local") && (
            <button
              onClick={manualSync}
              disabled={syncing}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-40"
            >
              <RefreshCw size={11} className={syncing ? "animate-spin" : ""} />
              클라우드에 업로드
            </button>
          )}
          <button
            onClick={openSettings}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Settings size={11} />
            클라우드 설정
          </button>
          <p className="text-xs text-slate-600">v2.0 · 실데이터 반영</p>
        </div>
      </aside>

      {/* Supabase 설정 모달 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">클라우드 동기화 설정</h3>
                <p className="text-xs text-slate-400 mt-0.5">Supabase 연결 정보를 입력하세요</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                Supabase 프로젝트의 Settings → API 에서 URL과 anon key를 복사하세요.
                한 번 입력하면 이 브라우저에 저장되어 자동으로 연결됩니다.
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Project URL</label>
                <input
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">anon public key</label>
                <input
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              {inputUrl && (
                <p className="text-xs text-slate-400">
                  저장 후 즉시 연결을 시도합니다. 다른 PC에서도 동일하게 입력하면 데이터가 공유됩니다.
                </p>
              )}
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={applySettings}
                disabled={!inputUrl || !inputKey}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                저장 및 연결
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
