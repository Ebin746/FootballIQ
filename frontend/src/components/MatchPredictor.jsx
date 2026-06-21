import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getTeams, predictMatch } from "../api.js";
import CountryWheel from "./CountryWheel.jsx";
import { flagEmoji } from "../utils/flags.js";

/* ══════════════════════════════════════════════════════════════════════════
   Confetti — pure-React/CSS, no library needed
   ══════════════════════════════════════════════════════════════════════════ */
const CONFETTI_COLORS = ["#f5c518", "#ffffff", "#00c896", "#e63946", "#a78bfa", "#f97316"];

function Confetti({ active }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 55 }, (_, i) => ({
        id: i,
        left:     Math.random() * 100,
        delay:    Math.random() * 1.4,
        duration: 2 + Math.random() * 2.2,
        size:     6 + Math.random() * 10,
        color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        isCircle: Math.random() > 0.45,
        sway:     (Math.random() - 0.5) * 180,
      })),
    []
  );

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: "-16px",
            left: `${p.left}%`,
            width:  p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : "2px",
            "--sway": `${p.sway}px`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   useCountUp — animates a number from 0 → target
   ══════════════════════════════════════════════════════════════════════════ */
function useCountUp(target, enabled, duration = 1100) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled) { setValue(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, enabled, duration]);

  return value;
}

/* ══════════════════════════════════════════════════════════════════════════
   AnimatedBar — grows from 0 to pct% with a CSS transition
   ══════════════════════════════════════════════════════════════════════════ */
