# Production Setup Script — Design

## Purpose

Interactive wizard (`scripts/production-setup.sh`) that prepares the Gardream project for production deployment on a single VPS (e.g., Contabo). Asks domain, email, and credential questions, then generates the `.env.prod` and Docker Compose overrides needed to run the full stack with Let's Encrypt TLS.

---

## Design

### Questions

Grouped into categories. All credentials default to auto-generated (`openssl rand -hex 16`/`32`) unless the user provides their own. If `.env.prod` already exists, existing values are offered as defaults (idempotent re-run = upgrade, not wipe).

| Category | Question | Default |
|---|---|---|
| **Domain** | Domain name | From existing `.env` `DOMAIN` |
| | Let's Encrypt email | _(required)_ |
| | Gateway hostname | `gateway.<domain>` |
| **Database** | Postgres superuser password | Auto-generated |
| | App DB name | `app_db` |
| **Keycloak** | Admin password | Auto-generated |
| | DB password | Auto-generated |
| **Backend** | `SECRET_KEY` | Auto-generated |
| | CORS origins | `https://<domain>` |
| **SMTP** (optional) | Enable email? [y/N] | No |
| | SMTP host/port/user/pass | _(if enabled)_ |
| | From name/email | Digital Arboretum / SMTP user |
| **Infra extras** | pgAdmin email | `admin@<domain>` |
| | pgAdmin password | Auto-generated |
| | Garage S3 access key | Auto-generated |
| | Garage S3 secret key | Auto-generated |
| | Webhook secret | Auto-generated |

After questions: summary table (passwords masked), confirmation prompt "Does this look right? [Y/n]".

### Files created

| File | Purpose |
|---|---|
| `.env.prod` | Production env vars: `TLS_MODE=production`, real domain, all generated secrets |
| `infra/docker-compose.prod.yml` | Infra overrides: mounts `traefik.prod.yml` over `traefik.yml`, Keycloak `start` (production mode) |
| `infra/traefik/traefik.prod.yml` | Full Traefik config for production: base config + `certificatesResolvers.letsencrypt` block + entrypoint-level `tls.certResolver: letsencrypt` |

### Files modified

| File | Change |
|---|---|
| `docker-compose.prod.yml` | Point `env_file` to `.env.prod` |
| `run.sh` | Add `COMPOSE_INFRA_PROD` compose variable; add `prod:setup` command |

### Files NOT modified

| File | Why |
|---|---|
| `infra/traefik/traefik.yml` | Untouched — local dev works identically |
| Router labels in any compose file | Not needed — cert resolver is set at entrypoint level in `traefik.prod.yml` |

### Architecture

```
production-setup.sh
  ├── asks questions → writes .env.prod
  ├── generates infra/docker-compose.prod.yml       (new: Keycloak prod mode + mounts traefik.prod.yml)
  ├── generates infra/traefik/traefik.prod.yml       (new: ACME resolver + entrypoint TLS)
  └── updates  docker-compose.prod.yml               (point to .env.prod)

run.sh (updated)
  └── cmd_prod_setup() → infra:start → db:migrate → keycloak:import
```

**Key insight — why entrypoint-level TLS**: Setting `tls.certResolver: letsencrypt` on the `websecure` entrypoint in `traefik.prod.yml` makes every HTTPS router use Let's Encrypt automatically — no per-router labels needed. This avoids the Docker Compose label-replacement problem entirely. The `traefik.prod.yml` is a standalone file that completely replaces `traefik.yml` in production (mounted via the infra prod override), so local dev is zero-impact.

### End state

After running `production-setup.sh` then `./run.sh prod:setup`:

```bash
# What's running
traefik    → TLS termination + Let's Encrypt auto-renewal
postgres   → TimescaleDB + PostGIS
keycloak   → production mode (start, not start-dev)
pgadmin    → OAuth2 via Keycloak
garage     → S3-compatible object storage
webhook    → automated GitHub deployments
backend    → FastAPI with 2 uvicorn workers
frontend   → Angular PWA served via nginx
```

All services behind Traefik, HTTPS only, real certs. Port 80 used for Let's Encrypt HTTP challenge only.

### Idempotency

- If `.env.prod` exists, read values as defaults — upgrading rather than wiping
- Skippable questions: the user can press Enter to accept defaults everywhere
- Generated passwords are shown once (at summary step) so the user can save them
- Re-running does not regenerate passwords unless the user explicitly clears the field

### Validation

- Domain: must be non-empty, warn if `.local` or `localhost`
- ACME email: must contain `@`
- Passwords: minimum 8 characters, reject `changeme`-style defaults
- CORS origins: warn if `localhost` is present in production mode

### Safety

- Never writes files without confirmation
- Backs up any file before modifying (`.bak` suffix)
- `.env.prod` is already in `.gitignore` via `.env` patterns
- All generated credentials use `openssl rand -hex` (cryptographically random)
