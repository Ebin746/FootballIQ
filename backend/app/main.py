from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import simulation as sim
from app.schemas import (
    GroupRow,
    GroupsResponse,
    GroupStandingsResponse,
    MatchPredictRequest,
    MatchPredictResponse,
    TeamProbability,
    TeamsResponse,
    WorldCupPredictRequest,
    WorldCupPredictResponse,
)

app = FastAPI(title="World Cup Predictor API")

# Allow the Vite dev server + your deployed frontend domain.
# Add your production frontend URL here once it's deployed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # "https://your-frontend.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "teams_loaded": len(sim.ALL_TEAMS)}


@app.get("/api/teams", response_model=TeamsResponse)
def get_teams():
    return {"teams": sim.ALL_TEAMS}


@app.get("/api/groups", response_model=GroupsResponse)
def get_groups():
    return {"groups": sim.GROUPS}


@app.post("/api/predict-match", response_model=MatchPredictResponse)
def predict_match(req: MatchPredictRequest):
    if req.home_team not in sim.BASE_TEAM_STATE:
        raise HTTPException(400, f"Unknown team: {req.home_team}")
    if req.away_team not in sim.BASE_TEAM_STATE:
        raise HTTPException(400, f"Unknown team: {req.away_team}")
    if req.home_team == req.away_team:
        raise HTTPException(400, "home_team and away_team must differ")

    probs = sim.predict_match_probs(
        req.home_team, req.away_team, req.neutral, req.tournament_importance
    )
    home_win, draw, away_win = [round(float(p) * 100, 2) for p in probs]

    outcome = max(
        [(home_win, req.home_team + " win"), (draw, "Draw"), (away_win, req.away_team + " win")],
        key=lambda x: x[0],
    )[1]

    return MatchPredictResponse(
        home_team=req.home_team,
        away_team=req.away_team,
        home_win_pct=home_win,
        draw_pct=draw,
        away_win_pct=away_win,
        predicted_outcome=outcome,
    )


@app.post("/api/predict-world-cup", response_model=WorldCupPredictResponse)
def predict_world_cup(req: WorldCupPredictRequest):
    results, _ = sim.simulate_world_cup_many(req.n_simulations)
    return WorldCupPredictResponse(
        n_simulations=req.n_simulations,
        results=[TeamProbability(**r) for r in results],
    )


@app.get("/api/sample-group-stage", response_model=list[GroupStandingsResponse])
def sample_group_stage():
    """Runs ONE simulated group stage so the UI can show an example table."""
    _, standings = sim.simulate_world_cup_once()
    tables = sim.get_group_results(standings)

    out = []
    for group, table in tables.items():
        rows = [
            GroupRow(
                team=team,
                played=int(r["played"]),
                wins=int(r["wins"]),
                draws=int(r["draws"]),
                losses=int(r["losses"]),
                points=int(r["points"]),
            )
            for team, r in table.to_dict(orient="index").items()
        ]
        out.append(GroupStandingsResponse(group=group, table=rows))
    return out
