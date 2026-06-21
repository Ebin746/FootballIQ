# Backend (FastAPI)

## 1. One-time setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Train ONCE
Put your `results.csv` in this `backend/` folder, then:
```bash
python train.py
```
This writes `model.pkl`, `team_state.pkl`, `groups.json`, `features.json` into `artifacts/`.
You only need to re-run this when you want to refresh the model with new match data —
the API never retrains on its own.

## 3. Run the API
```bash
uvicorn app.main:app --reload --port 8000
```
Visit http://localhost:8000/docs for interactive Swagger docs.

## Endpoints
- `GET  /api/teams` — list of all known teams
- `GET  /api/groups` — the World Cup group draw
- `POST /api/predict-match` — `{home_team, away_team, neutral, tournament_importance}` → win/draw/loss %
- `POST /api/predict-world-cup` — `{n_simulations}` → ranked champion probabilities
- `GET  /api/sample-group-stage` — one simulated group stage table (for display)

## Deploying
Push this `backend/` folder to its own GitHub repo (or subfolder) and deploy to
**Render** or **Railway**:
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Make sure `artifacts/*.pkl` and `*.json` are committed to the repo (they're the trained model —
  don't put them in `.gitignore`), since the host won't run `train.py` for you.
- Update `allow_origins` in `app/main.py` with your deployed frontend URL.
