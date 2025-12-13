# PN-API Copilot Instructions

# AI AGENTS PLEASE READ: Do not create detailed guides or markdown documentation for features. Implementation code and inline comments should be self-documenting. Keep instructions concise and code-focused.

## High-Level Architecture

**FastAPI + MongoDB proxy scanner and PAC generator.**

- **Core app**: `app/main.py` exposes FastAPI server on **port 7769** (currently hardcoded; refactor to use `PORT` env var or `app/settings.py`). Lifespan hook ensures Scanner teardown.
- **Routers** (`app/routers/*.py`): HTTP endpoints depend on `get_current_user()` (JWT token in header). Example: `routers/proxies.py` calls `crud/proxies.py` calls MongoDB via `db.proxies` repository.
- **Data layer**: MongoDB (no SQLAlchemy). Models in `app/models/` are Pydantic-like classes with repository pattern. Example: `ProxyRepo`, `UserRepo`, `ProfileRepo` in `db.py`. Config in `app/settings.py` reads from env vars (MongoDB URI, JWT_SECRET, etc.).
- **Scanner** (`app/scanner/scanner.py`): Multi-threaded proxy ingestion. Sources in `app/scanner/sources/` (hidemy.py, pubproxy.py, txt_lists.py) feed proxies into a checking queue. Checker (`checker.py`) validates against httpbin.org, google.com, reddit.com. Dead proxies retry hourly; alive ones every 15 minutes.
- **PAC generation**: `pac_generator.py` loads `app/static/pac_template.js`, substitutes proxy array and hostname, returns JavaScript.
- **UI**: Static site at `app/static/site/` (index.html, map.html with Leaflet); mounted at `/app` path.

## Where to Change Things

- **New API endpoint**: Add route in `app/routers/<resource>.py`. Depend on `get_current_user()` for auth. Call into `app/crud/<resource>.py` to query MongoDB via `app.db.<repository>` objects (e.g., `db.proxies.find_by({})`).
- **Add scanner source**: Create new file in `app/scanner/sources/` with a class matching existing pattern (e.g., `PubProxy`). Implement `.gather()` method returning list of proxy URIs. Register in `app/scanner/sources/__init__.py` in `src_lists`.
- **PAC template changes**: Edit `app/static/pac_template.js` (uses Python `string.Template` syntax: `$p_arr`, `$lb`, `$host`). Adapt variable names in `pac_generator.py` if needed.
- **Database schema**: Models in `app/models/` are repository classes wrapping MongoDB collections. Add new repo class, initialize in `app/db.py` after `client.database` is set. No migrations needed - MongoDB is schema-less.

## Developer Workflows

**Run locally** (development):
```bash
# 1. Env setup
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# 2. Set env vars (Windows PowerShell)
$env:MONGODB_URI = "mongodb://localhost:27017"
$env:JWT_SECRET = "dev-secret-key"
$env:ACCESS_TOKEN_EXPIRE_MINUTES = "60"
$env:HOSTNAME = "localhost"

# 3. Run (starts scanner threads, UI on http://localhost:7769/app/map.html)
python app/main.py
```

**Docker**:
```bash
docker build -t pn-api .
docker run -p 7769:7769 -e MONGODB_URI=<uri> -e JWT_SECRET=<secret> pn-api
```

## Project-Specific Conventions

- **Auth**: All endpoints except `/token` (POST) require JWT token in Authorization header. Validate with `get_current_user()`.
- **Filtering proxies**: Query params (countries, regions, city, speed, anons, protocs, last_check, limit) are wrapped in `FilterProxies` schema before passing to CRUD.
- **Proxy anonymity levels**: When using proxy anonymity in tests or code, reference the `Anonymity` enum in `app/models/proxy.py`: `none=0`, `low=1`, `medium=2`, `high=3`. Do NOT use string values like "elite" or "anonymous".
- **Scanner design**: Sources run on separate threads; they feed URIs into `check_queue`. Checker threads validate and compute location (ipinfo.py first, fallback geopy). Blacklist (`blacklist.py`) filters known-bad IPs.
- **PAC protocol mapping**: proxy.uri protocol prefix = PAC protocol number: http=0, https=1, socks4=2, socks5=3.
- **Keep startup light**: Heavy work (Scanner init) happens in `main.py` but is managed by FastAPI lifespan context. Don't block app start.

