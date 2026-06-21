import { useState } from "react";
import MatchPredictor from "./components/MatchPredictor.jsx";
import WorldCupPredictor from "./components/WorldCupPredictor.jsx";

/* ── Inline Trophy SVG ────────────────────────────────────────────────── */
function TrophyIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 34c-6.627 0-12-5.373-12-12V8h24v14c0 6.627-5.373 12-12 12z"
        fill="#f5c518" opacity=".9"
      />
      <path d="M12 8H6a6 6 0 0 0 6 6V8zm24 0h6a6 6 0 0 1-6 6V8z" fill="#c89a12" />
      <rect x="18" y="34" width="12" height="4" rx="2" fill="#c89a12" />
      <rect x="14" y="38" width="20" height="3" rx="1.5" fill="#f5c518" />
      <circle cx="24" cy="20" r="4" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

const TABS = [
  { key: "match",    label: "Match Predictor",     icon: "⚽" },
  { key: "worldcup", label: "World Cup Simulator",  icon: "🏆" },
];

export default function App() {
  const [tab, setTab] = useState("match");

  return (
    <>
      {/* ── Ambient radial glow behind header ─────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 400,
          background: "radial-gradient(ellipse at 50% 0%, rgba(245,197,24,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ══ HEADER ═══════════════════════════════════════════════════ */}
      <header className="relative z-10 mb-10">
        {/* Top eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted opacity-80">
            Powered by XGBoost · Elo + Form
          </span>
        </div>

        {/* Main title row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="animate-float">
              <TrophyIcon size={44} />
            </div>
            <div>
              <h1 className="font-display font-bold text-[38px] sm:text-[48px] m-0 leading-none uppercase shimmer-text tracking-wider">
                World Cup 2026
              </h1>
              <p className="font-mono text-[12px] text-muted mt-1 tracking-[0.08em] uppercase">
                AI Match &amp; Tournament Predictor
              </p>
            </div>
          </div>

          {/* Live model badge */}
          <div
            className="hidden sm:flex items-center gap-2 glass-card px-4 py-2"
            style={{ borderRadius: 999 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#00c896",
                animation: "pulse-ring 1.8s ease-out infinite",
                display: "inline-block",
              }}
            />
            <span className="font-mono text-[11px] text-emerald tracking-widest uppercase">
              Model live
            </span>
          </div>
        </div>

        {/* Divider */}
        <div
          className="mt-6"
          style={{
            height: 1,
            background: "linear-gradient(to right, transparent, rgba(245,197,24,0.4), transparent)",
          }}
        />
      </header>

      {/* ══ TAB BAR ══════════════════════════════════════════════════ */}
      <nav className="flex flex-col sm:flex-row gap-3 mb-8 relative z-10" role="tablist">
        {TABS.map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              id={`tab-${key}`}
              onClick={() => setTab(key)}
              className="relative font-display font-semibold text-[13px] uppercase tracking-[0.06em] px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer border"
              style={{
                background: active
                  ? "linear-gradient(135deg,rgba(245,197,24,0.18) 0%,rgba(200,154,18,0.12) 100%)"
                  : "rgba(13,27,46,0.5)",
                borderColor: active ? "rgba(245,197,24,0.45)" : "rgba(245,197,24,0.1)",
                color: active ? "#f5c518" : "#8ba3c2",
                boxShadow: active ? "0 0 18px rgba(245,197,24,0.15)" : "none",
              }}
            >
              <span className="mr-2">{icon}</span>
              {label}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "20%",
                    right: "20%",
                    height: 2,
                    background: "linear-gradient(to right, transparent, #f5c518, transparent)",
                    borderRadius: 99,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ══ PANEL ════════════════════════════════════════════════════ */}
      <main role="tabpanel" aria-labelledby={`tab-${tab}`} className="relative z-10">
        {tab === "match" ? <MatchPredictor /> : <WorldCupPredictor />}
      </main>

      {/* ══ FOOTER ═══════════════════════════════════════════════════ */}
      <footer className="mt-16 text-center relative z-10">
        <p className="font-mono text-[11px] text-muted tracking-[0.05em] opacity-60">
          ⚽ Predictions are ML-simulated estimates — not betting advice.
        </p>
      </footer>
    </>
  );
}