function AnimatedBar({ pct, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div
      style={{
        height: 6,
        borderRadius: 99,
        background: "rgba(13,27,46,0.8)",
        overflow: "hidden",
        border: "1px solid rgba(245,197,24,0.1)",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          borderRadius: 99,
          background: color,
          transition: "width 1.1s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: `0 0 10px ${color}66`,
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ScoreStat — animated percentage number with label
   ══════════════════════════════════════════════════════════════════════════ */
function ScoreStat({ value: raw, label, color, isWinner, enabled }) {
  const count = useCountUp(raw, enabled);
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="font-mono font-bold"
        style={{
          fontSize: isWinner ? 48 : 36,
          lineHeight: 1,
          color,
          textShadow: isWinner ? `0 0 24px ${color}99` : "none",
          transition: "font-size 0.3s ease",
        }}
      >
        {count}%
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   VS Badge
   ══════════════════════════════════════════════════════════════════════════ */
function VsBadge() {
  return (
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(245,197,24,0.18), rgba(200,154,18,0.08))",
        border: "1px solid rgba(245,197,24,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Oswald", sans-serif',
        fontWeight: 700,
        fontSize: 13,
        color: "#f5c518",
        letterSpacing: "0.05em",
        flexShrink: 0,
        marginBottom: 8,
      }}
    >
      VS
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════════════════ */
export default function MatchPredictor() {
  const [teams,    setTeams]    = useState([]);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [neutral,  setNeutral]  = useState(true);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);

  useEffect(() => {
    getTeams()
      .then((data) => {
        setTeams(data.teams);
        if (data.teams.length > 1) {
          setHomeTeam(data.teams[0]);
          setAwayTeam(data.teams[1]);
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  const handlePredict = useCallback(async () => {
    if (homeTeam === awayTeam) { setError("Pick two different teams."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    setResultVisible(false);
    setShowConfetti(false);

    try {
      const data = await predictMatch({ homeTeam, awayTeam, neutral });
      setResult(data);
      // Stagger the reveal for drama
      setTimeout(() => {
        setResultVisible(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
      }, 200);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [homeTeam, awayTeam, neutral]);

  /* Derive winner */
  const homeIsWinner = result &&
    result.home_win_pct > result.away_win_pct &&
    result.home_win_pct > result.draw_pct;
  const awayIsWinner = result &&
    result.away_win_pct > result.home_win_pct &&
    result.away_win_pct > result.draw_pct;

  const homeColor    = homeIsWinner ? "#00c896" : "#e8edf5";
  const awayColor    = awayIsWinner ? "#00c896" : "#e8edf5";
  const drawColor    = "#8ba3c2";

  const totalPct = result
    ? result.home_win_pct + result.draw_pct + result.away_win_pct || 100
    : 100;

  return (
    <>
      <Confetti active={showConfetti} />

      {/* ══ CARD ══════════════════════════════════════════════════════ */}
      <div className="glass-card p-7 sm:p-9">

        {/* Card header */}
        <div className="mb-7">
          <h2 className="font-display uppercase text-[22px] tracking-widest m-0 text-ivory">
            ⚽ Match Predictor
          </h2>
          <p className="text-muted text-[13px] mt-1.5 m-0 font-mono tracking-wide">
            Select two squads — the model calls the odds.
          </p>
          <div style={{ height: 1, background: "linear-gradient(to right, rgba(245,197,24,0.25), transparent)", marginTop: 16 }} />
        </div>

        {/* ── Team picker ──────────────────────────────────────────── */}
        <div className="grid gap-3 items-center" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
          {/* Home dropdown */}
          <div
            className="glass-card p-4"
            style={{ borderColor: "rgba(245,197,24,0.2)" }}
          >
            <CountryWheel
              teams={teams}
              value={homeTeam}
              onChange={setHomeTeam}
              label="🏠 Home"
            />
          </div>

          {/* VS badge */}
          <div className="flex items-center justify-center">
            <VsBadge />
          </div>

          {/* Away dropdown */}
          <div
            className="glass-card p-4"
            style={{ borderColor: "rgba(245,197,24,0.2)" }}
          >
            <CountryWheel
              teams={teams}
              value={awayTeam}
              onChange={setAwayTeam}
              label="✈️ Away"
            />
          </div>
        </div>

        {/* ── Neutral venue toggle ─────────────────────────────────── */}
        <label
          className="flex items-center gap-3 mt-5 cursor-pointer select-none group"
          style={{ userSelect: "none" }}
        >
          <div
            onClick={() => setNeutral((v) => !v)}
            style={{
              width: 42,
              height: 24,
              borderRadius: 99,
              background: neutral
                ? "linear-gradient(135deg,#f5c518,#c89a12)"
                : "rgba(13,27,46,0.8)",
              border: "1px solid rgba(245,197,24,0.3)",
              position: "relative",
              transition: "background 0.25s",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: neutral ? 21 : 3,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: neutral ? "#050d1a" : "#8ba3c2",
                transition: "left 0.25s",
              }}
            />
          </div>
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-muted group-hover:text-ivory transition-colors">
            Neutral venue — no home advantage
          </span>
        </label>

        {/* ── Predict button ───────────────────────────────────────── */}
        <button
          id="predict-match-btn"
          className="btn-gold mt-6 w-full py-4 text-[15px] rounded-xl"
          onClick={handlePredict}
          disabled={loading || !homeTeam || !awayTeam}
          style={{ position: "relative", overflow: "hidden" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span
                className="animate-bounce-ball inline-block"
                style={{ fontSize: 18 }}
              >
                ⚽
              </span>
              Simulating…
            </span>
          ) : (
            "▶  Predict Match"
          )}
          {/* Shimmer overlay on button */}
          {!loading && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.5s linear infinite",
                borderRadius: "inherit",
              }}
            />
          )}
        </button>

        {/* ── Error message ────────────────────────────────────────── */}
        {error && (
          <div className="mt-4 font-mono text-[13px] text-coral flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        {/* ══ RESULT ════════════════════════════════════════════════ */}
        {result && (
          <div
            style={{
              opacity: resultVisible ? 1 : 0,
              transform: resultVisible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "linear-gradient(to right, transparent, rgba(245,197,24,0.3), transparent)",
                margin: "28px 0",
              }}
            />

            {/* ── Scoreboard ──────────────────────────────────────── */}
            <div
              className="grid gap-4 mb-5"
              style={{ gridTemplateColumns: "1fr 90px 1fr" }}
            >
              {/* Home team */}
              <div className="flex flex-col items-center gap-3 text-center">
                <span style={{ fontSize: "2.8rem", lineHeight: 1 }}>
                  {flagEmoji(result.home_team)}
                </span>
                <div className="font-display uppercase text-[13px] tracking-wider text-ivory leading-snug">
                  {result.home_team}
                  {homeIsWinner && (
                    <span className="ml-2 text-emerald text-[10px] tracking-widest">FAVOURED</span>
                  )}
                </div>
                <ScoreStat
                  value={result.home_win_pct}
                  label="Win"
                  color={homeColor}
                  isWinner={homeIsWinner}
                  enabled={resultVisible}
                />
                <AnimatedBar
                  pct={(result.home_win_pct / totalPct) * 100}
                  color={homeIsWinner ? "#00c896" : "#8ba3c2"}
                  delay={300}
                />
              </div>

              {/* Draw column */}
              <div className="flex flex-col items-center justify-center gap-2 text-center pt-6">
                <span className="font-display text-[11px] text-muted uppercase tracking-widest">Draw</span>
                <ScoreStat
                  value={result.draw_pct}
                  label=""
                  color={drawColor}
                  isWinner={false}
                  enabled={resultVisible}
                />
              </div>

              {/* Away team */}
              <div className="flex flex-col items-center gap-3 text-center">
                <span style={{ fontSize: "2.8rem", lineHeight: 1 }}>
                  {flagEmoji(result.away_team)}
                </span>
                <div className="font-display uppercase text-[13px] tracking-wider text-ivory leading-snug">
                  {result.away_team}
                  {awayIsWinner && (
                    <span className="ml-2 text-emerald text-[10px] tracking-widest">FAVOURED</span>
                  )}
                </div>
                <ScoreStat
                  value={result.away_win_pct}
                  label="Win"
                  color={awayColor}
                  isWinner={awayIsWinner}
                  enabled={resultVisible}
                />
                <AnimatedBar
                  pct={(result.away_win_pct / totalPct) * 100}
                  color={awayIsWinner ? "#00c896" : "#8ba3c2"}
                  delay={400}
                />
              </div>
            </div>

            {/* ── Outcome banner ────────────────────────────────────── */}
            <div
              className="text-center py-4 px-6 rounded-xl"
              style={{
                background: "linear-gradient(135deg,rgba(245,197,24,0.08),rgba(200,154,18,0.04))",
                border: "1px solid rgba(245,197,24,0.2)",
                animation: "reveal-up 0.5s 0.3s ease-out both",
              }}
            >
              <span className="font-display text-[14px] text-muted uppercase tracking-[0.1em]">
                Model verdict
              </span>
              <div className="font-display font-bold text-[20px] uppercase tracking-wider shimmer-text mt-1">
                🏆 {result.predicted_outcome}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
