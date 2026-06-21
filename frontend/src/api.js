const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export function getTeams() {
  return request("/api/teams");
}

export function predictMatch({ homeTeam, awayTeam, neutral = true, tournamentImportance = 4 }) {
  return request("/api/predict-match", {
    method: "POST",
    body: JSON.stringify({
      home_team: homeTeam,
      away_team: awayTeam,
      neutral,
      tournament_importance: tournamentImportance,
    }),
  });
}

export function predictWorldCup({ nSimulations = 200 }) {
  return request("/api/predict-world-cup", {
    method: "POST",
    body: JSON.stringify({ n_simulations: nSimulations }),
  });
}
