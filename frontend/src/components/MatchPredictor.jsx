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

  const homeIsWinner = result && result.home_win_pct > result.away_win_pct && result.home_win_pct > result.draw_pct;
  const awayIsWinner = result && result.away_win_pct > result.home_win_pct && result.away_win_pct > result.draw_pct;

  return (
    <div className="card">
      <h2>Match Predictor</h2>
      <p className="subtitle">Pick two squads and see the model's call.</p>

      <div className="field-row">
        <div className="field">
          <label>Home</label>
          <select value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="vs-badge">VS</div>

        <div className="field">
          <label>Away</label>
          <select value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 18,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <input
          type="checkbox"
          checked={neutral}
          onChange={(e) => setNeutral(e.target.checked)}
        />
        Neutral venue (no home advantage)
      </label>

      <button className="btn" onClick={handlePredict} disabled={loading || !homeTeam}>
        {loading ? "Simulating..." : "Predict Match"}
      </button>

      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading-text">Running model inference...</div>}

      {result && (
        <>
          <div className="scoreboard">
            <div className={`team-slot ${homeIsWinner ? "winner" : ""}`}>
              <div className="team-name">{result.home_team}</div>
              <div className="pct">{result.home_win_pct.toFixed(0)}%</div>
            </div>
            <div className="draw-slot">
              <div className="pct">{result.draw_pct.toFixed(0)}%</div>
            </div>
            <div className={`team-slot ${awayIsWinner ? "winner" : ""}`}>
              <div className="team-name">{result.away_team}</div>
              <div className="pct">{result.away_win_pct.toFixed(0)}%</div>
            </div>
          </div>
          <div className="outcome-banner">Model favours — {result.predicted_outcome}</div>
        </>
      )}
    </div>
  );
}
