# MMA Math – Frontend

React + TypeScript + Vite client for MMA Math. Communicates with the FastAPI backend to display upcoming events, run fight predictions, and track model accuracy.

## Tech stack

- **React 19** with React Router v7
- **TypeScript**
- **Vite** (dev server + build)
- **Material UI (MUI v7)** – component library
- **Tailwind CSS** – utility styles
- **react-katex** – rendering math formulas on the Models page

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Home | Landing page with feature overview |
| `/events` | Events | Upcoming and live UFC events |
| `/simulate/:eventId` | Simulate | Full-card predictions for a selected event |
| `/custom` | Custom Sim | Pick any two stored fighters and run a prediction |
| `/models` | Models | Explanation of the three prediction models with math |
| `/results` | Results | Historical prediction accuracy and full prediction log |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |

Create a `.env.local` file in this folder to override locally:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
# Output is written to dist/
```

## Deployment

The frontend is deployed to **Azure Static Web Apps** on every push to `master` via the GitHub Actions workflow at `.github/workflows/azure-static-web-apps-lemon-coast-0fe789600.yml`. The `VITE_API_BASE_URL` secret is injected at build time.

## Project structure

```
src/
  pages/         One component per route
  components/    Shared UI components (FighterCard, ModelSelector, etc.)
  hooks/         Custom React hooks
  services/      API client functions
  types/         TypeScript type definitions
  utils/         Helper functions
  layouts/       Page layout wrappers
```
