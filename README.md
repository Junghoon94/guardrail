# 가드레일(GuardRail) — AI 금융 비서를 위한 안전필터 (2026 금융 AI Challenge MVP)

Next.js 16 · TypeScript · 서버 API 1개(`/api/llm`) · DB 없음(브라우저 localStorage)

## 1. 로컬 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

## 2. Vercel 배포 (GitHub 없이, CLI로 5~10분)

1. `npm i -g vercel`
2. 프로젝트 폴더에서 `vercel login` (이메일 인증)
3. `vercel --prod` → 질문은 모두 Enter(기본값). 완료 시 `https://<프로젝트명>.vercel.app` URL 출력 → **이 URL을 제출**
4. (선택) 생성형 AI 연결: Vercel 대시보드 → Project → Settings → Environment Variables 에 아래 중 하나 추가 후 `vercel --prod` 재실행
   - `OPENAI_API_KEY` (선택: `OPENAI_MODEL`, 기본 gpt-4o-mini)
   - `ANTHROPIC_API_KEY` (선택: `ANTHROPIC_MODEL`, 기본 claude-sonnet-4-5)
   - 키가 없으면 상단에 "AI: 규칙 폴백"으로 표시되며 모든 기능은 규칙 기반으로 동일하게 동작
5. 배포 후 확인: `/`, `/app`, `/guardian`, `/redteam`, `/about` 접속, 시나리오 ①~⑥ 실행

## 3. 구조

```
src/lib/types.ts      도메인 타입
src/lib/defaults.ts   안전 집합 기본값, 합성 데이터, 심사용 시나리오
src/lib/filter.ts     결정론적 안전필터 (h_i ≥ 0 제약, 최소 개입 투영)
src/lib/rules.ts      규칙 기반 폴백: 의도 파싱, 위협 판정, 설명, 레드팀 코퍼스
src/lib/store.tsx     클라이언트 상태(localStorage) + 감사로그
src/app/api/llm/route.ts  생성형 AI 게이트웨이(parse/threat/explain/redteam/report) + 폴백
src/app/app/          어르신 앱(채팅·음성·시나리오)
src/app/guardian/     보호자 대시보드(안전 집합·승인·긴급 정지·감사로그·리포트)
src/app/redteam/      레드팀 자가 시험
src/app/about/        원리·정책 정합성
```

## 4. 안전 집합 기본 파라미터

| 항목 | 기본값 |
|---|---|
| 1회 한도 | 500,000원 |
| 일 한도 | 1,500,000원 |
| 월 한도 | 3,000,000원 |
| 신규 수취인 즉시 상한 | 500,000원 (초과분 24시간 지연이체) |
| 거래 시간대 | 제한 없음(0–24시, 보호자 조정) |
| 금지 유형 | 해외송금, 고위험 투자 |
| 위협 임계 | 승인 대기 ≥ 0.35, 차단 ≥ 0.60 |
