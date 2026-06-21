# World Cup Predictor

Two parts, deployed separately:

```
worldcup-app/
├── backend/                  FastAPI — trains once, serves predictions
│   ├── train.py              Run ONCE (needs results.csv) to produce artifacts/
│   ├── artifacts/            model.pkl, team_state.pkl, groups.json, features.json
│   ├── app/
│   │   ├── main.py           FastAPI routes
│   │   ├── simulation.py     Loads artifacts once; match + tournament sim logic
│   │   └── schemas.py        Pydantic request/response models
│   ├── requirements.txt
│   └── README.md
│
└── frontend/                 React + Vite
    ├── src/
    │   ├── App.jsx            Tab shell (Match / World Cup)
    │   ├── api.js              fetch wrapper for the backend
    │   ├── index.css          Design system
    │   └── components/
    │       ├── MatchPredictor.jsx
    │       └── WorldCupPredictor.jsx
    ├── package.json
    └── README.md
```

## Order of operations
1. `cd backend && pip install -r requirements.txt`
2. Drop `results.csv` into `backend/`, run `python train.py` once → fills `artifacts/`
3. `uvicorn app.main:app --reload --port 8000`
4. `cd frontend && npm install && npm run dev`
5. Open http://localhost:5173

## Deploy
- **Backend** → Render or Railway (see `backend/README.md`)
- **Frontend** → Vercel or Netlify (see `frontend/README.md`)
- After both are live, update:
  - `backend/app/main.py` → `allow_origins` with your frontend's URL
  - `frontend/.env` → `VITE_API_URL` with your backend's URL
