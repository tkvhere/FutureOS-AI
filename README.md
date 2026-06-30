# Life Outcome Simulator with AI Coach

This repository contains a habit-tracking and life-simulation product built around the current dashboard and a planned premium extension called Future Journey.

The app already includes:
- Gmail authentication
- JWT authentication
- Habit logging
- Goal mode selection
- XP, levels, badges, and streaks
- AI coach chat
- Webcam mood analysis
- Forecasting and simulation
- Current vs ideal comparison
- Digital twin visualization
- Onboarding and profile management

## Architecture Overview

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Framer Motion and GSAP for motion
- Chart.js for charts
- face-api.js for browser-based mood analysis

### Backend
- FastAPI application
- JWT-based authentication
- MongoDB as the primary datastore
- In-memory fallback when MongoDB is unavailable
- Optional MySQL adapter exists, but it is not the main runtime path

### Machine Learning
- Decision Tree goal-day predictor
- Optional PyTorch LSTM forecaster
- Trend-based forecasting fallback
- Deterministic simulation engine
- MDP-style policy engine

## Current System Modules

### Authentication
- Gmail-only signup and login
- Email verification code flow
- JWT session persistence in the frontend
- Protected API calls through bearer tokens

### Habit and Progress Tracking
- Daily habit logs
- Summary scores
- Streaks
- Levels and badges
- XP and mission-style progression

### Prediction and Coaching
- Forecast charts
- Simulation horizons
- Current vs ideal comparison
- Chat-based AI coach
- Digital twin state visualization

## Future Journey Planning Document

Future Journey is a separate premium experience layered on top of the existing dashboard.
It should reuse current systems instead of duplicating them.

### Future Journey Flow
Login
↓
Dashboard
↓
Future Journey
↓
Complete user experience

### Recommended Section Order
Hero
↓
Dream Setup
↓
Reality Analysis
↓
Reality Gap
↓
Roadmap
↓
Start Journey
↓
XP System
↓
Future Self Coach
↓
Digital Twin Evolution
↓
Timeline

## Reuse Strategy

Reuse:
- Auth flow
- Habit logging
- Goal mode
- Forecasting
- Simulation
- Compare current vs ideal
- Digital twin
- AI coach
- XP, levels, badges, and streaks
- Profile drawer

Hide or de-emphasize in Future Journey:
- Standalone landing page
- Alternate dashboard header
- Duplicate emotion detector component

Merge into the new premium experience:
- Goal mode into Dream Setup
- AI coach into Future Self Coach
- Digital twin into Digital Twin Evolution
- Progress logic into Journey Timeline and XP System

## Data and API Reuse

Existing APIs to reuse:
- /auth/login
- /auth/signup
- /auth/verify
- /auth/resend-verification
- /auth/me
- /habits/add
- /habits/history
- /simulate
- /forecast
- /mdp/optimal
- /compare
- /chatbot

No new APIs are strictly required for the first version of Future Journey if it is built as a presentation layer on top of existing data.

## Database Model

Current logical storage:
- users
- habits

The current app can support Future Journey with no schema change if the premium experience is computed from existing data.
If persistence is needed later, new journey-specific collections can be introduced for milestones and progress.

## Machine Learning and Forecasting

Current ML flow:
- Decision tree predicts days to goal
- LSTM forecasts habit trends when available
- Trend projection serves as fallback
- Simulation engine projects 30, 90, and 180 day outcomes
- Policy engine selects a next best action

## Implementation Roadmap for Future Journey

Phase 1
- Define the premium experience as a separate journey layer
- Map existing signals to Journey concepts

Phase 2
- Design the navigation order and component hierarchy
- Decide which current components are reused, merged, hidden, or removed

Phase 3
- Define progression logic for XP, stage upgrades, and timeline milestones
- Decide whether persistent journey state is needed

Phase 4
- Finalize the Future Journey blueprint and integrate it without duplicating current functionality

## Existing Operational Notes

- MongoDB is preferred when available.
- The backend falls back to in-memory storage when MongoDB is unavailable.
- Gmail addresses are required for authentication.
- If SMTP is not configured, verification codes are returned locally for development.
- The LSTM forecast is optional and automatically falls back when needed.
- The project includes CI, smoke tests, Docker Compose, and local startup tooling.

## Local Development

Use the existing launcher to start the stack on Windows:

```powershell
./start-local.ps1
```

The launcher starts the backend and frontend and configures local API access automatically.
