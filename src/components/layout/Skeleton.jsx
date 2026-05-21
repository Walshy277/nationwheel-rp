export function Skeleton({ width = "100%", height = 16, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: 4,
      background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 100%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }} />
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div style={{ padding: "1.25rem", borderRadius: 8, border: "1px solid rgba(78,128,190,0.2)", background: "rgba(255,255,255,0.025)" }}>
      <Skeleton width="60%" height={18} style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${70 + Math.random() * 30}%`} height={12} style={{ marginBottom: 8 }} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: 12 }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${80 / cols}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}
