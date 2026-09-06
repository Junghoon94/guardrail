"use client";
import { Fragment, useState } from "react";
import { DEMO_GUARDIAN, DEMO_USER } from "@/lib/defaults";
import { spentInWindow, won } from "@/lib/filter";
import { llm, useGuardrail } from "@/lib/store";
import Gauge from "@/components/Gauge";
import VerdictCard from "@/components/VerdictCard";

export default function Guardian() {
  const { state, hydrated, setSafeSet, setKillSwitch, approve, toggleWhitelist, addRecipient } = useGuardrail();
  const [report, setReport] = useState<string>("");
  const [reportBusy, setReportBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [openLog, setOpenLog] = useState<string | null>(null);
  const s = state.safeSet;
  const daily = spentInWindow(state, 1);
  const monthly = spentInWindow(state, 30);

  async function makeReport() {
    setReportBusy(true);
    try {
      const r = await llm<{ text: string }>({ task: "report", audit: state.audit.slice(0, 30) });
      setReport(r.text);
    } finally {
      setReportBusy(false);
    }
  }

  if (!hydrated) return <main className="container muted">불러오는 중…</main>;

  return (
    <main className="container">
      <div className="row" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow">보호자 대시보드</div>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>
            {DEMO_GUARDIAN.name}({DEMO_GUARDIAN.relation}) → {DEMO_USER.name} 어르신 계정
          </h2>
        </div>
        <span className="spacer" />
        <div className={`kill ${state.killSwitch ? "on" : ""}`}>
          <div>
            <b>긴급 정지 (Kill Switch)</b>
            <div className="small" style={{ opacity: 0.85 }}>
              {state.killSwitch ? "에이전트의 모든 거래가 중단된 상태" : "켜면 에이전트의 모든 거래가 즉시 중단됩니다"}
            </div>
          </div>
          <button className={`btn ${state.killSwitch ? "" : "danger"}`} onClick={() => setKillSwitch(!state.killSwitch)}>
            {state.killSwitch ? "해제" : "정지"}
          </button>
        </div>
      </div>

      <div className="grid grid-3">
        {/* Alerts + pending */}
        <div className="grid">
          <div className="card">
            <h3>
              승인 대기 <span className="sub">{state.pending.length}건</span>
            </h3>
            {state.pending.length === 0 && <p className="muted small">대기 중인 승인 요청이 없습니다.</p>}
            {state.pending.map((p) => (
              <div key={p.id} className="alert warn" style={{ marginBottom: 8 }}>
                <b>
                  {p.proposal.recipient} · {won(p.amount)}
                </b>
                <div className="small">{p.reason}</div>
                <div className="small muted" style={{ margin: "4px 0" }}>
                  요청: “{p.proposal.raw}”
                </div>
                <div className="row">
                  <button className="btn sm primary" onClick={() => approve(p.id, true)}>
                    승인
                  </button>
                  <button className="btn sm" onClick={() => approve(p.id, false)}>
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>
              알림 <span className="sub">최근 {state.guardianAlerts.length}건</span>
            </h3>
            {state.guardianAlerts.length === 0 && <p className="muted small">알림이 없습니다. 어르신 앱에서 시나리오를 실행해 보세요.</p>}
            <div className="grid" style={{ gap: 8 }}>
              {state.guardianAlerts.slice(0, 8).map((a) => (
                <div key={a.id} className={`alert ${a.level}`}>
                  {a.text}
                  <time>{new Date(a.time).toLocaleString("ko-KR")}</time>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gauges + safe set */}
        <div className="grid">
          <div className="card">
            <h3>
              안전 여유 h(x) <span className="sub">누적 사용 / 한도</span>
            </h3>
            <div className="grid" style={{ gap: 14 }}>
              <Gauge label="오늘 누적" used={daily} limit={s.dailyLimit} />
              <Gauge label="30일 누적" used={monthly} limit={s.monthlyLimit} />
              <div className="kv small">
                <b>잔액</b>
                <span>{won(state.balance)}</span>
                <b>실행 거래</b>
                <span>{state.transactions.filter((t) => t.status === "executed").length}건</span>
                <b>예약 지연이체</b>
                <span>{state.transactions.filter((t) => t.status === "scheduled").length}건</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>
              안전 집합 설정 <span className="sub">변경 즉시 필터에 반영</span>
            </h3>
            <div className="grid" style={{ gap: 14 }}>
              <div className="field">
                <label>
                  <span>1회 한도</span>
                  <b>{won(s.perTxLimit)}</b>
                </label>
                <input type="range" min={100000} max={3000000} step={50000} value={s.perTxLimit} onChange={(e) => setSafeSet({ perTxLimit: +e.target.value })} />
              </div>
              <div className="field">
                <label>
                  <span>일 한도</span>
                  <b>{won(s.dailyLimit)}</b>
                </label>
                <input type="range" min={200000} max={5000000} step={100000} value={s.dailyLimit} onChange={(e) => setSafeSet({ dailyLimit: +e.target.value })} />
              </div>
              <div className="field">
                <label>
                  <span>월 한도</span>
                  <b>{won(s.monthlyLimit)}</b>
                </label>
                <input type="range" min={500000} max={20000000} step={500000} value={s.monthlyLimit} onChange={(e) => setSafeSet({ monthlyLimit: +e.target.value })} />
              </div>
              <div className="field">
                <label>
                  <span>신규 수취인 즉시 상한</span>
                  <b>{won(s.newRecipientInstantCap)}</b>
                </label>
                <input type="range" min={0} max={1000000} step={50000} value={s.newRecipientInstantCap} onChange={(e) => setSafeSet({ newRecipientInstantCap: +e.target.value })} />
              </div>
              <div className="field">
                <label>
                  <span>신규 수취인 지연 시간</span>
                  <b>{s.newRecipientDelayHours}시간</b>
                </label>
                <input type="range" min={1} max={72} step={1} value={s.newRecipientDelayHours} onChange={(e) => setSafeSet({ newRecipientDelayHours: +e.target.value })} />
              </div>
              <div className="field">
                <label>
                  <span>거래 허용 시간대</span>
                  <b>
                    {s.allowedHours[0]}시 – {s.allowedHours[1]}시
                  </b>
                </label>
                <div className="row">
                  <input type="number" min={0} max={23} value={s.allowedHours[0]} onChange={(e) => setSafeSet({ allowedHours: [+e.target.value, s.allowedHours[1]] })} style={{ width: 80 }} />
                  <span>~</span>
                  <input type="number" min={1} max={24} value={s.allowedHours[1]} onChange={(e) => setSafeSet({ allowedHours: [s.allowedHours[0], +e.target.value] })} style={{ width: 80 }} />
                </div>
              </div>
              <div className="field">
                <label>
                  <span>위협 점수 임계 (승인 대기 / 차단)</span>
                  <b>
                    {s.threatHoldThreshold} / {s.threatBlockThreshold}
                  </b>
                </label>
                <input type="range" min={0.1} max={0.6} step={0.05} value={s.threatHoldThreshold} onChange={(e) => setSafeSet({ threatHoldThreshold: +e.target.value })} />
                <input type="range" min={0.4} max={0.95} step={0.05} value={s.threatBlockThreshold} onChange={(e) => setSafeSet({ threatBlockThreshold: +e.target.value })} />
              </div>
              <div className="row">
                <label className="switch">
                  <input type="checkbox" checked={s.forbidForeign} onChange={(e) => setSafeSet({ forbidForeign: e.target.checked })} /> 해외송금 금지
                </label>
                <label className="switch">
                  <input type="checkbox" checked={s.forbidHighRiskInvest} onChange={(e) => setSafeSet({ forbidHighRiskInvest: e.target.checked })} /> 고위험 투자 금지
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Recipients + report */}
        <div className="grid">
          <div className="card">
            <h3>
              수취인 화이트리스트 <span className="sub">체크 해제 시 신규 수취인으로 취급</span>
            </h3>
            <div className="grid" style={{ gap: 6 }}>
              {state.recipients.map((r) => (
                <label key={r.name} className="switch" style={{ justifyContent: "space-between" }}>
                  <span>
                    {r.name} <span className="muted small">{r.relation}</span>
                  </span>
                  <input type="checkbox" checked={r.whitelisted} onChange={() => toggleWhitelist(r.name)} />
                </label>
              ))}
            </div>
            <hr className="sep" />
            <div className="row">
              <input type="text" placeholder="이름 추가 (예: 박영수)" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 9, padding: "8px 10px" }} />
              <button
                className="btn sm"
                onClick={() => {
                  if (newName.trim()) addRecipient(newName.trim(), "지인");
                  setNewName("");
                }}
              >
                등록
              </button>
            </div>
          </div>
          <div className="card">
            <h3>
              보호자 리포트 <span className="sub">생성형 AI 요약</span>
            </h3>
            <button className="btn primary sm" onClick={makeReport} disabled={reportBusy || state.audit.length === 0}>
              {reportBusy ? "생성 중…" : "이번 세션 활동 요약 생성"}
            </button>
            {state.audit.length === 0 && <p className="muted small" style={{ marginTop: 8 }}>감사로그가 쌓이면 요약을 생성할 수 있습니다.</p>}
            {report && (
              <p style={{ marginTop: 12, fontSize: 14, whiteSpace: "pre-wrap" }} className="alert info">
                {report}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Audit log */}
      <div className="card" style={{ marginTop: 18 }}>
        <h3>
          감사로그 <span className="sub">모든 제안·판정·근거가 기록됩니다 (최근 {state.audit.length}건)</span>
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>시각</th>
                <th>주체</th>
                <th>입력</th>
                <th>제안</th>
                <th>위협</th>
                <th>판정</th>
                <th>실행</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.audit.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">
                    기록이 없습니다.
                  </td>
                </tr>
              )}
              {state.audit.map((a) => (
                <Fragment key={a.id}>
                  <tr>
                    <td className="mono small">{new Date(a.time).toLocaleTimeString("ko-KR")}</td>
                    <td>{a.actor === "user" ? "어르신" : a.actor === "guardian" ? "보호자" : a.actor === "redteam" ? "레드팀" : "시스템"}</td>
                    <td style={{ maxWidth: 260, whiteSpace: "pre-wrap" }}>{a.input}</td>
                    <td>{a.proposal ? `${a.proposal.recipient} · ${won(a.proposal.amount)}` : a.note}</td>
                    <td>{a.threat ? `${a.threat.category} ${a.threat.score.toFixed(2)}` : "-"}</td>
                    <td>{a.result ? <span className={`badge ${a.result.verdict}`}>{a.result.verdict}</span> : "-"}</td>
                    <td>{a.result ? won(a.result.immediateAmount) : "-"}</td>
                    <td>
                      {a.result && (
                        <button className="btn sm ghost" onClick={() => setOpenLog(openLog === a.id ? null : a.id)}>
                          {openLog === a.id ? "닫기" : "상세"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {openLog === a.id && a.result && a.proposal && a.threat && (
                    <tr>
                      <td colSpan={8}>
                        <VerdictCard proposal={a.proposal} threat={a.threat} result={a.result} />
                        <p className="small muted" style={{ marginTop: 8 }}>어르신에게 전달된 설명: {a.note}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
