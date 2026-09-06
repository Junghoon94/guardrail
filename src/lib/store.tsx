"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { INITIAL_STATE } from "./defaults";
import { AuditEntry, FilterResult, GuardrailState, PendingApproval, Proposal, SafeSet, ThreatAssessment, Transaction } from "./types";

const KEY = "guardrail-demo-v1";
export const uid = () => Math.random().toString(36).slice(2, 10);

interface Store {
  state: GuardrailState;
  hydrated: boolean;
  setSafeSet: (s: Partial<SafeSet>) => void;
  setKillSwitch: (on: boolean) => void;
  toggleWhitelist: (name: string) => void;
  addRecipient: (name: string, relation: string) => void;
  commit: (p: Proposal, t: ThreatAssessment, r: FilterResult, explanation: string, actor?: AuditEntry["actor"]) => void;
  approve: (id: string, ok: boolean) => void;
  cancelScheduled: (id: string) => void;
  reset: () => void;
  log: (e: Omit<AuditEntry, "id" | "time">) => void;
}

const Ctx = createContext<Store | null>(null);

export function GuardrailProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuardrailState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...INITIAL_STATE, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    loaded.current = true;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const api = useMemo<Store>(() => {
    const now = () => new Date().toISOString();
    const alert = (s: GuardrailState, text: string, level: "info" | "warn" | "danger") => ({
      ...s,
      guardianAlerts: [{ id: uid(), time: now(), text, level }, ...s.guardianAlerts].slice(0, 30),
    });
    return {
      state,
      hydrated,
      setSafeSet: (patch) =>
        setState((s) => {
          const next = { ...s, safeSet: { ...s.safeSet, ...patch } };
          return {
            ...next,
            audit: [
              { id: uid(), time: now(), actor: "guardian", input: "안전 집합 변경", note: JSON.stringify(patch) },
              ...s.audit,
            ],
          };
        }),
      setKillSwitch: (on) =>
        setState((s) =>
          alert(
            {
              ...s,
              killSwitch: on,
              audit: [{ id: uid(), time: now(), actor: "guardian", input: on ? "긴급 정지 ON" : "긴급 정지 해제", note: "모든 에이전트 행동 " + (on ? "정지" : "재개") }, ...s.audit],
            },
            on ? "긴급 정지가 켜졌습니다. 에이전트의 모든 거래가 중단됩니다." : "긴급 정지가 해제되었습니다.",
            on ? "danger" : "info"
          )
        ),
      toggleWhitelist: (name) =>
        setState((s) => ({
          ...s,
          recipients: s.recipients.map((r) => (r.name === name ? { ...r, whitelisted: !r.whitelisted } : r)),
        })),
      addRecipient: (name, relation) =>
        setState((s) =>
          s.recipients.some((r) => r.name === name)
            ? s
            : { ...s, recipients: [...s.recipients, { name, relation, account: "-", whitelisted: true, firstSeen: now() }] }
        ),
      log: (e) => setState((s) => ({ ...s, audit: [{ id: uid(), time: now(), ...e }, ...s.audit].slice(0, 200) })),
      commit: (p, t, r, explanation, actor = "user") =>
        setState((s0) => {
          let s = s0;
          const txs: Transaction[] = [];
          const pend: PendingApproval[] = [];
          if (r.immediateAmount > 0) {
            txs.push({ id: uid(), time: now(), recipient: p.recipient, amount: r.immediateAmount, type: p.type, memo: p.memo, status: "executed" });
            s = { ...s, balance: s.balance - r.immediateAmount };
          }
          if (r.deferredAmount > 0) {
            txs.push({
              id: uid(),
              time: now(),
              recipient: p.recipient,
              amount: r.deferredAmount,
              type: p.type,
              memo: p.memo + " (지연이체)",
              status: "scheduled",
              scheduledFor: r.deferredUntil,
            });
            s = alert(s, `${p.recipient}에게 ${r.deferredAmount.toLocaleString()}원 지연이체가 예약되었습니다(신규 수취인).`, "warn");
          }
          if (r.approvalAmount > 0) {
            pend.push({ id: uid(), time: now(), proposal: p, amount: r.approvalAmount, reason: r.reasons.join(" / ") });
            s = alert(s, `승인 요청: ${p.recipient}에게 ${r.approvalAmount.toLocaleString()}원 (${t.category !== "없음" ? t.category : "한도 초과"})`, "warn");
          }
          if (r.verdict === "BLOCK" && t.score >= s.safeSet.threatBlockThreshold) {
            s = alert(s, `⚠ 사기 의심 요청 차단: ${t.category} · ${p.recipient} ${p.amount.toLocaleString()}원. 어머니께 전화로 확인하세요.`, "danger");
          } else if (r.verdict === "BLOCK") {
            s = alert(s, `차단: ${p.recipient} ${p.amount.toLocaleString()}원 — ${r.reasons[0] ?? ""}`, "warn");
          }
          const entry: AuditEntry = {
            id: uid(),
            time: now(),
            actor,
            input: p.raw + (p.attachedContent ? `\n[첨부] ${p.attachedContent.slice(0, 120)}…` : ""),
            proposal: p,
            threat: t,
            result: r,
            note: explanation,
          };
          return { ...s, transactions: [...txs, ...s.transactions], pending: [...pend, ...s.pending], audit: [entry, ...s.audit].slice(0, 200) };
        }),
      approve: (id, ok) =>
        setState((s0) => {
          const pa = s0.pending.find((x) => x.id === id);
          if (!pa) return s0;
          let s = { ...s0, pending: s0.pending.filter((x) => x.id !== id) };
          if (ok) {
            s = {
              ...s,
              balance: s.balance - pa.amount,
              transactions: [
                { id: uid(), time: now(), recipient: pa.proposal.recipient, amount: pa.amount, type: pa.proposal.type, memo: pa.proposal.memo + " (보호자 승인)", status: "executed" },
                ...s.transactions,
              ],
            };
          }
          return {
            ...s,
            audit: [{ id: uid(), time: now(), actor: "guardian", input: `승인 요청 ${ok ? "승인" : "거절"}`, note: `${pa.proposal.recipient} ${pa.amount.toLocaleString()}원` }, ...s.audit],
          };
        }),
      cancelScheduled: (id) =>
        setState((s) => ({
          ...s,
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, status: "blocked", memo: t.memo + " (취소)" } : t)),
          audit: [{ id: uid(), time: now(), actor: "user", input: "지연이체 취소", note: id }, ...s.audit],
        })),
      reset: () => setState({ ...INITIAL_STATE }),
    };
  }, [state, hydrated]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGuardrail() {
  const c = useContext(Ctx);
  if (!c) throw new Error("GuardrailProvider missing");
  return c;
}

/* ---------- 서버 LLM 호출 (폴백 포함) ---------- */
export async function llm<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error("llm api error");
  return (await res.json()) as T;
}
