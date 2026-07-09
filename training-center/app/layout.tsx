import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { CentersProvider } from "./context/CentersContext";
import { PerformanceProvider } from "./context/PerformanceContext";

export const metadata: Metadata = {
  title: "공동훈련센터 현황관리 시스템",
  description: "공동훈련센터 운영 현황 통합 관리",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex bg-slate-50 min-h-screen">
        <CentersProvider>
          <PerformanceProvider>
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </PerformanceProvider>
        </CentersProvider>
      </body>
    </html>
  );
}
