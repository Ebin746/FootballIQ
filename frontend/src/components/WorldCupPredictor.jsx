import { useState } from "react";
import { predictWorldCup } from "../api.js";

export default function WorldCupPredictor() {
  const [nSimulations, setNSimulations] = useState(200);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRun() {
    setError("");
    setLoading(true);
    setResults(null);
    try {
      const data = await predictWorldCup({ nSimulations });
      setResults(data.results.slice(0, 10));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const maxPct = results && results.length ? results[0].win_pct : 0;

  return (
    /* ── Card ───────────────────────────────────────────────────── */
    <div className="bg-bg-card border border-line rounded-2xl p-7">
      <h2 className="font-display uppercase tracking-[0.03em] text-[18px] m-0 mb-1 text-ivory">
        World Cup Winner
      </h2>
      <p className="text-muted text-[14px] mt-0 mb-[22px]">
        Runs the full group stage + knockout bracket repeatedly and tallies how
        often each team lifts the trophy.
      </p>

      {/* ── Simulation count ──────────────────────────────────── */}
      <div className="max-w-[220px]">
        <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
          Simulations
        </label>
        <input
          type="number"
          min={10}
          max={2000}
          step={10}
          value={nSimulations}
          onChange={(e) => setNSimulations(Number(e.target.value))}
          className="w-full bg-bg-elevated border border-line text-ivory font-body text-[15px] px-3 py-[11px] rounded-lg outline-none focus:border-gold transition-colors duration-150"
        />
      </div>

      {/* ── Run button ────────────────────────────────────────── */}
      <button
        className="mt-5 font-display font-semibold tracking-[0.03em] uppercase text-[14px] bg-gold text-bg border-none px-[26px] py-[13px] rounded-lg cursor-pointer transition-all duration-150 hover:brightness-110 disabled:opacity-50 disabled:cursor-default"
        onClick={handleRun}
        disabled={loading}
      >
        {loading ? "Simulating tournament..." : "Run Tournament Sims"}
      </button>

      {/* ── Status messages ───────────────────────────────────── */}
      {error && (
        <div className="text-coral font-mono text-[13px] mt-3">{error}</div>
      )}
      {loading && (
        <div className="text-muted font-mono text-[13px] mt-[18px]">
          Playing out {nSimulations} tournaments — this can take a moment for
          large counts.
        </div>
      )}

      {/* ── Leaderboard ───────────────────────────────────────── */}
      {results && (
        <div className="mt-6 flex flex-col gap-0.5">
          {results.map((r, i) => {
            const isFirst = i === 0;
            return (
              <div
                key={r.team}
                className="grid grid-cols-[32px_1fr_auto_120px] items-center gap-3.5 px-1 py-2.5 border-b border-line"
              >
                {/* Rank */}
                <div
                  className={`font-mono text-[13px] ${
                    isFirst ? "text-gold" : "text-muted"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>

                {/* Team name */}
                <div
                  className={`font-display uppercase text-[15px] ${
                    isFirst ? "text-gold" : "text-ivory"
                  }`}
                >
                  {r.team}
                </div>

                {/* Win % value */}
                <div className="font-mono font-bold text-[14px] w-14 text-right text-ivory">
                  {r.win_pct.toFixed(1)}%
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-500"
                    style={{ width: `${(r.win_pct / maxPct) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
