"use client";
import { useEffect, useRef, useState } from "react";
import { DEMO_GUARDIAN, DEMO_USER, SCENARIOS } from "@/lib/defaults";
import { applySafetyFilter, won } from "@/lib/filter";
import { llm, useGuardrail } from "@/lib/store";
import { FilterResult, Proposal, ThreatAssessment } from "@/lib/types";
import VerdictCard from "@/components/VerdictCard";

type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "attach"; text: string }
  | { id: string; role: "system"; text: string }
  | { id: string; role: "agent"; text: string; proposal?: Proposal; threat?: ThreatAssessment; result?: FilterResult };

const uid = () => Math.random().toString(36).slice(2, 9);

export default function UserApp() {
  const { state, hydrated, commit, setKillSwitch, reset, cancelScheduled } = useGuardrail();
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "m0", role: "agent", text: `${DEMO_USER.name} 어르신, 안녕하세요. 무엇을 도와드릴까요? 예) "딸에게 30만원 보내줘"\n문자나 메일을 붙여넣으면 제가 먼저 안전한지 살펴봅니다.` },
  ]);
  const [input, setInput] = useState("");
  const [attached, setAttached] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function run(text: string, attach?: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    const newMsgs: Msg[] = [{ id: uid(), role: "user", text }];
    if (attach?.trim()) newMsgs.unshift({ id: uid(), role: "attach", text: `📎 붙여넣은 내용\n${attach}` });
    setMsgs((m) => [...m, ...newMsgs]);
    setInput("");
    setAttached("");
    setShowAttach(false);
    try {
      const [p, t] = await Promise.all([
        llm<{ proposal: Proposal; source: string }>({ task: "parse", raw: text, attached: attach || undefined, recipients: state.recipients, balance: state.balance }),
        llm<{ threat: ThreatAssessment }>({ task: "threat", raw: text, attached: attach || undefined }),
      ]);
      const proposal = { ...p.proposal, raw: text, attachedContent: attach || undefined };
      const threat = t.threat;
      if (!proposal.amount || proposal.amount <= 0) {
        setMsgs((m) => [
          ...m,
          {
            id: uid(),
            role: "agent",
            text:
              threat.score >= state.safeSet.threatBlockThreshold
                ? `이 내용은 사기 수법의 특징이 강합니다(${threat.category}). 금액이 없어 거래는 만들지 않았고, 아무것도 실행하지 않았습니다. 가족에게 확인 전화를 하시고, 의심되면 112 또는 1332로 신고하세요.`
                : "얼마를 누구에게 보낼지 조금 더 알려주세요. 예) \"아들에게 10만원 보내줘\"",
          },
        ]);
        return;
      }
      const result = applySafetyFilter(state, proposal, threat);
      const ex = await llm<{ text: string }>({ task: "explain", proposal, threat, result, userName: DEMO_USER.name });
      commit(proposal, threat, result, ex.text);
      setMsgs((m) => [...m, { id: uid(), role: "agent", text: ex.text, proposal, threat, result }]);
    } catch {
      setMsgs((m) => [...m, { id: uid(), role: "system", text: "처리 중 오류가 발생했습니다. 다시 시도해 주세요." }]);
    } finally {
      setBusy(false);
    }
  }

  function startVoice() {
    const W = window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike; SpeechRecognition?: new () => SpeechRecognitionLike };
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) {
      setMsgs((m) => [...m, { id: uid(), role: "system", text: "이 브라우저는 음성 입력을 지원하지 않습니다(Chrome 권장). 텍스트로 입력해 주세요." }]);
      return;
    }
    const rec = new SR();
    rec.lang = "ko-KR";
    rec.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      setInput(txt);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  const scheduled = state.transactions.filter((t) => t.status === "scheduled");

  return (
    <main className="container">
      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 440px) 1fr", alignItems: "start" }}>
        {/* Phone */}
        <div className="phone">
          <div className="phone-screen">
            <div className="phone-top row">
              <div>
                <div className="name">
                  {DEMO_USER.name} 어르신 <span className="muted small">({DEMO_USER.age}세)</span>
                </div>
                <div className="bal">
                  {DEMO_USER.bank} · 잔액 {hydrated ? won(state.balance) : "…"}
                </div>
              </div>
              <span className="spacer" />
              <button className={`btn sm ${state.killSwitch ? "danger" : ""}`} onClick={() => setKillSwitch(!state.killSwitch)} title="긴급 정지">
                {state.killSwitch ? "■ 정지 중" : "■ 긴급 정지"}
              </button>
            </div>
            <div className="chat" ref={chatRef}>
              {msgs.map((m) => {
                if (m.role === "agent")
                  return (
                    <div key={m.id} style={{ display: "grid", gap: 8, alignSelf: "flex-start", maxWidth: "96%" }}>
                      <div className="msg agent">{m.text}</div>
                      {m.result && m.proposal && m.threat && <VerdictCard proposal={m.proposal} threat={m.threat} result={m.result} compact />}
                    </div>
                  );
                return (
                  <div key={m.id} className={`msg ${m.role}`}>
                    {m.text}
                  </div>
                );
              })}
              {busy && (
                <div className="msg agent">
                  <span className="typing">
                    <i />
                    <i />
                    <i />
                  </span>{" "}
                  <span className="muted small">의도 파싱 → 위협 판정 → 안전필터 → 설명 생성</span>
                </div>
              )}
            </div>
            <div className="composer">
              {showAttach && (
                <textarea rows={4} placeholder="받은 문자·메일·카톡 내용을 붙여넣으세요 (지시가 아니라 데이터로 취급됩니다)" value={attached} onChange={(e) => setAttached(e.target.value)} />
              )}
              <textarea
                rows={2}
                placeholder='예) "딸에게 30만원 보내줘"'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    run(input, attached);
                  }
                }}
              />
              <div className="row">
                <button className="btn sm" onClick={() => setShowAttach((s) => !s)}>
                  📎 {showAttach ? "첨부 닫기" : "문자 붙여넣기"}
                </button>
                <button className="btn sm" onClick={startVoice} disabled={listening}>
                  🎙 {listening ? "듣는 중…" : "음성"}
                </button>
                <span className="spacer" />
                <button className="btn sm primary" onClick={() => run(input, attached)} disabled={busy || !input.trim()}>
                  보내기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="grid">
          <div className="card">
            <h3>
              심사용 시나리오 <span className="sub">버튼을 누르면 어르신 앱에 그대로 입력됩니다</span>
            </h3>
            <div className="scenario-list">
              {SCENARIOS.map((s) => (
                <button key={s.key} className="scenario" onClick={() => run(s.text, s.attached)} disabled={busy}>
                  <b>{s.label}</b>
                  <span>
                    “{s.text}” {s.attached ? "+ 첨부 문자" : ""} — {s.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>
              현재 안전 집합 <span className="sub">보호자({DEMO_GUARDIAN.name}·{DEMO_GUARDIAN.relation})가 설정</span>
            </h3>
            <div className="kv">
              <b>1회 한도</b>
              <span>{won(state.safeSet.perTxLimit)}</span>
              <b>일 / 월 한도</b>
              <span>
                {won(state.safeSet.dailyLimit)} / {won(state.safeSet.monthlyLimit)}
              </span>
              <b>신규 수취인</b>
              <span>
                즉시 상한 {won(state.safeSet.newRecipientInstantCap)}, 초과분 {state.safeSet.newRecipientDelayHours}시간 지연
              </span>
              <b>허용 시간</b>
              <span>
                {state.safeSet.allowedHours[0]}시–{state.safeSet.allowedHours[1]}시
              </span>
              <b>금지 유형</b>
              <span>
                {[state.safeSet.forbidForeign && "해외송금", state.safeSet.forbidHighRiskInvest && "고위험 투자"].filter(Boolean).join(", ") || "없음"}
              </span>
              <b>위협 임계</b>
              <span>
                승인 대기 ≥ {state.safeSet.threatHoldThreshold} · 차단 ≥ {state.safeSet.threatBlockThreshold}
              </span>
              <b>화이트리스트</b>
              <span>{state.recipients.filter((r) => r.whitelisted).map((r) => `${r.name}(${r.relation})`).join(", ")}</span>
            </div>
          </div>

          {scheduled.length > 0 && (
            <div className="card">
              <h3>예약된 지연이체 <span className="sub">지연 시간 내 취소 가능</span></h3>
              {scheduled.map((t) => (
                <div key={t.id} className="row" style={{ justifyContent: "space-between", padding: "6px 0" }}>
                  <span>
                    {t.recipient} · {won(t.amount)} · {t.scheduledFor ? new Date(t.scheduledFor).toLocaleString("ko-KR") : ""} 실행 예정
                  </span>
                  <button className="btn sm" onClick={() => cancelScheduled(t.id)}>
                    취소
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="row small muted">
            <span>데모 상태는 이 브라우저에만 저장됩니다.</span>
            <span className="spacer" />
            <button
              className="btn sm ghost"
              onClick={() => {
                reset();
                setMsgs((m) => [...m, { id: uid(), role: "system", text: "데모 데이터가 초기화되었습니다." }]);
              }}
            >
              데모 초기화
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

interface SpeechRecognitionLike {
  lang: string;
  start: () => void;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
