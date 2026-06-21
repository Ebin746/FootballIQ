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
    <div className="card">
      <h2>World Cup Winner</h2>
      <p className="subtitle">
        Runs the full group stage + knockout bracket repeatedly and tallies how often each
        team lifts the trophy.
      </p>

      <div className="field" style={{ maxWidth: 220 }}>
        <label>Simulations</label>
        <input
          type="number"
          min={10}
          max={2000}
          step={10}
          value={nSimulations}
          onChange={(e) => setNSimulations(Number(e.target.value))}
        />
      </div>

      <button className="btn" onClick={handleRun} disabled={loading}>
        {loading ? "Simulating tournament..." : "Run Tournament Sims"}
      </button>

      {error && <div className="error-msg">{error}</div>}
      {loading && (
        <div className="loading-text">
          Playing out {nSimulations} tournaments — this can take a moment for large counts.
        </div>
      )}

      {results && (
        <div className="leaderboard">
          {results.map((r, i) => (
            <div key={r.team} className={`leaderboard-row ${i === 0 ? "rank-1" : ""}`}>
              <div className="rank">{String(i + 1).padStart(2, "0")}</div>
              <div className="team">{r.team}</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(r.win_pct / maxPct) * 100}%` }}
                />
              </div>
              <div className="pct-value">{r.win_pct.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
