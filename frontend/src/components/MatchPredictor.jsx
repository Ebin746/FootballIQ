import { useEffect, useState } from "react";
import { getTeams, predictMatch } from "../api.js";

export default function MatchPredictor() {
  const [teams, setTeams] = useState([]);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [neutral, setNeutral] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function handlePredict() {
    setError("");
    if (homeTeam === awayTeam) {
      setError("Pick two different teams.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await predictMatch({ homeTeam, awayTeam, neutral });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const homeIsWinner =
    result &&
    result.home_win_pct > result.away_win_pct &&
    result.home_win_pct > result.draw_pct;
  const awayIsWinner =
    result &&
    result.away_win_pct > result.home_win_pct &&
    result.away_win_pct > result.draw_pct;

  /* ── Shared input style ──────────────────────────────────────── */
  const inputCls =
    "w-full bg-bg-elevated border border-line text-ivory font-body text-[15px] px-3 py-[11px] rounded-lg outline-none focus:border-gold transition-colors duration-150";

  return (
    /* ── Card ───────────────────────────────────────────────────── */
    <div className="bg-bg-card border border-line rounded-2xl p-7">
      <h2 className="font-display uppercase tracking-[0.03em] text-[18px] m-0 mb-1 text-ivory">
        Match Predictor
      </h2>
      <p className="text-muted text-[14px] mt-0 mb-[22px]">
        Pick two squads and see the model's call.
      </p>

      {/* ── Team picker row ───────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3.5 items-end">
        {/* Home */}
        <div>
          <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
            Home
          </label>
          <select
            className={inputCls}
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* VS badge */}
        <div className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-gold-soft mb-1">
          <span className="font-display font-bold text-[13px] text-gold">VS</span>
        </div>

        {/* Away */}
        <div>
          <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
            Away
          </label>
          <select
            className={inputCls}
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Neutral venue toggle ──────────────────────────────── */}
      <label className="flex items-center gap-2 mt-[18px] font-mono text-[12px] text-muted uppercase tracking-[0.06em] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={neutral}
          onChange={(e) => setNeutral(e.target.checked)}
          className="accent-gold w-4 h-4 rounded"
        />
        Neutral venue (no home advantage)
      </label>

      {/* ── Predict button ────────────────────────────────────── */}
      <button
        className="mt-5 font-display font-semibold tracking-[0.03em] uppercase text-[14px] bg-gold text-bg border-none px-[26px] py-[13px] rounded-lg cursor-pointer transition-all duration-150 hover:brightness-110 disabled:opacity-50 disabled:cursor-default"
        onClick={handlePredict}
        disabled={loading || !homeTeam}
      >
        {loading ? "Simulating..." : "Predict Match"}
      </button>

      {/* ── Status messages ───────────────────────────────────── */}
      {error && (
        <div className="text-coral font-mono text-[13px] mt-3">{error}</div>
      )}
      {loading && (
        <div className="text-muted font-mono text-[13px] mt-[18px]">
          Running model inference...
        </div>
      )}

      {/* ── Result scoreboard ─────────────────────────────────── */}
      {result && (
        <>
          <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {/* Home team */}
            <div className="text-center">
              <div className="font-display uppercase text-[15px] tracking-[0.02em] mb-2.5 min-h-[38px] flex items-center justify-center">
                {result.home_team}
              </div>
              <div
                className={`font-mono font-bold text-[38px] leading-none ${
                  homeIsWinner ? "text-gold" : "text-ivory"
                }`}
              >
                {result.home_win_pct.toFixed(0)}%
              </div>
            </div>

            {/* Draw */}
            <div className="text-center pt-7">
              <div className="font-mono font-bold text-[22px] text-muted">
                {result.draw_pct.toFixed(0)}%
              </div>
            </div>

            {/* Away team */}
            <div className="text-center">
              <div className="font-display uppercase text-[15px] tracking-[0.02em] mb-2.5 min-h-[38px] flex items-center justify-center">
                {result.away_team}
              </div>
              <div
                className={`font-mono font-bold text-[38px] leading-none ${
                  awayIsWinner ? "text-gold" : "text-ivory"
                }`}
              >
                {result.away_win_pct.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Outcome banner */}
          <div className="mt-[22px] text-center font-mono text-[13px] tracking-[0.06em] uppercase text-gold border-t border-dashed border-line pt-4">
            Model favours — {result.predicted_outcome}
          </div>
        </>
      )}
    </div>
  );
}
