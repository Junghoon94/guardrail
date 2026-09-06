export default function About() {
  return (
    <main className="container">
      <div className="eyebrow">원리 · 정책 정합성</div>
      <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 18 }}>AI는 제안, 필터는 보장, 사람은 규칙의 주인</h2>

      <div className="grid grid-2">
        <div className="card">
          <h3>파이프라인</h3>
          <svg viewBox="0 0 640 260" className="diagram" role="img" aria-label="가드레일 파이프라인 다이어그램">
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#5d6b82" />
              </marker>
            </defs>
            {[
              { x: 10, label: "사용자 지시\n+ 외부 콘텐츠", sub: "음성·채팅·붙여넣기", c: "#eef2f8" },
              { x: 140, label: "생성형 AI\n의도 파싱", sub: "JSON 제안", c: "#e8effb" },
              { x: 270, label: "생성형 AI\n위협 판정", sub: "점수 0–1", c: "#e8effb" },
              { x: 400, label: "안전필터\n(결정론)", sub: "h(x) ≥ 0 · 투영", c: "#e6f6ec" },
              { x: 530, label: "실행 / 지연\n승인 / 차단", sub: "감사로그", c: "#eef2f8" },
            ].map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={60} width={100} height={78} rx={12} fill={b.c} stroke="#dfe5ee" />
                {b.label.split("\n").map((l, j) => (
                  <text key={j} x={b.x + 50} y={86 + j * 18} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#16213a">
                    {l}
                  </text>
                ))}
                <text x={b.x + 50} y={128} textAnchor="middle" fontSize="10.5" fill="#5d6b82">
                  {b.sub}
                </text>
                {i < 4 && <line x1={b.x + 100} y1={99} x2={b.x + 130} y2={99} stroke="#5d6b82" strokeWidth="1.5" markerEnd="url(#arr)" />}
              </g>
            ))}
            <rect x={140} y={10} width={230} height={28} rx={8} fill="#fff4e0" stroke="#e4c27a" />
            <text x={255} y={29} textAnchor="middle" fontSize="11.5" fill="#6b4e00" fontWeight="700">
              외부 콘텐츠는 데이터 — 실행 권한 없음
            </text>
            <rect x={400} y={160} width={230} height={86} rx={10} fill="#fff" stroke="#dfe5ee" />
            <text x={412} y={182} fontSize="11.5" fontWeight="700" fill="#16213a">
              제약 예시 (여유 h ≥ 0)
            </text>
            <text x={412} y={200} fontSize="11" fill="#5d6b82">
              h₁ = 1회한도 − 금액 · h₂ = 일한도 − (누적+금액)
            </text>
            <text x={412} y={216} fontSize="11" fill="#5d6b82">
              h₃ = 신규수취인 즉시상한 − 금액 · h₄ = 임계 − 위협점수
            </text>
            <text x={412} y={232} fontSize="11" fill="#5d6b82">
              투영: u* = argmin |u − u_agent| s.t. h_i(u) ≥ 0
            </text>
            <rect x={10} y={160} width={370} height={86} rx={10} fill="#fff" stroke="#dfe5ee" />
            <text x={22} y={182} fontSize="11.5" fontWeight="700" fill="#16213a">
              보호자 (규칙의 주인)
            </text>
            <text x={22} y={200} fontSize="11" fill="#5d6b82">
              안전 집합 설정 · 승인/거절 · 긴급 정지 · 알림 · 리포트
            </text>
            <text x={22} y={216} fontSize="11" fill="#5d6b82">
              규칙은 AI가 아니라 가족이 정한다. LLM이 속아도 울타리는 그대로.
            </text>
            <text x={22} y={232} fontSize="11" fill="#5d6b82">
              모든 판정·근거는 감사로그로 남아 분쟁·감독 대응에 사용.
            </text>
          </svg>
        </div>

        <div className="card">
          <h3>드론 안전필터에서 금융 안전필터로</h3>
          <p className="muted" style={{ marginBottom: 10 }}>
            드론 착륙 제어에서는 학습 기반 조종기가 어떤 명령을 내려도 기체가 안전 집합(장애물·속도·자세 한계)을 벗어나지 않도록, 명령을 최소한으로 수정하는 안전필터(Control Barrier Function, CBF)를 둡니다. 가드레일은 같은 구조를 금융 에이전트에 적용합니다.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>드론 안전필터</th>
                  <th>가드레일</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>학습 기반 조종기(불확실·조작 가능)</td>
                  <td>LLM 에이전트(확률적·인젝션 가능)</td>
                </tr>
                <tr>
                  <td>안전 집합: 장애물 거리, 속도·자세 한계</td>
                  <td>안전 집합: 한도, 화이트리스트, 쿨다운, 시간대, 금지 유형</td>
                </tr>
                <tr>
                  <td>h(x) ≥ 0 유지, 위반 직전 최소 수정</td>
                  <td>금액 축소·지연·승인으로 최소 개입 투영</td>
                </tr>
                <tr>
                  <td>외란(풍외란) 추정치 반영</td>
                  <td>위협 점수(사회공학·인젝션)를 제약에 반영</td>
                </tr>
                <tr>
                  <td>비상 정지·복귀</td>
                  <td>긴급 정지(Kill Switch)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>금융위원회 「금융분야 AI 가이드라인」(2026.6 개정) 7원칙과의 대응</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>원칙</th>
                <th>가드레일에서의 구현</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>보조수단성 — AI는 보조, 최종 결정·책임은 사람</td>
                <td>에이전트는 제안만 생성. 실행 여부는 사람이 정한 안전 집합과 보호자 승인이 결정</td>
              </tr>
              <tr>
                <td>보안성 — 지속 점검·개선 체계</td>
                <td>레드팀 자가 시험으로 공격 통과율을 상시 측정, 외부 콘텐츠를 데이터로 격리해 인젝션 방어</td>
              </tr>
              <tr>
                <td>신의성실 — 소비자 이익 최우선</td>
                <td>최소 개입 원칙: 편의를 최대한 유지하면서 안전 집합 이탈만 차단, 고령자 눈높이 설명 제공</td>
              </tr>
              <tr>
                <td>신뢰성 — 신뢰 가능한 데이터·모델</td>
                <td>LLM 출력은 스키마 검증 후에만 필터에 전달, 위협 점수는 규칙과 LLM 중 보수적인 값을 채택</td>
              </tr>
              <tr>
                <td>거버넌스 · 합법성</td>
                <td>모든 제안·판정·근거의 감사로그, 규칙 변경 이력 기록</td>
              </tr>
              <tr>
                <td>금융안정성</td>
                <td>한도가 곧 최대 손실인 구조적 상한 — 대량 자동화 공격에도 피해 규모가 제한됨</td>
              </tr>
              <tr>
                <td>긴급 정지 기능</td>
                <td>소비자·보호자 1탭 Kill Switch, 즉시 모든 에이전트 행동 BLOCK</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <h3>생성형 AI의 다섯 가지 역할</h3>
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }} className="muted">
            <li>의도 파싱: 자연어·음성 → 구조화 거래(수취인·금액·유형·긴급도)</li>
            <li>위협 판정: 붙여넣은 문자·메일의 사회공학·인젝션 여부와 근거, 위험 점수</li>
            <li>쉬운 설명: 필터 판정 이유를 70대 사용자 눈높이로, 행동요령(112·1332·지급정지) 포함</li>
            <li>보호자 리포트: 활동·개입 내역 요약과 권고</li>
            <li>레드팀 시뮬레이터: 공격 시나리오를 생성해 필터를 자동 시험</li>
          </ol>
          <p className="small muted" style={{ marginTop: 10 }}>
            LLM 연결이 없거나 장애일 때는 규칙 기반 폴백이 동일한 인터페이스로 동작합니다(상단 “AI” 표시 참고). 안전 판정은 어떤 경우에도 LLM에 위임되지 않습니다.
          </p>
        </div>
        <div className="card">
          <h3>MVP 범위와 제한사항</h3>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }} className="muted">
            <li>모든 계좌·거래·수취인은 합성 데이터이며 실제 금융거래는 발생하지 않습니다.</li>
            <li>상태는 브라우저 localStorage에 저장됩니다(심사자별 독립 세션, 초기화 가능).</li>
            <li>지연이체는 예약 표시만 하며 실제 시각 도달 시 자동 실행은 구현하지 않았습니다.</li>
            <li>음성 입력은 브라우저 Web Speech API에 의존합니다(Chrome 권장).</li>
            <li>실서비스 확장: 오픈뱅킹 API 연동, 서버 측 상태·인증, 실시간 통화(STT) 개입, 안전필터 API 공개.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
