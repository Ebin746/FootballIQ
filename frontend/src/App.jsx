import { useState } from "react";
import MatchPredictor from "./components/MatchPredictor.jsx";
import WorldCupPredictor from "./components/WorldCupPredictor.jsx";

export default function App() {
  const [tab, setTab] = useState("match");

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-baseline justify-between mb-9 border-b-2 border-line pb-5">
        <div>
          <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold block mb-1.5">
            Pre-Match Analysis
          </span>
          <h1 className="font-display font-bold text-[34px] tracking-tight uppercase m-0 text-ivory">
            Matchday
          </h1>
        </div>
        <span className="font-mono text-[13px] text-muted">
          Model: XGBoost · Elo + Form
        </span>
      </header>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-2.5 mb-8">
        {[
          { key: "match", label: "Match Predictor" },
          { key: "worldcup", label: "World Cup Winner" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              "font-display font-semibold text-[14px] tracking-[0.04em] uppercase",
              "px-[22px] py-3 rounded-full border cursor-pointer transition-all duration-150",
              tab === key
                ? "bg-gold border-gold text-bg"
                : "bg-transparent border-line text-muted hover:border-gold hover:text-ivory",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Active Panel ───────────────────────────────────────── */}
      {tab === "match" ? <MatchPredictor /> : <WorldCupPredictor />}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="mt-10 text-center font-mono text-[11px] text-muted tracking-[0.05em]">
        Predictions are simulated estimates, not betting advice.
      </div>
    </>
  );
}
