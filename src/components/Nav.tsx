"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useGuardrail } from "@/lib/store";

const LINKS = [
  { href: "/", label: "소개" },
  { href: "/app", label: "어르신 앱" },
  { href: "/guardian", label: "보호자 대시보드" },
  { href: "/redteam", label: "레드팀 시험" },
  { href: "/about", label: "원리·정책 정합성" },
];

export default function Nav() {
  const path = usePathname();
  const { state, hydrated } = useGuardrail();
  const [provider, setProvider] = useState<string>("...");
  useEffect(() => {
    fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "status" }) })
      .then((r) => r.json())
      .then((j) => setProvider(j.provider))
      .catch(() => setProvider("none"));
  }, []);
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">▣</span> 가드레일
        </Link>
        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-right">
          {hydrated && state.killSwitch && <span className="pill danger">긴급 정지 중</span>}
          {hydrated && state.pending.length > 0 && <span className="pill warn">승인 대기 {state.pending.length}</span>}
          <span className={`pill ${provider === "none" ? "" : "info"}`} title="생성형 AI 연결 상태">
            AI: {provider === "none" ? "규칙 폴백" : provider}
          </span>
        </div>
      </div>
    </header>
  );
}
