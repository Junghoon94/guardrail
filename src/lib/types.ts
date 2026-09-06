export type TxType = "transfer" | "payment" | "invest" | "foreign" | "unknown";

export interface SafeSet {
  perTxLimit: number; // 1회 한도 (원)
  dailyLimit: number; // 일 한도
  monthlyLimit: number; // 월 한도
  newRecipientInstantCap: number; // 신규 수취인 즉시 이체 상한 (초과분은 지연/승인)
  newRecipientDelayHours: number; // 신규 수취인 지연이체 시간
  allowedHours: [number, number]; // 거래 허용 시간대 [시작, 끝)
  forbidForeign: boolean; // 해외송금 금지
  forbidHighRiskInvest: boolean; // 고위험 투자 금지
  threatHoldThreshold: number; // 이 점수 이상이면 보호자 승인 대기
  threatBlockThreshold: number; // 이 점수 이상이면 차단
}

export interface Recipient {
  name: string;
  relation: string; // 가족, 병원, 공과금, 지인 ...
  account: string;
  whitelisted: boolean;
  firstSeen: string; // ISO
}

export interface Transaction {
  id: string;
  time: string; // ISO
  recipient: string;
  amount: number;
  type: TxType;
  memo: string;
  status: "executed" | "scheduled" | "pending" | "blocked";
  scheduledFor?: string;
}

export interface Proposal {
  recipient: string;
  amount: number;
  type: TxType;
  memo: string;
  urgency: "low" | "normal" | "high";
  raw: string; // 원문 지시
  attachedContent?: string; // 붙여넣은 문자/메일 등
}

export interface ThreatAssessment {
  score: number; // 0..1
  category: string; // 기관사칭, 가족사칭, 대출빙자, 안전계좌, 링크/앱설치, 없음
  signals: string[];
  source: "llm" | "rules";
}

export type Verdict = "ALLOW" | "PROJECT" | "HOLD" | "BLOCK";

export interface Constraint {
  key: string;
  label: string;
  h: number; // 여유 (>=0 안전, <0 위반). 금액 제약은 원 단위
  unit: "won" | "score" | "bool" | "hour";
  satisfied: boolean;
  note: string;
}

export interface FilterResult {
  verdict: Verdict;
  immediateAmount: number;
  deferredAmount: number;
  deferredUntil?: string;
  approvalAmount: number; // 보호자 승인 필요 금액
  constraints: Constraint[];
  reasons: string[];
  advice: string[]; // 행동요령
  unsafeAgentWouldExecute: number; // 필터 없는 에이전트가 실행했을 금액
}

export interface AuditEntry {
  id: string;
  time: string;
  actor: "user" | "guardian" | "system" | "redteam";
  input: string;
  proposal?: Proposal;
  threat?: ThreatAssessment;
  result?: FilterResult;
  note: string;
}

export interface PendingApproval {
  id: string;
  time: string;
  proposal: Proposal;
  amount: number;
  reason: string;
}

export interface GuardrailState {
  safeSet: SafeSet;
  recipients: Recipient[];
  transactions: Transaction[];
  audit: AuditEntry[];
  pending: PendingApproval[];
  killSwitch: boolean;
  balance: number;
  guardianAlerts: { id: string; time: string; text: string; level: "info" | "warn" | "danger" }[];
}
