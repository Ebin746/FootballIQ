import { useMemo, useState, useEffect } from "react";
import { isoCode } from "../utils/flags.js";

function FlagImg({ team, size = 16 }) {
  const iso = isoCode(team);
  if (!iso) return <span style={{ opacity: 0.4, fontSize: size }}>🏳</span>;
  return (
    <img
      src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
      alt={team || ""}
      width={size * 1.4}
      height={size}
      style={{ objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

const COLORS = [
  "#f5c518", // Gold
  "#00c896", // Emerald
  "#0ea5e9", // Light blue
  "#a78bfa", // Purple
  "#f97316", // Orange
  "#e63946", // Red
  "#14b8a6", // Teal
  "#84cc16", // Lime
  "#3b82f6", // Blue
  "#ec4899"  // Pink
];

export default function WinProbabilityChart({ results }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 50);
    return () => clearTimeout(t);
  }, []);

  const chartData = useMemo(() => {
    const top10 = results.slice(0, 10);
    const totalTop10Pct = top10.reduce((sum, r) => sum + r.win_pct, 0);
    const othersPct = Math.max(0, 100 - totalTop10Pct);
    
    const data = [...top10];
    if (othersPct > 0.5) {
      data.push({ team: "Others", win_pct: othersPct });
    }
    return data;
  }, [results]);

  // SVG dimensions
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;
  const strokeWidth = 45;
  const circumference = 2 * Math.PI * radius;

  // Build slices
  let cumulativeOffset = 0;
  const slices = chartData.map((d, i) => {
    const fraction = d.win_pct / 100;
    const dashLength = fraction * circumference;
    const dashoffset = -cumulativeOffset; 
    cumulativeOffset += dashLength;
    
    const color = d.team === "Others" ? "#334155" : COLORS[i % COLORS.length];

    return { ...d, color, dashLength, dashoffset };
  });

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-display uppercase text-[16px] tracking-widest text-muted m-0">
          Tournament Win Probability
        </h3>
        <p className="font-mono text-[11px] text-muted opacity-60 mt-1 m-0">
          Distribution of simulated championships
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
        {/* ── Chart ────────────────────────── */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
            {/* Background track */}
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(245,197,24,0.03)" strokeWidth={strokeWidth} />
            
            {/* Slices */}
            {slices.map((slice, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <circle
                  key={slice.team}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 8 : strokeWidth}
                  strokeDasharray={`${drawn ? Math.max(0, slice.dashLength - 1.5) : 0} ${circumference}`}
                  strokeDashoffset={slice.dashoffset}
                  strokeLinecap="round"
                  style={{ 
                    transition: "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1), stroke-width 0.2s, opacity 0.2s", 
                    cursor: "pointer",
                    opacity: hoveredIndex === null || isHovered ? 1 : 0.3
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ transform: 'rotate(0deg)' }}>
            {hoveredIndex !== null ? (
              <div className="animate-reveal-up flex flex-col items-center">
                <div className="text-ivory font-display uppercase tracking-wider text-[15px] px-6 text-center leading-snug">
                  {slices[hoveredIndex].team}
                </div>
                <div className="text-gold font-mono font-bold text-[24px] mt-1" style={{ color: slices[hoveredIndex].color }}>
                  {slices[hoveredIndex].win_pct.toFixed(1)}%
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-70 transition-opacity">
                <div className="text-muted font-mono uppercase tracking-widest text-[10px]">
                  Simulated
                </div>
                <div className="text-ivory font-display uppercase text-[15px] tracking-[0.2em] mt-0.5">
                  Winners
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Legend ────────────────────────── */}
        <div 
          className="flex flex-col gap-1.5 p-5 rounded-xl w-full sm:w-[260px]"
          style={{ background: "rgba(13,27,46,0.5)", border: "1px solid rgba(245,197,24,0.1)" }}
        >
          {slices.map((slice, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <div 
                key={slice.team} 
                className="flex items-center gap-3 py-2 cursor-pointer rounded-md px-3 -mx-3 transition-colors"
                style={{ background: isHovered ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: slice.color, flexShrink: 0, boxShadow: `0 0 8px ${slice.color}66` }} />
                {slice.team !== "Others" && <FlagImg team={slice.team} size={16} />}
                <span className="font-display uppercase text-[12px] text-ivory flex-1 truncate opacity-90">
                  {slice.team}
                </span>
                <span className="font-mono text-[12px] font-bold" style={{ color: slice.color }}>
                  {slice.win_pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
