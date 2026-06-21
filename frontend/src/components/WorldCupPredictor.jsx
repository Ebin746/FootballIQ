import { useState } from "react";
import { predictWorldCup } from "../api.js";
import { isoCode } from "../utils/flags.js";
import TournamentBracket from "./TournamentBracket.jsx";

/* Inline flag image from flagcdn.com */
function FlagImg({ team, size = 28 }) {
  const iso = isoCode(team);
  if (!iso) return <span style={{ opacity: 0.4 }}>🏳</span>;
  return (
    <img
      src={`https://flagcdn.com/w80/${iso.toLowerCase()}.png`}
      alt={team || ""}
      width={size * 1.5}
      height={size}
      style={{ objectFit: "cover", borderRadius: 4, boxShadow: "0 2px 6px rgba(0,0,0,0.4)", flexShrink: 0 }}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

/* ── Animated football loading indicator ─────────────────────────────── */
function FootballLoader({ n }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <span
        className="animate-bounce-ball text-[2.5rem] inline-block"
        style={{ display: "inline-block" }}
      >
        ⚽
      </span>
      <div className="font-mono text-[13px] text-muted tracking-wide text-center">
        Playing out <span className="text-gold font-bold">{n}</span> tournaments…
        <br />
        <span className="text-[11px] opacity-60">this may take a moment for large counts</span>
      </div>
    </div>
  );
}

/* ── Top-10 compact leaderboard (shown below bracket) ────────────────── */
function Leaderboard({ results }) {
  const maxPct = results[0]?.win_pct || 1;
  return (
    <div>
      <div className="mb-3">
        <h3 className="font-display uppercase text-[14px] tracking-widest text-muted m-0">
          Full Standings — All Teams
        </h3>
      </div>
      <div className="flex flex-col gap-0.5">
        {results.map((r, i) => {
          const isGold   = i === 0;
          const isSilver = i === 1;
          const isBronze = i === 2;
          const medalColor = isGold ? "#f5c518" : isSilver ? "#b0bec5" : isBronze ? "#cd7f32" : "#8ba3c2";

          return (
            <div
              key={r.team}
              className="grid items-center gap-2 sm:gap-3 px-1 sm:px-2 py-2 sm:py-2.5 rounded-lg transition-all grid-cols-[24px_28px_1fr_48px] sm:grid-cols-[28px_32px_1fr_56px_140px]"
              style={{
                background: isGold ? "rgba(245,197,24,0.05)" : "transparent",
                borderBottom: "1px solid rgba(245,197,24,0.07)",
                animation: `reveal-up 0.4s ${i * 40}ms ease-out both`,
              }}
            >
              {/* Rank number */}
              <div
                className="font-mono text-[12px] text-center"
                style={{ color: medalColor }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>

              {/* Flag */}
              <div className="text-center" style={{ fontSize: "1.3rem", lineHeight: 1 }}>
              <FlagImg team={r.team} size={20} />
              </div>

              {/* Team name */}
              <div
                className="font-display uppercase text-[13px] tracking-wide overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ color: isGold ? "#f5c518" : "#e8edf5" }}
              >
                {r.team}
              </div>

              {/* Percentage */}
              <div
                className="font-mono font-bold text-[13px] text-right"
                style={{ color: medalColor }}
              >
                {r.win_pct.toFixed(1)}%
              </div>

              {/* Bar */}
              <div
                className="hidden sm:block"
                style={{
                  height: 5,
                  background: "rgba(13,27,46,0.8)",
                  borderRadius: 99,
                  overflow: "hidden",
                  border: "1px solid rgba(245,197,24,0.08)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(r.win_pct / maxPct) * 100}%`,
                    borderRadius: 99,
                    background: isGold
                      ? "linear-gradient(to right,#c89a12,#f5c518)"
                      : "rgba(139,163,194,0.5)",
                    transition: `width 1s ${i * 50}ms cubic-bezier(0.22,1,0.36,1)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════════════════ */
export default function WorldCupPredictor() {
  const [nSimulations, setNSimulations] = useState(200);
  const [results,      setResults]      = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  async function handleRun() {
    setError("");
    setLoading(true);
    setResults(null);
    try {
      const data = await predictWorldCup({ nSimulations });
      setResults(data.results);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const champion = results?.[0];

  return (
    <div className="flex flex-col gap-6">

      {/* ══ Setup card ═════════════════════════════════════════════════ */}
      <div className="glass-card p-5 sm:p-9">
        {/* Header */}
        <div className="mb-7">
          <h2 className="font-display uppercase text-[22px] tracking-widest m-0 text-ivory">
            🏆 World Cup Simulator
          </h2>
          <p className="text-muted text-[13px] mt-1.5 m-0 font-mono tracking-wide">
            Full group stage + knockout bracket — repeated N times.
          </p>
          <div
            style={{
              height: 1,
              background: "linear-gradient(to right, rgba(245,197,24,0.25), transparent)",
              marginTop: 16,
            }}
          />
        </div>

        {/* Simulations input */}
        <div className="flex flex-col gap-2 max-w-[240px] mb-6">
          <label className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
            Number of simulations
          </label>
          <div className="relative">
            <input
              type="number"
              min={10}
              max={2000}
              step={10}
              value={nSimulations}
              onChange={(e) => setNSimulations(Number(e.target.value))}
              className="wc-input w-full px-4 py-3 text-[15px] font-mono pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted">
              runs
            </span>
          </div>
          {/* Quick presets */}
          <div className="flex gap-2 flex-wrap mt-1">
            {[100, 200, 500, 1000].map((n) => (
              <button
                key={n}
                onClick={() => setNSimulations(n)}
                className="font-mono text-[11px] px-3 py-1 rounded-full border transition-all cursor-pointer"
                style={{
                  borderColor: nSimulations === n ? "#f5c518" : "rgba(245,197,24,0.2)",
                  color:       nSimulations === n ? "#f5c518" : "#8ba3c2",
                  background:  nSimulations === n ? "rgba(245,197,24,0.1)" : "transparent",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Run button */}
        <button
          id="run-tournament-btn"
          className="btn-gold px-8 py-4 text-[15px] rounded-xl"
          onClick={handleRun}
          disabled={loading}
          style={{ position: "relative", overflow: "hidden", display: "block" }}
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <span className="animate-bounce-ball inline-block">⚽</span>
              Simulating…
            </span>
          ) : (
            "▶  Run Tournament"
          )}
          {!loading && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(120deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2.5s linear infinite",
                borderRadius: "inherit",
              }}
            />
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 font-mono text-[13px] text-coral flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Loading state */}
        {loading && <FootballLoader n={nSimulations} />}
      </div>

      {/* ══ Champion banner (if results ready) ═══════════════════════ */}
      {champion && !loading && (
        <div
          className="glass-card p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left"
          style={{
            border: "1px solid rgba(245,197,24,0.45)",
            boxShadow: "0 0 40px rgba(245,197,24,0.12)",
            animation: "reveal-up 0.5s ease-out both",
          }}
        >
          <div className="animate-float">
            <FlagImg team={champion.team} size={42} />
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted mb-1">
              Predicted Champion
            </div>
            <div className="font-display font-bold text-[24px] sm:text-[28px] uppercase tracking-widest shimmer-text">
              {champion.team}
            </div>
            <div className="font-mono text-[12px] sm:text-[13px] text-muted mt-1">
              Won <span className="text-gold font-bold">{champion.win_pct.toFixed(1)}%</span> of {nSimulations} simulated tournaments
            </div>
          </div>
          <div className="sm:ml-auto text-[2.5rem] sm:text-[3rem] animate-float" style={{ animationDelay: "0.3s" }}>
            🏆
          </div>
        </div>
      )}

      {/* ══ Tournament Bracket ═══════════════════════════════════════ */}
      {results && !loading && (
        <div
          className="glass-card p-6 sm:p-8 overflow-x-auto"
          style={{ animation: "reveal-up 0.5s 0.15s ease-out both" }}
        >
          <TournamentBracket results={results} />
        </div>
      )}

      {/* ══ Full Leaderboard ═════════════════════════════════════════ */}
      {results && !loading && (
        <div
          className="glass-card p-6 sm:p-8"
          style={{ animation: "reveal-up 0.5s 0.3s ease-out both" }}
        >
          <Leaderboard results={results.slice(0, 10)} />
        </div>
      )}
    </div>
  );
}
