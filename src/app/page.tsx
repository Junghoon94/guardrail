import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <div>
          <div className="eyebrow">2026 금융 AI Challenge · MVP</div>
          <h1 style={{ marginTop: 10 }}>
            AI가 내 돈을 대신 움직이는 시대,
            <br />
            <span>에이전트가 넘을 수 없는 울타리</span>
          </h1>
          <p className="lead">
            가드레일은 고령 소비자와 보호자가 함께 정한 <b>안전 집합</b> 안에서만 AI 금융 비서가 일하게 만드는 안전필터입니다. 생성형 AI는 편의를 맡고, 결정론적 필터가 안전을 보장하며, 사람은 규칙의 주인이 됩니다.
          </p>
          <div className="row">
            <Link href="/app" className="btn primary lg">
              어르신 앱 데모 시작
            </Link>
            <Link href="/guardian" className="btn lg">
              보호자 대시보드
            </Link>
            <Link href="/redteam" className="btn lg">
              레드팀 시험
            </Link>
          </div>
          <div className="grid grid-3" style={{ marginTop: 26 }}>
            <div className="stat">
              <b>0원</b>
              <span>한도·화이트리스트를 넘는 이체는 어떤 수법에도 발생하지 않음</span>
            </div>
            <div className="stat">
              <b>최소 개입</b>
              <span>차단 대신 가장 가까운 안전한 거래로 조정</span>
            </div>
            <div className="stat">
              <b>1탭 정지</b>
              <span>금융위 AI 가이드라인의 긴급 정지 기능을 소비자 수준에서 구현</span>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <h3>심사자 5분 검증 가이드</h3>
          <div className="steps">
            <div className="step">
              <div>
                <b>어르신 앱</b>에서 시나리오 ① “딸에게 30만원 보내줘” → 즉시 실행(ALLOW)과 잔액 변화를 확인합니다.
              </div>
            </div>
            <div className="step">
              <div>
                시나리오 ② 신규 수취인 80만원 → <b>50만원 즉시 + 30만원 지연이체</b>로 조정(PROJECT)되는 최소 개입을 확인합니다.
              </div>
            </div>
            <div className="step">
              <div>
                시나리오 ③ 검찰 사칭 문자 → 필터가 <b>차단(BLOCK)</b>하고, 필터 없는 에이전트라면 잔액 전부(2,000만원 요구)가 나갔을 것임을 비교 카드로 확인합니다.
              </div>
            </div>
            <div className="step">
              <div>
                <b>보호자 대시보드</b>에서 알림·승인 대기·감사로그를 확인하고, 한도 슬라이더를 바꾼 뒤 다시 시나리오를 실행해 필터가 즉시 반영되는지 봅니다. 긴급 정지를 켜면 모든 거래가 BLOCK 됩니다.
              </div>
            </div>
            <div className="step">
              <div>
                <b>레드팀 시험</b>에서 공격 10건을 생성·평가해 전액 통과 0건을 확인합니다. 생성형 AI 연결이 없어도 내장 코퍼스로 동일하게 동작합니다.
              </div>
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            데모 계정은 자동 로그인됩니다. 상태는 브라우저(localStorage)에만 저장되며 “데모 초기화”로 되돌릴 수 있습니다. Chrome·Edge·Safari 최신 버전 권장.
          </p>
        </div>
      </section>

      <section className="grid grid-3" style={{ marginTop: 10 }}>
        <div className="card">
          <h3>① 안전 집합 (Safe Set)</h3>
          <p className="muted">
            1회·일·월 한도, 수취인 화이트리스트, 신규 수취인 쿨다운, 거래 시간대, 금지 유형을 보호자와 소비자가 합의해 정합니다. 필터는 각 규칙을 여유 h(x) ≥ 0 형태로 감시합니다.
          </p>
        </div>
        <div className="card">
          <h3>② 최소 개입 필터</h3>
          <p className="muted">
            에이전트의 제안이 울타리를 벗어나면, 단순 차단이 아니라 가장 가까운 안전한 행동(금액 축소·지연이체·보호자 승인)으로 투영합니다. 드론·로봇의 안전필터(Control Barrier Function)와 같은 원리입니다.
          </p>
        </div>
        <div className="card">
          <h3>③ 위협 탐지 · 긴급 정지 · 감사로그</h3>
          <p className="muted">
            붙여넣은 문자·메일은 지시가 아닌 데이터로만 취급하고, 생성형 AI가 사회공학·프롬프트 인젝션 패턴을 점수화합니다. 모든 판정과 근거는 기록되고, 보호자는 1탭으로 정지할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h3>왜 지금인가</h3>
        <p className="muted">
          금융위원회는 2026년 6월 「금융분야 AI 가이드라인」을 개정해 상품 추천을 넘어 가입·결제까지 처리하는 AI 에이전트 확산에 대비하고, 보조수단성·보안성·긴급 정지 기능을 명시했습니다. 에이전트가 소비자 대신 돈을 움직이는 순간, 공격 대상은 사람에서 에이전트로 이동합니다. 가드레일은 그 전환기에 소비자 쪽에 서는 안전 계층입니다.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <Link href="/about" className="btn sm">
            원리와 정책 정합성 보기 →
          </Link>
        </div>
      </section>
    </main>
  );
}
