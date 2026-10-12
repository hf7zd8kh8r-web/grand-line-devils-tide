# Grand Line: Devil's Tide (fan game)

**Play:** https://grand-line-devils-tide.onrender.com  
Grand Line Dash (the first game): https://grand-line-devils-tide.onrender.com/dash/ and its own site https://grand-line-dash.onrender.com
(repo hf7zd8kh8r-web/grand-line-dash, box copy /workspace/one-piece-game/dash-repo; after editing public/dash/index.html copy it there, commit, and run its ./deploy.sh)
Co-op: share `https://grand-line-devils-tide.onrender.com/?room=CODE`.

## Run locally
    npm install && npm run build:local && node server/server.js   # http://localhost:8080 (+ co-op websocket /ws)

Controls PC: WASD, mouse, LMB attack, RMB block, Shift dash, Space jump, 1-4 moves, Q/E slots, F interact/fish, H Haki, J Conqueror's, M map, I bag, Esc menu.
Phone: left stick move, drag right side to look, on-screen buttons.

## Hosting (Render, free plan)
- Repo: https://github.com/hf7zd8kh8r-web/grand-line-devils-tide (public), branch `main`. Render service `grand-line-devils-tide` (Oregon, free), auto-deploy is ON, but because the repo is connected by public URL (no Render GitHub app) Render gets no push webhook, so **deploy with `scripts/deploy.sh`** (push + Render API deploy + wait).
- Build: `npm ci && npx vite build`  (= `npm run build`). Start: `node server/server.js`. Health check: `/health`.
- Server listens on `$PORT` / `0.0.0.0`. Serves `dist/` (incl. `dist/dash/` copied from `public/dash/`), WebSocket co-op at `/ws`, cloud saves at `/api/profile/*`.
- Env vars on Render: `PROFILE_STORE=github`, `GITHUB_TOKEN` (repo scope), `NODE_VERSION=20`.

### Cloud saves
`server/profiles.js` has two stores:
- default: files in `server-data/` (used on the box; never committed - it holds the salt).
- `PROFILE_STORE=github`: JSON files in the **private** repo `hf7zd8kh8r-web/grand-line-saves` (`salt.txt` + `profiles/<hash>.json`) via the GitHub Contents API.
  In-memory cache, a new profile is written immediately, later saves at most once per 60 s per profile (`SAVE_MIN_GAP_MS`), everything pending is flushed on SIGTERM.
  Optional env: `SAVES_REPO`, `SAVES_BRANCH`.
The salt must stay the same, or existing PINs stop working. Never delete `salt.txt` in the saves repo.

## Shipping an update (box workflow)
    cd /workspace/one-piece-game/fp
    npm run build:local            # optional local check (box server on :8080 serves dist/ live)
    git add -A && git commit -m "what changed"
    scripts/deploy.sh              # git push origin main + trigger Render deploy, waits until live (~1-3 min); needs RENDER_API_KEY
The `origin` remote has no token in it; pushes authenticate through a credential helper that reads `$GITHUB_TOKEN` at push time
(`git config credential.helper` in this repo). Deploy status: Render dashboard -> grand-line-devils-tide -> Events.
Never commit `server-data/`, `.env`, or anything from `../hosting/` (see `.gitignore`).

## Free-plan caveats
- After ~15 min with no visitors the service sleeps; the next visit takes ~30-60 s to wake up.
- Restarts wipe the disk (cloud saves are safe in the saves repo; co-op rooms reset).
- 750 free instance hours / month for the workspace.

Tests: node test/shots.cjs | features.cjs | islands.cjs | mp.cjs | perf.cjs  (screenshots go to shots/, not committed)
