# Frontend (React + Vite)

## Setup
```bash
cd frontend
npm install
```

## Local dev
Make sure the backend is running on http://localhost:8000 first, then:
```bash
npm run dev
```
Open http://localhost:5173

## Pointing at a deployed backend
Create a `.env` file in `frontend/`:
```
VITE_API_URL=https://your-backend.onrender.com
```

## Build for production
```bash
npm run build
```
Outputs static files to `dist/` — deploy that folder to **Vercel** or **Netlify**.

## Deploying on Vercel
1. Push this `frontend/` folder to GitHub.
2. Import the repo in Vercel, set root directory to `frontend`.
3. Add environment variable `VITE_API_URL` = your backend's deployed URL.
4. Deploy.
