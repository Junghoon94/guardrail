import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GuardrailProvider } from "@/lib/store";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "가드레일 — AI 금융 비서를 위한 안전필터",
  description: "AI 에이전트가 소비자 대신 돈을 움직이는 시대, 에이전트가 넘을 수 없는 울타리. 2026 금융 AI Challenge MVP",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <GuardrailProvider>
          <Nav />
          {children}
          <div className="footer">가드레일(GuardRail) MVP · 2026 금융 AI Challenge · 데모 데이터는 모두 합성 데이터이며 실제 금융거래가 발생하지 않습니다.</div>
        </GuardrailProvider>
      </body>
    </html>
  );
}
