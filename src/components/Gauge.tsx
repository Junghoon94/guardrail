export default function Gauge({ label, used, limit, unit = "원" }: { label: string; used: number; limit: number; unit?: string }) {
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const cls = ratio >= 0.9 ? "danger" : ratio >= 0.6 ? "warn" : "";
  return (
    <div className="gauge">
      <div className="gauge-label">
        <span>{label}</span>
        <b>
          {used.toLocaleString()} / {limit.toLocaleString()}
          {unit}
        </b>
      </div>
      <div className="gauge-bar">
        <div className={`gauge-fill ${cls}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="small muted">
        여유 h = {(limit - used).toLocaleString()}
        {unit} {ratio >= 1 ? "· 한도 도달" : ""}
      </div>
    </div>
  );
}
