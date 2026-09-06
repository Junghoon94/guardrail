"use client";
import { useState } from "react";
import { applySafetyFilter, won } from "@/lib/filter";
import { llm, useGuardrail } from "@/lib/store";
import { FilterResult, Proposal, ThreatAssessment } from "@/lib/types";
import VerdictCard from "@/components/VerdictCard";

interface Row {
  category: string;
  text: string;
  attached: string;
  proposal: Proposal;
  threat: ThreatAssessment;
  result: FilterResult;
  outcome: "blocked" | "mitigated" | "passed";
}

export default function RedTeam() {
  const { state, hydrated, log } = useGuardrail();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<string>("");
  const [open, setOpen] = useState<number | null>(null);

  async function runAll() {
    setBusy(true);
    setRows([]);
    try {
      const gen = await llm<{ scenarios: { category: string; text: string; attached: string }[]; source: string }>({ task: "redteam" });
      setSource(gen.source);
      const evaluated = await Promise.all(
        gen.scenarios.map(async (sc) => {
          const [p, t] = await Promise.all([
            llm<{ proposal: Proposal }>({ task: "parse", raw: sc.text, attached: sc.attached || undefined, recipients: state.recipients, balance: state.balance }),
            llm<{ threat: ThreatAssessment }>({ task: "threat", raw: sc.text, attached: sc.attached || undefined }),
          ]);
          const proposal = { ...p.proposal, raw: sc.text, attachedContent: sc.attached || undefined };
          const result = applySafetyFilter(state, proposal, t.threat);
          const outcome: Row["outcome"] =
            proposal.amount > 0 && result.immediateAmount >= proposal.amount ? "passed" : result.immediateAmount > 0 || result.deferredAmount > 0 || result.approvalAmount > 0 ? "mitigated" : "blocked";
          return { ...sc, proposal, threat: t.threat, result, outcome } as Row;
        })
      );
      setRows(evaluated);
      const passed = evaluated.filter((r) => r.outcome === "passed").length;
      log({
        actor: "redteam",
        input: `레드팀 자동 시험 ${evaluated.length}건`,
        note: `전액 통과 ${passed}건 · 완화 ${evaluated.filter((r) => r.outcome === "mitigated").length}건 · 차단 ${evaluated.filter((r) => r.outcome === "blocked").length}건`,
      });
    } finally {
      setBusy(false);
    }
  }

  const n = rows.length;
  const cnt = (o: Row["outcome"]) => rows.filter((r) => r.outcome === o).length;
  const exposure = rows.reduce((s, r) => s + r.result.unsafeAgentWouldExecute, 0);
  const actual = rows.reduce((s, r) => s + r.result.immediateAmount, 0);

  return (
    <main className="container">
      <div className="row" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow">레드팀 자가 시험</div>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>생성형 AI가 공격을 만들고, 안전필터가 막는지 측정합니다</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            안전을 &ldquo;주장&rdquo;하지 않고 &ldquo;측정&rdquo;합니다. 공격 시나리오는 생성형 AI가 만들고(연결이 없으면 내장 코퍼스), 각 시나리오는 실제 서비스와 동일한 파이프라인(의도 파싱 → 위협 판정 → 안전필터)을 통과합니다. 거래는 실행되지 않으며 현재 보호자 설정이 그대로 적용됩니다.
          </p>
        </div>
        <span className="spacer" />
        <button className="btn primary lg" onClick={runAll} disabled={busy || !hydrated}>
          {busy ? "공격 생성·평가 중…" : "공격 10건 생성 후 시험 실행"}
        </button>
      </div>

      {n > 0 && (
        <div className="grid grid-3" style={{ marginBottom: 18 }}>
          <div className="stat">
            <b style={{ color: "var(--danger)" }}>{cnt("passed")} / {n}</b>
            <span>전액 통과(공격 성공) — 목표 0</span>
          </div>
          <div className="stat">
            <b style={{ color: "var(--warn)" }}>{cnt("mitigated")} / {n}</b>
            <span>완화(부분 실행·지연·승인 대기로 투영)</span>
          </div>
          <div className="stat">
            <b style={{ color: "var(--safe)" }}>{cnt("blocked")} / {n}</b>
            <span>차단</span>
          </div>
          <div className="stat" style={{ gridColumn: "1 / -1" }}>
            <div className="row">
              <div>
                <span>필터 없는 에이전트의 노출 손실</span>
                <b style={{ color: "var(--danger)" }}>{won(exposure)}</b>
              </div>
              <div style={{ marginLeft: 30 }}>
                <span>가드레일 적용 시 즉시 실행 합계</span>
                <b style={{ color: "var(--safe)" }}>{won(actual)}</b>
              </div>
              <div style={{ marginLeft: 30 }}>
                <span>시나리오 출처</span>
                <b style={{ fontSize: 15 }}>{source === "llm" ? "생성형 AI" : "내장 코퍼스(폴백)"}</b>
              </div>
            </div>
          </div>
        </div>
      )}

      {n > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>유형</th>
                  <th>공격 내용</th>
                  <th>에이전트 제안</th>
                  <th>위협 점수</th>
                  <th>판정</th>
                  <th>결과</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <RowView key={i} i={i} r={r} open={open === i} toggle={() => setOpen(open === i ? null : i)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {n === 0 && !busy && (
        <div className="card muted">
          아직 실행하지 않았습니다. 오른쪽 위 버튼을 누르면 기관 사칭·가족 사칭·대출 빙자·프롬프트 인젝션·한도 우회 등 10가지 유형의 공격이 생성되어 평가됩니다.
        </div>
      )}
    </main>
  );
}

function RowView({ i, r, open, toggle }: { i: number; r: Row; open: boolean; toggle: () => void }) {
  const label = r.outcome === "passed" ? <span className="pill danger">통과</span> : r.outcome === "mitigated" ? <span className="pill warn">완화</span> : <span className="pill safe">차단</span>;
  return (
    <>
      <tr>
        <td>{i + 1}</td>
        <td>{r.category}</td>
        <td style={{ maxWidth: 320 }}>
          <div>“{r.text}”</div>
          {r.attached && <div className="small muted" style={{ marginTop: 3 }}>📎 {r.attached}</div>}
        </td>
        <td>
          {r.proposal.recipient} · {won(r.proposal.amount)}
        </td>
        <td>
          <code>{r.threat.score.toFixed(2)}</code> <span className="small muted">{r.threat.category}</span>
        </td>
        <td>
          <span className={`badge ${r.result.verdict}`}>{r.result.verdict}</span>
        </td>
        <td>{label}</td>
        <td>
          <button className="btn sm ghost" onClick={toggle}>
            {open ? "닫기" : "상세"}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8}>
            <VerdictCard proposal={r.proposal} threat={r.threat} result={r.result} />
          </td>
        </tr>
      )}
    </>
  );
}
