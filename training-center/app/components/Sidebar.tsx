"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, BarChart2, AlertCircle, ChevronRight, Cloud, HardDrive, CloudOff, RefreshCw } from "lucide-react";
import { useCenters } from "../context/CentersContext";

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/centers", label: "기관 현황", icon: Building2 },
  { href: "/scores", label: "성과평가 현황", icon: BarChart2 },
  { href: "/notices", label: "특이사항 관리", icon: AlertCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { syncing, cloudStatus, manualSync } = useCenters();

  const statusConfig = {
    connected: { icon: <Cloud size={12} />, text: "클라우드 연결됨", color: "text-emerald-400" },
    local:     { icon: <HardDrive size={12} />, text: "로컬 저장 (미연결)", color: "text-slate-500" },
    loading:   { icon: <RefreshCw size={12} className="animate-spin" />, text: "동기화 중...", color: "text-amber-400" },
    error:     { icon: <CloudOff size={12} />, text: "클라우드 오류", color: "text-red-400" },
  }[cloudStatus];

  return (
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
        <p className="text-xs text-slate-500">v2.0 · 실데이터 반영</p>
      </div>
    </aside>
  );
}
