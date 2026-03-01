# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PN-API** is a FastAPI + MongoDB proxy scanner and PAC file generator. It discovers proxies from ~100 sources, validates them (speed, anonymity, geolocation), and serves a React frontend with an interactive map and dynamic PAC file endpoint.

## Commands

### Backend

```bash
# Setup
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Required env vars (Windows PowerShell)
$env:MONGODB_URI = "mongodb://localhost:27017"
$env:JWT_SECRET = "dev-secret-key"
$env:ACCESS_TOKEN_EXPIRE_MINUTES = "60"
$env:HOSTNAME = "localhost"

# Run (port 7769 hardcoded in app/main.py)
python app/main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # Dev server at http://localhost:5173, proxies /api/* to :7769
npm run build     # Builds to frontend/dist/
```

### Docker

```bash
docker build -t pn-api .
docker run -p 7769:7769 -e MONGODB_URI=<uri> -e JWT_SECRET=<secret> pn-api
```

### Testing

```bash
pytest                          # All tests
pytest -v                       # Verbose
pytest tests/test_scanner/      # Specific directory
pytest -m api                   # By marker: api, scanner, crud, integration
```

## Architecture

### Request Flow

`app/routers/*.py` → `app/crud/*.py` → MongoDB via `app/db.py` repositories

All endpoints except `POST /api/token` require a JWT token validated by the `get_current_user()` FastAPI dependency.

### Key Files

- `app/main.py` — FastAPI app factory, lifespan hook (Scanner teardown), static mounts, router registration
- `app/db.py` — MongoDB client, all repository instances (`ProxyRepo`, `UserRepo`, `ProfileRepo`, etc.), admin user init on first run
- `app/settings.py` — Reads all env vars (`MONGODB_URI`, `JWT_SECRET`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `HOSTNAME`)
- `app/scanner/scanner.py` — Multi-threaded scanner orchestrator (singleton via `Scanner.get_instance()`)
- `app/pac_generator.py` — PAC file generation using `string.Template` against `app/static/pac_template.js`

### Scanner Engine

Sources (in `app/scanner/sources/`) run on individual threads and push proxy URIs into `check_queue`. Checker threads (`app/scanner/checker.py`) validate each proxy against httpbin.org, google.com, and reddit.com. Alive proxies are re-checked every 15 minutes; dead proxies every 60 minutes.

- **Geolocation**: ipinfo.com API first; falls back to geopy/nominatim (rate-limited to 1 req/sec)
- **Blacklist**: `app/scanner/blacklist.py` loads static files from `app/static/blacklist/` (Spamhaus, FireHol, etc.)

### Frontend

React + TypeScript + Mantine v7. Pages in `frontend/src/pages/`; API calls in `frontend/src/api/`. Built output is served from `app/static/site/` at `/app`.

### MongoDB Collections

- `proxy` — Main proxy records (uri, speed, anon, reliability, location, last_check)
- `user` — Accounts with bcrypt-hashed passwords
- `profile` — Saved proxy filter configurations
- `location` — Cached IP geolocation data
- `historical_ping` — Timeseries collection for proxy check history
- `scanner_settings` — Single-document scanner config

## Conventions

**Anonymity enum** (`app/models/proxy.py`): Always use integer enum values — `none=0`, `low=1`, `medium=2`, `high=3`. Never use string values like `"elite"` or `"anonymous"`.

**PAC protocol mapping**: `http=0`, `https=1`, `socks4=2`, `socks5=3`.

**Adding a new API endpoint**: Add route to `app/routers/<resource>.py`, depend on `get_current_user()`, call into `app/crud/<resource>.py`.

**Adding a scanner source**: Create a new file in `app/scanner/sources/` implementing a `.gather()` method that returns a list of proxy URIs. Register the class in `app/scanner/sources/__init__.py` in `src_lists`.

**No structured logging**: All debug output goes to stdout via print statements.

**PAC file**: Not cached — regenerated on every `GET /pac` request from live proxies.

## Test Infrastructure

`tests/conftest.py` provides fixtures: `mock_mongodb` (auto-mocked for all tests), `test_client` (FastAPI test client with Scanner patched), `auth_headers`, `sample_proxy_data`, `sample_profile_data`, and repository mocks.