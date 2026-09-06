"use client";
import { useState } from "react";
import { FilterResult, Proposal, ThreatAssessment } from "@/lib/types";
import { won } from "@/lib/filter";

const VERDICT_KO: Record<FilterResult["verdict"], string> = {
  ALLOW: "허용 · 즉시 실행",
  PROJECT: "조정 · 최소 개입",
  HOLD: "보류 · 보호자 승인",
  BLOCK: "차단",
};

export default function VerdictCard({ proposal, threat, result, compact = false }: { proposal: Proposal; threat: ThreatAssessment; result: FilterResult; compact?: boolean }) {
  const [open, setOpen] = useState(!compact);
  const fmtH = (c: FilterResult["constraints"][number]) => {
    if (c.unit === "won") return `h = ${c.h >= 0 ? "+" : "−"}${Math.abs(c.h).toLocaleString()}원`;
    if (c.unit === "score") return `h = ${c.h >= 0 ? "+" : "−"}${Math.abs(c.h).toFixed(2)}`;
    return c.satisfied ? "충족" : "위반";
  };
  return (
    <div className="verdict">
      <div className="verdict-head">
        <span className={`badge ${result.verdict}`}>{result.verdict}</span>
        <span>{VERDICT_KO[result.verdict]}</span>
        <span className="spacer" />
        <button className="btn sm ghost" onClick={() => setOpen((o) => !o)}>
          {open ? "접기" : "판정 근거"}
        </button>
      </div>
      <div className="kv">
        <b>에이전트 제안</b>
        <span>
          {proposal.recipient} · {won(proposal.amount)} · {proposal.type === "transfer" ? "이체" : proposal.type === "payment" ? "결제" : proposal.type === "invest" ? "투자" : "해외송금"}
        </span>
        <b>위협 평가</b>
        <span>
          {threat.category} · 점수 <code>{threat.score.toFixed(2)}</code> <span className="muted small">({threat.source === "llm" ? "생성형 AI+규칙" : "규칙"})</span>
        </span>
        <b>필터 결과</b>
        <span>
          즉시 {won(result.immediateAmount)}
          {result.deferredAmount > 0 && ` · 지연이체 ${won(result.deferredAmount)}`}
          {result.approvalAmount > 0 && ` · 승인대기 ${won(result.approvalAmount)}`}
        </span>
      </div>
      <div className="compare">
        <div className="unsafe">
          필터 없는 에이전트라면
          <b>{won(result.unsafeAgentWouldExecute)} 실행</b>
        </div>
        <div className="safe">
          가드레일 적용 결과
          <b>{won(result.immediateAmount)} 실행</b>
        </div>
      </div>
      {open && (
        <>
          <div className="constraints">
            {result.constraints.map((c) => (
              <div key={c.key} className={`constraint ${c.satisfied ? "" : "bad"}`}>
                <span className="dot" />
                <span>
                  {c.label} <span className="muted">— {c.note}</span>
                </span>
                <span className="h">{fmtH(c)}</span>
              </div>
            ))}
          </div>
          {result.reasons.length > 0 && (
            <ul className="advice">
              {result.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