## Integration Points & External Dependencies

- **MongoDB**: Must be running. URI from `MONGODB_URI` env var. Collections auto-created on first run (with timeseries for `historical_ping`).
- **ipinfo.com**: Fetches lat/lon for IPs. Queries from `ipinfo.py`. Fallback to geopy (nominatim) if ipinfo missing (rate-limited to 1/sec).
- **Blacklist sources**: Static files in `app/static/blacklist/` (spamhaus, firehol, etc.). Loaded by `Blacklist` class.
- **MHDDoS proxy list**: Downloaded weekly (referenced in README).

## Debugging

- **Logs**: Run `python app/main.py` and watch stdout for scanner/checker output. No structured logging configured.
- **Admin user**: On first run, prompted to set admin email/password (hashed with bcrypt). Stored in MongoDB `users` collection.
- **Check env vars**: Use `app/settings.py` import to verify all required vars are present.
- **Scanner stats**: GET `/scanner/stats` returns `scan_q_len`, `check_back_len`, `current_proxies_len`.

## Testing & Migrations (Planned Improvements)

**Pytest setup** (planned):
- Add `tests/` directory at repo root with `conftest.py` for fixtures.
- Unit tests for CRUD operations should mock MongoDB using `mongomock` or similar.
- Integration tests for routers should use a test MongoDB instance.
- Run with `pytest` or `pytest -v` for verbose output.
- Example: `tests/test_routers/test_proxies.py` mirrors `app/routers/proxies.py`.

## Project Organization (Aspirational Structure)

Current layout is functional but differs from standard FastAPI conventions. When refactoring, consider moving toward:
```
PN-API/
  src/               # Source code root (alternative: just keep app/)
    app/
      __init__.py
      main.py        # FastAPI app factory and lifespan
      config.py      # Settings (alternative to settings.py)
      api/           # API routers (rename from routers/)
        __init__.py
        v1/          # API versioning
          proxies.py
          profiles.py
          ...
      crud/          # CRUD operations (keep as is)
      models/        # MongoDB models / schemas (keep as is)
      schemas/       # Pydantic request/response schemas (keep as is)
      scanner/       # Proxy scanner logic (keep as is)
      static/        # HTML/CSS/JS assets (keep as is)
  tests/             # Add test suite here
    conftest.py      # pytest fixtures
    test_api/
      test_proxies.py
      test_profiles.py
    test_crud/
      test_proxies.py
  .env               # Environment file (keep sensitive locally)
  .env.example       # Template env file (commit to repo)
  pyproject.toml     # Modern Python packaging (optional refactor)
  pytest.ini         # pytest config
  requirements.txt   # Keep as is (or replace with pyproject.toml + setup.py)
  Dockerfile
  docker-compose.yml # Optional: for local MongoDB + app
  README.md
```

**Refactoring Path** (optional):
1. Rename `app/routers/` -> `app/api/` for clarity.
2. Create `tests/` with `conftest.py` and test modules mirroring source.
3. Add `pytest.ini` with test discovery rules.
4. Add `.env.example` as a template (commit to repo, `.env` stays local).

## What Not to Assume

- Pytest is not yet configured; see "Testing & Migrations (Planned Improvements)" section above.
- PAC file is not cached by default; each GET `/pac` call regenerates from live proxies.
- Port 7769 is hardcoded in `app/main.py`; refactor to read from env var (e.g., `PORT` or `APP_PORT`) for better flexibility.
- MongoDB schema changes are implicit (no migrations tool needed); add/remove fields as needed in models.

## Key Files to Inspect

- `app/main.py` - FastAPI setup, lifespan, static mounts, routers.
- `app/db.py` - MongoDB client, all repository instances, admin user init.
- `app/settings.py` - Env var config.
- `app/routers/proxies.py` - Proxy endpoint with filtering.
- `app/crud/proxies.py` - Proxy repository queries (find_alive, apply_filter, etc.).
- `app/scanner/scanner.py` - Multi-threaded scanner core.
- `app/scanner/sources/` - Individual proxy source modules (copy pattern from `hidemy.py`).
- `app/pac_generator.py` - PAC file generation logic.
- `requirements.txt` - Dependencies (FastAPI, pymongo, geopy, pydantic, etc.).
