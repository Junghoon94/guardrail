import { Constraint, FilterResult, GuardrailState, Proposal, ThreatAssessment } from "./types";

export const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

export function spentInWindow(state: GuardrailState, days: number, now = new Date()): number {
  const from = new Date(now);
  if (days === 1) from.setHours(0, 0, 0, 0);
  else from.setDate(from.getDate() - days);
  return state.transactions
    .filter((t) => (t.status === "executed" || t.status === "scheduled") && new Date(t.time) >= from)
    .reduce((s, t) => s + t.amount, 0);
}

export function isNewRecipient(state: GuardrailState, name: string): boolean {
  const r = state.recipients.find((x) => x.name === name);
  return !r || !r.whitelisted;
}

/**
 * 결정론적 안전필터.
 * 각 제약을 h_i(x,u) >= 0 형태의 여유(margin)로 계산하고,
 * 위반 시 "가장 가까운 안전한 행동"으로 금액을 투영한다(최소 개입).
 */
export function applySafetyFilter(
  state: GuardrailState,
  proposal: Proposal,
  threat: ThreatAssessment,
  now = new Date()
): FilterResult {
  const s = state.safeSet;
  const amt = Math.max(0, Math.round(proposal.amount));
  const daily = spentInWindow(state, 1, now);
  const monthly = spentInWindow(state, 30, now);
  const newRcpt = isNewRecipient(state, proposal.recipient);
  const hour = now.getHours();

  const constraints: Constraint[] = [];
  const push = (c: Omit<Constraint, "satisfied">) => constraints.push({ ...c, satisfied: c.h >= 0 });

  // 하드 제약 (투영 불가 → 차단)
  push({
    key: "kill",
    label: "긴급 정지 스위치",
    h: state.killSwitch ? -1 : 1,
    unit: "bool",
    note: state.killSwitch ? "보호자/사용자가 모든 에이전트 행동을 정지함" : "정상",
  });
  push({
    key: "threat_block",
    label: `위협 점수 < ${s.threatBlockThreshold}`,
    h: s.threatBlockThreshold - threat.score,
    unit: "score",
    note: `${threat.category} · 점수 ${threat.score.toFixed(2)}`,
  });
  push({
    key: "type",
    label: "금지 거래 유형",
    h: (proposal.type === "foreign" && s.forbidForeign) || (proposal.type === "invest" && s.forbidHighRiskInvest) ? -1 : 1,
    unit: "bool",
    note: proposal.type === "foreign" ? "해외송금" : proposal.type === "invest" ? "고위험 투자" : "허용 유형",
  });
  push({
    key: "hours",
    label: s.allowedHours[0] <= 0 && s.allowedHours[1] >= 24 ? "거래 시간대 (제한 없음)" : `거래 시간대 ${s.allowedHours[0]}시–${s.allowedHours[1]}시`,
    h: hour >= s.allowedHours[0] && hour < s.allowedHours[1] ? 1 : -1,
    unit: "hour",
    note: `현재 ${hour}시`,
  });
  push({
    key: "balance",
    label: "잔액",
    h: state.balance - amt,
    unit: "won",
    note: `잔액 ${won(state.balance)}`,
  });

  // 소프트 제약 (투영 가능)
  push({ key: "perTx", label: "1회 한도", h: s.perTxLimit - amt, unit: "won", note: `한도 ${won(s.perTxLimit)}` });
  push({
    key: "daily",
    label: "일 한도",
    h: s.dailyLimit - (daily + amt),
    unit: "won",
    note: `오늘 누적 ${won(daily)} / ${won(s.dailyLimit)}`,
  });
  push({
    key: "monthly",
    label: "월 한도",
    h: s.monthlyLimit - (monthly + amt),
    unit: "won",
    note: `30일 누적 ${won(monthly)} / ${won(s.monthlyLimit)}`,
  });
  push({
    key: "newRcpt",
    label: "신규 수취인 즉시 상한",
    h: newRcpt ? s.newRecipientInstantCap - amt : 1,
    unit: newRcpt ? "won" : "bool",
    note: newRcpt ? `미등록 수취인 · 즉시 상한 ${won(s.newRecipientInstantCap)}` : "화이트리스트 수취인",
  });
  push({
    key: "threat_hold",
    label: `위협 점수 < ${s.threatHoldThreshold} (승인 없이 실행)`,
    h: s.threatHoldThreshold - threat.score,
    unit: "score",
    note: threat.signals.slice(0, 3).join(", ") || "이상 신호 없음",
  });

  const reasons: string[] = [];
  const advice: string[] = [];
  const hard = constraints.filter((c) => ["kill", "threat_block", "type", "hours", "balance"].includes(c.key) && !c.satisfied);

  // 1) 하드 제약 위반 → 차단
  if (hard.length > 0) {
    for (const c of hard) reasons.push(`${c.label} 위반 (${c.note})`);
    if (!constraints.find((c) => c.key === "threat_block")!.satisfied) {
      advice.push("이 요청은 사기 수법의 특징이 강합니다. 절대 송금하지 마세요.");
      advice.push("보호자(아들 김민수)에게 알림을 보냈습니다. 가족에게 직접 전화로 확인하세요.");
      advice.push("경찰 112 또는 금융감독원 1332로 신고할 수 있습니다. 이미 보냈다면 은행에 지급정지를 요청하세요.");
      advice.push("검찰·경찰·금감원은 전화나 문자로 계좌 이체를 요구하지 않습니다.");
    } else if (state.killSwitch) {
      advice.push("긴급 정지 상태입니다. 보호자 대시보드에서 해제할 수 있습니다.");
    } else if (!constraints.find((c) => c.key === "hours")!.satisfied) {
      advice.push(`거래 허용 시간(${s.allowedHours[0]}시–${s.allowedHours[1]}시)에 다시 시도하거나 보호자 승인을 요청하세요.`);
    } else if (!constraints.find((c) => c.key === "type")!.satisfied) {
      advice.push("이 유형의 거래는 안전 집합에서 금지되어 있습니다. 필요하면 보호자와 상의해 규칙을 바꾸세요.");
    } else {
      advice.push("잔액이 부족합니다.");
    }
    return {
      verdict: "BLOCK",
      immediateAmount: 0,
      deferredAmount: 0,
      approvalAmount: 0,
      constraints,
      reasons,
      advice,
      unsafeAgentWouldExecute: Math.min(amt, state.balance),
    };
  }

  // 1-b) 금액이 없으면 실행할 거래가 없음 → 차단(아무 것도 하지 않음)
  if (amt <= 0) {
    reasons.push("거래 금액이 확인되지 않아 실행할 거래가 없음");
    if (threat.score >= s.threatHoldThreshold) advice.push("메시지에 이상 신호가 있습니다. 답장이나 링크 클릭을 하지 마세요.");
    return { verdict: "BLOCK", immediateAmount: 0, deferredAmount: 0, approvalAmount: 0, constraints, reasons, advice, unsafeAgentWouldExecute: 0 };
  }

  // 2) 최소 개입 투영: 즉시 실행 가능한 최대 금액
  const caps = [s.perTxLimit, s.dailyLimit - daily, s.monthlyLimit - monthly, state.balance];
  if (newRcpt) caps.push(s.newRecipientInstantCap);
  const capNow = Math.max(0, Math.min(...caps));
  const holdByThreat = threat.score >= s.threatHoldThreshold;

  let immediate = Math.min(amt, capNow);
  let deferred = 0;
  let approval = 0;
  let verdict: FilterResult["verdict"] = "ALLOW";

  if (holdByThreat) {
    // 중간 위험: 즉시 실행 없이 전액 보호자 승인
    immediate = 0;
    approval = amt;
    verdict = "HOLD";
    reasons.push(`위협 점수 ${threat.score.toFixed(2)} ≥ ${s.threatHoldThreshold}: 보호자 승인 후 실행`);
    for (const sg of threat.signals.slice(0, 3)) reasons.push(`이상 신호: ${sg}`);
    advice.push("메시지 내용이 급하게 돈을 요구하는 형태입니다. 먼저 당사자에게 평소 번호로 전화해 확인하세요.");
    advice.push("보호자에게 승인 요청을 보냈습니다. 승인되면 실행됩니다.");
  } else if (immediate < amt) {
    const rest = amt - immediate;
    // 남은 금액: 신규 수취인은 지연이체, 한도 초과는 보호자 승인
    const remainingByLimits = Math.max(0, Math.min(s.dailyLimit - daily, s.monthlyLimit - monthly) - immediate);
    if (newRcpt && rest <= remainingByLimits && rest <= s.perTxLimit) {
      deferred = rest;
    } else {
      deferred = newRcpt ? Math.min(rest, remainingByLimits, s.perTxLimit) : 0;
      approval = rest - deferred;
    }
    verdict = immediate > 0 ? "PROJECT" : "HOLD";
    for (const c of constraints.filter((x) => !x.satisfied && x.unit === "won")) reasons.push(`${c.label} 초과 (${c.note})`);
    if (immediate > 0) reasons.push(`가장 가까운 안전한 행동으로 조정: ${won(immediate)} 즉시 실행`);
    if (deferred > 0) reasons.push(`${won(deferred)}은(는) ${s.newRecipientDelayHours}시간 지연이체로 예약(취소 가능)`);
    if (approval > 0) reasons.push(`${won(approval)}은(는) 보호자 승인 대기`);
    if (newRcpt) advice.push("처음 보내는 분입니다. 지연이체 시간 동안 언제든 취소할 수 있습니다.");
    if (approval > 0) advice.push("한도를 넘는 금액은 보호자가 승인하면 실행됩니다.");
  } else {
    reasons.push("모든 안전 제약 충족");
    if (newRcpt) reasons.push("미등록 수취인이지만 즉시 상한 이내");
  }

  const deferredUntil = deferred > 0 ? new Date(now.getTime() + s.newRecipientDelayHours * 3600_000).toISOString() : undefined;

  return {
    verdict,
    immediateAmount: immediate,
    deferredAmount: deferred,
    deferredUntil,
    approvalAmount: approval,
    constraints,
    reasons,
    advice,
    unsafeAgentWouldExecute: Math.min(amt, state.balance),
  };
}
