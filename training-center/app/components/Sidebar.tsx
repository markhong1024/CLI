"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, BarChart2, AlertCircle, ChevronRight, Cloud, HardDrive } from "lucide-react";
import { useCenters } from "../context/CentersContext";

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/centers", label: "기관 현황", icon: Building2 },
  { href: "/scores", label: "성과평가 현황", icon: BarChart2 },
  { href: "/notices", label: "특이사항 관리", icon: AlertCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { syncing } = useCenters();
  const isCloud = !!process.env.NEXT_PUBLIC_FIREBASE_DB_URL;

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
      <div className="px-6 py-4 space-y-1">
        <div className="flex items-center gap-1.5 text-xs">
          {syncing ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /><span className="text-amber-400">동기화 중...</span></>
          ) : isCloud ? (
            <><Cloud size={12} className="text-emerald-400" /><span className="text-emerald-400">클라우드 연결됨</span></>
          ) : (
            <><HardDrive size={12} className="text-slate-500" /><span className="text-slate-500">로컬 저장</span></>
          )}
        </div>
        <p className="text-xs text-slate-500">v2.0 · 실데이터 반영</p>
      </div>
    </aside>
  );
}
