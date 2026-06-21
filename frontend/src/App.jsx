import { useState } from "react";
import MatchPredictor from "./components/MatchPredictor.jsx";
import WorldCupPredictor from "./components/WorldCupPredictor.jsx";

export default function App() {
  const [tab, setTab] = useState("match");

  return (
    <>
      <header className="app-header">
        <div>
          <span className="eyebrow">Pre-Match Analysis</span>
          <h1>Matchday</h1>
        </div>
        <span className="kickoff">Model: XGBoost · Elo + Form</span>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn ${tab === "match" ? "active" : ""}`}
          onClick={() => setTab("match")}
        >
          Match Predictor
        </button>
        <button
          className={`tab-btn ${tab === "worldcup" ? "active" : ""}`}
          onClick={() => setTab("worldcup")}
        >
          World Cup Winner
        </button>
      </div>

      {tab === "match" ? <MatchPredictor /> : <WorldCupPredictor />}

      <div className="footer-note">Predictions are simulated estimates, not betting advice.</div>
    </>
  );
}
