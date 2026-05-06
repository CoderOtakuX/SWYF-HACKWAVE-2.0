# SWYF - See What You Fit

SWYF is an AI-powered fashion platform for virtual try-on, skin tone analysis, rewards, marketplace browsing, and 2D-to-3D product generation.

## Features

- Virtual try-on workflow with catalog-backed outfit selection
- Skin tone analysis with personalized color recommendations
- 2D-to-3D generator experience in the Projects section
- Rewards marketplace and token tracking
- Product marketplace, product detail, cart, checkout, vendor, and admin views
- Dark mode, responsive layout, and Spline-backed visual background

## Project Structure

```text
frontend/                    React + Vite frontend
services/
  virtual-tryon/             Flask API for catalog, try-on, chat, auth, and skin tone routes
  color-analysis/            Skin tone/color analysis package and local FastAPI wrapper
assets/                      Shared project assets
docs/                        Supporting project documentation
```

## Requirements

- Node.js 20.9+
- Python 3.11+ or a compatible conda Python
- npm
- pip

## Environment

Create these local files. They are ignored by git.

`frontend/.env`

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

`services/virtual-tryon/.env`

```env
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=optional_groq_api_key
```

Supabase must use the exact Project URL from the Supabase dashboard. If the URL does not resolve, auth and database calls will fail with `Failed to fetch`.

## Install

```bash
cd frontend
npm install
```

```bash
cd ../services/virtual-tryon
pip install -r requirements.txt
```

```bash
cd ../color-analysis
pip install -r requirements.txt
pip install -e .
pip install fastapi uvicorn python-multipart
```

## Run Locally

Start the frontend:

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Start the Flask backend:

```bash
cd services/virtual-tryon
python -m flask --app flasktry run --host 127.0.0.1 --port 5000
```

Start the color-analysis service:

```bash
cd services/color-analysis
python -m uvicorn api_server:app --host 127.0.0.1 --port 8000
```

Local URLs:

- Frontend: `http://127.0.0.1:5174/`
- Flask API: `http://127.0.0.1:5000/api/catalog`
- Color analysis health: `http://127.0.0.1:8000/health`

## Build

```bash
cd frontend
npm run build
```

## Notes

- The frontend proxies `/api` requests to the Flask backend on port `5000`.
- The color-analysis FastAPI wrapper exposes `/health` and `/stone`.
- Supabase credentials are optional for loading the app locally, but auth/database features require a valid active Supabase project.
- The 2D-to-3D generator depends on remote GPU availability. Generation can be temporarily blocked by quota limits.
- Keep API keys out of commits and rotate any key that was shared publicly.

## License

Proprietary. All rights reserved.
