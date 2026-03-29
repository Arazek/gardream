# Infrastructure Integration Guide

> **Audience:** This document is written for LLMs and automated agents performing integration tasks.
> It is intentionally explicit and machine-friendly: every section resolves to concrete values,
> file paths, or copy-paste configuration blocks. No assumptions are left implicit.

---

## 1. Infrastructure Overview

This stack is a Docker Compose-based platform. All inter-service communication happens inside
the Docker network named **`proxy-network`**. All external HTTP/HTTPS traffic is routed through
**Traefik**, which is the single ingress point.

### Component Inventory

| Component      | Container name | Role                                  | Internal address        | External URL (default)              |
|----------------|----------------|---------------------------------------|-------------------------|-------------------------------------|
| Traefik        | `traefik`      | Reverse proxy / TLS termination       | `traefik:80`, `:443`    | `https://traefik.localhost` (dashboard) |
| Keycloak       | `keycloak`     | Identity & access management (OIDC)   | `keycloak:8080`         | `https://keycloak.localhost`        |
| PostgreSQL     | `postgresdb`   | Relational database (TimescaleDB + PostGIS) | `postgresdb:5432`  | Not exposed by default              |
| pgAdmin        | `pgadmin`      | Database management UI                | `pgadmin:80`            | `https://pgadmin.localhost`         |
| Webhook server | `webhook`      | CI/CD trigger endpoint                | `webhook:9000`          | `https://webhook.localhost`         |

### Network

```
network name : proxy-network
driver       : bridge
```

Any container that joins `proxy-network` can reach the components above using their container
names as DNS hostnames. Traefik auto-discovers services on this network via Docker socket labels.

---

## 2. Joining the Network — Minimum Viable Service Registration

To make a new application a "good citizen" of this infrastructure it **must**:

1. Attach to `proxy-network` as an external network.
2. Declare Traefik labels so the reverse proxy can route traffic to it.
3. (Optional but recommended) Register a Keycloak client and use OIDC for authentication.
4. (Optional) Provision its own PostgreSQL database/user via `postgres/init.sql`.

### 2.1 Docker Compose Skeleton for a New Service

```yaml
# your-service/docker-compose.yml

services:
  your-service:
    image: your-org/your-service:latest        # replace with your image
    container_name: your-service
    restart: unless-stopped
    environment:
      # Keycloak OIDC (if using SSO)
      OIDC_ISSUER: https://${KEYCLOAK_HOSTNAME}/realms/${KEYCLOAK_REALM}
      OIDC_CLIENT_ID: your-service             # must match Keycloak client ID
      OIDC_CLIENT_SECRET: ${YOUR_SERVICE_OIDC_SECRET}
      # Database (if using PostgreSQL)
      DATABASE_URL: postgresql://your_service_user:${YOUR_SERVICE_DB_PASS}@postgresdb:5432/your_service_db
    networks:
      - proxy-network
    labels:
      # --- Traefik registration (required) ---
      - "traefik.enable=true"
      - "traefik.http.routers.your-service.rule=Host(`your-service.localhost`)"
      - "traefik.http.routers.your-service.entrypoints=websecure"
      - "traefik.http.routers.your-service.tls=true"
      - "traefik.http.services.your-service.loadbalancer.server.port=3000"  # your app's port

networks:
  proxy-network:
    external: true   # <-- CRITICAL: must be external, not redefined
```

> **Rule:** The `proxy-network` network block in your compose file MUST use `external: true`.
> Do not redefine it; it already exists and is managed by the base stack.

---

## 3. Traefik — Routing Rules

### How Traefik Discovers Services

Traefik watches the Docker socket and reads labels from containers on `proxy-network`.
A service is only proxied when **both** conditions are met:

- The container is on `proxy-network`.
- The label `traefik.enable=true` is present.

### TLS

Traefik generates self-signed certificates automatically (stored in the `traefik_certs` volume).
In a production deployment these are replaced by Let's Encrypt or externally provisioned certs
via the `setup-production.sh` script. New services inherit TLS automatically when they use
`entrypoints=websecure` and `tls=true`.

### Available Entry Points

| Entry point  | Port | Behaviour                        |
|-------------|------|----------------------------------|
| `web`       | 80   | Redirects all traffic to `websecure` |
| `websecure` | 443  | TLS, main entry point            |

### Router Naming Convention

Use your service name as the router name to avoid conflicts:

```
traefik.http.routers.<your-service-name>.rule=...
traefik.http.services.<your-service-name>.loadbalancer.server.port=...
```

Router names must be unique across all containers on the network.

### Adding Middleware (Optional)

Rate limiting example (copy from pgAdmin pattern):

```yaml
labels:
  - "traefik.http.routers.your-service.middlewares=your-service-ratelimit"
  - "traefik.http.middlewares.your-service-ratelimit.ratelimit.average=60"
  - "traefik.http.middlewares.your-service-ratelimit.ratelimit.burst=100"
  - "traefik.http.middlewares.your-service-ratelimit.ratelimit.period=1m"
```

---

## 4. Keycloak — Identity & Access Management

### Key Facts

| Property        | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| Version         | 26.0                                                               |
| Internal URL    | `http://keycloak:8080`                                             |
| External URL    | `https://<KEYCLOAK_HOSTNAME>` (default: `https://keycloak.localhost`) |
| Default realm   | `my-realm` (set via `KEYCLOAK_REALM` env var)                     |
| Realm config    | `keycloak/realm-config.json` (imported on first start)            |

### OIDC Discovery Endpoint

```
https://<KEYCLOAK_HOSTNAME>/realms/<KEYCLOAK_REALM>/.well-known/openid-configuration
```

This endpoint returns all token, authorization, JWKS, and userinfo URLs. Always use it
rather than hard-coding individual URLs.

### Token Endpoints (Resolved)

| Endpoint            | URL                                                                                  |
|---------------------|--------------------------------------------------------------------------------------|
| Authorization       | `https://<KEYCLOAK_HOSTNAME>/realms/<KEYCLOAK_REALM>/protocol/openid-connect/auth`   |
| Token               | `https://<KEYCLOAK_HOSTNAME>/realms/<KEYCLOAK_REALM>/protocol/openid-connect/token`  |
| Userinfo            | `https://<KEYCLOAK_HOSTNAME>/realms/<KEYCLOAK_REALM>/protocol/openid-connect/userinfo` |
| JWKS (public keys)  | `https://<KEYCLOAK_HOSTNAME>/realms/<KEYCLOAK_REALM>/protocol/openid-connect/certs`  |
| Logout              | `https://<KEYCLOAK_HOSTNAME>/realms/<KEYCLOAK_REALM>/protocol/openid-connect/logout` |
| Introspection       | `https://<KEYCLOAK_HOSTNAME>/realms/<KEYCLOAK_REALM>/protocol/openid-connect/token/introspect` |

### Existing Realm Structure

```json
{
  "realm": "my-realm",
  "roles": ["admin", "user"],
  "groups": ["administrators", "users"],
  "clients": ["my-app", "pgadmin"],
  "test_user": { "username": "testuser", "password": "testpassword", "role": "user" }
}
```

### Existing Clients

#### `my-app` (public client — for browser/SPA/mobile apps)

```json
{
  "clientId": "my-app",
  "publicClient": true,
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": true,
  "redirectUris": ["http://localhost:3000/*", "http://localhost:8080/*"],
  "scopes": ["openid", "profile", "email", "roles"]
}
```

Direct usage (Authorization Code flow, no secret required):

```
GET https://<KEYCLOAK_HOSTNAME>/realms/my-realm/protocol/openid-connect/auth
  ?client_id=my-app
  &redirect_uri=http://localhost:3000/callback
  &response_type=code
  &scope=openid profile email roles
```

#### `pgadmin` (confidential client — for server-side apps)

```json
{
  "clientId": "pgadmin",
  "publicClient": false,
  "standardFlowEnabled": true,
  "redirectUris": ["https://pgadmin.localhost/oauth2/authorize"]
}
```

The `pgadmin` client secret is set via `PGADMIN_OAUTH_CLIENT_SECRET` env var and must match
the `secret` field in `keycloak/realm-config.json`.

### Registering a New Keycloak Client

**Option A — Edit `keycloak/realm-config.json` (recommended for new deployments)**

Add a new entry to the `clients` array before first startup:

```json
{
  "clientId": "your-service",
  "name": "Your Service",
  "enabled": true,
  "publicClient": false,
  "secret": "REPLACE_WITH_STRONG_SECRET",
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": false,
  "redirectUris": [
    "https://your-service.localhost/auth/callback",
    "https://your-service.example.com/auth/callback"
  ],
  "webOrigins": [
    "https://your-service.localhost",
    "https://your-service.example.com"
  ],
  "defaultClientScopes": ["web-origins", "acr", "profile", "roles", "email"],
  "optionalClientScopes": ["address", "phone", "offline_access"]
}
```

> **Important:** If Keycloak has already started and the realm exists, the `realm-config.json`
> is not re-imported automatically. Use the Keycloak Admin UI or Admin REST API to create
> the client on a live instance.

### Configuring Token Claims (Client Mappers)

By default, Keycloak includes standard OIDC claims in tokens: `sub`, `email`, `given_name`, `family_name`, `preferred_username`, and `realm_access.roles`.

To add custom claims to tokens, use **Client Mappers** in the Keycloak Admin UI:

1. Navigate to `Clients → your-service → Client Scopes → {scope-name} → Add Mapper`
2. Choose **User Attribute** to expose a user property, or **User Session Note** to include custom data
3. Map the claim name to the JWT token claim name

**Common frontend use cases:**

- Add `email_verified` (User Attribute mapper: `emailVerified` → `email_verified`)
- Add custom department or team info (User Attribute mapper: `department` → `department`)
- Add user picture URL (Protocol Mapper: `User Attribute` with `https://www.iam.example.com/picture`)

**Best Practice:** Configure mappers *before* first client use to ensure all frontends get consistent claims.

**Frontend token claim extraction safety:**

When extracting claims in frontend code (e.g., Angular):

```typescript
// Safe extraction with defaults
const email = payload.email || 'unknown@example.com';
const roles = payload.realm_access?.roles || [];
const department = payload.department || null;
```

Always provide sensible defaults for optional claims, as not all client types may include all mappers.

**Option B — Keycloak Admin REST API (for live instances)**

```bash
# 1. Obtain admin token
TOKEN=$(curl -s -X POST \
  "https://<KEYCLOAK_HOSTNAME>/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" \
  -d "username=${KEYCLOAK_ADMIN}" \
  -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
  -d "grant_type=password" | jq -r '.access_token')

# 2. Create client
curl -s -X POST \
  "https://<KEYCLOAK_HOSTNAME>/admin/realms/${KEYCLOAK_REALM}/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "your-service",
    "enabled": true,
    "publicClient": false,
    "secret": "REPLACE_WITH_STRONG_SECRET",
    "standardFlowEnabled": true,
    "redirectUris": ["https://your-service.localhost/auth/callback"],
    "webOrigins": ["https://your-service.localhost"]
  }'
```

### Token Validation (Backend Services)

Verify JWTs using the realm's public JWKS endpoint. The token includes `realm_access.roles`
for realm-level roles. Always validate:

1. `iss` claim matches `https://<KEYCLOAK_HOSTNAME>/realms/<KEYCLOAK_REALM>`
2. `aud` claim matches your `clientId`
3. Signature against JWKS
4. `exp` not in the past

### OIDC Flow Decision Tree

```
Is the application a browser SPA or mobile app?
  YES → Use Authorization Code Flow with PKCE, publicClient=true
  NO  → Is the application a server-side backend?
          YES → Use Authorization Code Flow, publicClient=false, store secret securely
          NO  → Is it a machine-to-machine service?
                  YES → Use Client Credentials Flow, publicClient=false
```

---

## 5. PostgreSQL — Database Provisioning

### Connection Details

| Property           | Value                    |
|--------------------|--------------------------|
| Internal host      | `postgresdb`             |
| Port               | `5432`                   |
| Superuser          | `${POSTGRES_USER}`       |
| Extensions enabled | TimescaleDB, PostGIS, PostGIS Topology |

The database is **not port-forwarded to the host** by default. Services inside `proxy-network`
connect directly via `postgresdb:5432`. To enable host access, add a port mapping to the
`postgres` service in `docker-compose.yml`.

### Provisioning a New Database for Your Service

Edit `postgres/init.sql` before first startup (or run the SQL manually on a live instance):

```sql
-- Replace all occurrences of 'your_service' with your actual service name
CREATE USER your_service_user WITH PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
CREATE DATABASE your_service_db OWNER your_service_user;

-- Connect to your database and enable needed extensions
\c your_service_db
CREATE EXTENSION IF NOT EXISTS timescaledb;   -- for time-series data
CREATE EXTENSION IF NOT EXISTS postgis;        -- for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Optional: create an application schema
CREATE SCHEMA IF NOT EXISTS app;
ALTER SCHEMA app OWNER TO your_service_user;
```

> **Warning:** `init.sql` only executes on the very first container start (when the
> `postgres_data` volume is empty). To re-run it: `docker compose down -v && docker compose up -d --build`
> This **destroys all data**. For live instances, run the SQL manually.

### Connection String Format

```
postgresql://your_service_user:YOUR_PASSWORD@postgresdb:5432/your_service_db
```

### Available Extensions

| Extension          | Use case                                   |
|--------------------|--------------------------------------------|
| `timescaledb`      | Time-series hypertables, continuous aggregates |
| `postgis`          | Geospatial geometry types and functions    |
| `postgis_topology` | Topology-aware geospatial operations       |

---

## 6. Webhook Server — Automated Deployments

### Endpoint Reference

| Method | Path                         | Action                              |
|--------|------------------------------|-------------------------------------|
| `GET`  | `/`                          | Returns list of available routes    |
| `POST` | `/deploy/python-backend`     | Redeploys the Python backend project |
| `POST` | `/deploy/javascript-frontend`| Redeploys the JavaScript frontend project |

Base URL: `https://<WEBHOOK_HOSTNAME>` (default: `https://webhook.localhost`)

### Authentication Methods

The webhook server accepts **one** of the following authentication headers per request:

| Provider | Header name             | Value format                              |
|----------|-------------------------|-------------------------------------------|
| GitHub   | `X-Hub-Signature-256`   | `sha256=<HMAC-SHA256 hex of request body>` |
| GitLab   | `X-Gitlab-Token`        | Plain `WEBHOOK_SECRET` value              |
| Generic  | `X-Webhook-Secret`      | Plain `WEBHOOK_SECRET` value              |

### Branch Filtering

If the request body contains a `ref` field (standard in GitHub/GitLab push events), the server
only triggers a deploy when:

```
ref == "refs/heads/master"  OR  ref == "refs/heads/main"
```

Any other branch returns HTTP 200 with `{"status":"skipped","reason":"not master/main branch"}`.

### Manual Trigger Example

```bash
curl -X POST https://webhook.localhost/deploy/python-backend \
  -H "X-Webhook-Secret: ${WEBHOOK_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Adding a New Deploy Target

1. Create a deploy script at `webhooks/deploy-yourservice.sh`.
2. Mount the project directory into the `webhook` container in `docker-compose.yml`:
   ```yaml
   volumes:
     - ./your_service_project:/repos/your_service_project
   ```
3. Add the route to the `ROUTES` dict in `webhooks/webhook-server.py`:
   ```python
   ROUTES = {
       "/deploy/python-backend":       "/app/deploy-python.sh",
       "/deploy/javascript-frontend":  "/app/deploy-javascript.sh",
       "/deploy/your-service":         "/app/deploy-yourservice.sh",  # new
   }
   ```
4. Rebuild the webhook container: `docker compose up -d --build webhook`

---

## 7. Environment Variables Reference

All configuration is driven by an `.env` file in the project root.
The following table lists every variable, its purpose, and its default value.

| Variable                      | Used by          | Description                                          | Default                      |
|-------------------------------|------------------|------------------------------------------------------|------------------------------|
| `POSTGRES_USER`               | postgres         | PostgreSQL superuser name                            | `postgres`                   |
| `POSTGRES_PASSWORD`           | postgres         | PostgreSQL superuser password                        | `changeme_postgres`          |
| `POSTGRES_DB`                 | postgres         | Default database name                                | `postgres`                   |
| `KC_DB_USERNAME`              | keycloak         | Keycloak's PostgreSQL user                           | `keycloak`                   |
| `KC_DB_PASSWORD`              | keycloak         | Keycloak's PostgreSQL password                       | `changeme_keycloak`          |
| `KC_DB_NAME`                  | keycloak         | Keycloak's PostgreSQL database                       | `keycloak`                   |
| `KEYCLOAK_ADMIN`              | keycloak         | Keycloak bootstrap admin username                    | `admin`                      |
| `KEYCLOAK_ADMIN_PASSWORD`     | keycloak         | Keycloak bootstrap admin password                    | `changeme_admin`             |
| `KEYCLOAK_HOSTNAME`           | keycloak, pgadmin| Public hostname for Keycloak (via Traefik)           | `keycloak.localhost`         |
| `KEYCLOAK_REALM`              | keycloak, pgadmin| Realm name (must match `realm-config.json`)          | `my-realm`                   |
| `TRAEFIK_DASHBOARD_HOST`      | traefik          | Hostname for the Traefik dashboard                   | `traefik.localhost`          |
| `TRAEFIK_DASHBOARD_AUTH`      | traefik          | BasicAuth `user:bcrypt_hash` for dashboard           | `admin:changeme_dashboard`   |
| `PGADMIN_HOSTNAME`            | pgadmin          | Public hostname for pgAdmin                          | `pgadmin.localhost`          |
| `PGADMIN_DEFAULT_EMAIL`       | pgadmin          | Fallback admin email (local login)                   | `admin@example.com`          |
| `PGADMIN_DEFAULT_PASSWORD`    | pgadmin          | Fallback admin password (local login)                | `changeme_pgadmin`           |
| `PGADMIN_OAUTH_CLIENT_SECRET` | pgadmin          | OAuth2 secret for pgadmin Keycloak client            | `changeme_pgadmin_secret`    |
| `WEBHOOK_HOSTNAME`            | webhook          | Public hostname for webhook server                   | `webhook.localhost`          |
| `WEBHOOK_SECRET`              | webhook          | Shared secret for webhook authentication             | `changeme_webhook_secret`    |

---

## 8. Integration Checklist (New Service)

Use this checklist to verify a new application is a correct infrastructure citizen.

### Networking
- [ ] Service is on `proxy-network` using `external: true`
- [ ] No port clashes with existing services on the host

### Traefik
- [ ] `traefik.enable=true` label is present
- [ ] Router name is **unique** (not `traefik`, `keycloak`, `pgadmin`, `webhook`)
- [ ] `entrypoints=websecure` is set
- [ ] `tls=true` is set
- [ ] Correct internal port is specified in `loadbalancer.server.port`

### Keycloak (if using SSO)
- [ ] A new client is registered in `keycloak/realm-config.json` or the Admin API
- [ ] `redirectUris` cover all callback URLs used by the service
- [ ] Client type (public vs confidential) matches the application type
- [ ] Secret is stored in `.env` and never hard-coded in the image
- [ ] Service validates JWTs using the JWKS endpoint, not a shared secret

### PostgreSQL (if using the shared database)
- [ ] Dedicated user and database are provisioned (no service runs as `postgres` superuser)
- [ ] Credentials are in `.env` and injected as environment variables
- [ ] Connection uses the internal DNS name `postgresdb`, not `localhost` or an IP

### Security
- [ ] All `changeme_*` default secrets are replaced before production deployment
- [ ] Run `setup-production.sh` to generate and apply all production secrets interactively

---

## 9. Internal DNS Summary

Services within `proxy-network` resolve each other by container name:

| Container name | Resolves to                | Protocol / Port |
|----------------|----------------------------|-----------------|
| `traefik`      | Traefik reverse proxy      | HTTP 80, HTTPS 443 |
| `keycloak`     | Keycloak server            | HTTP 8080       |
| `postgresdb`   | PostgreSQL                 | TCP 5432        |
| `pgadmin`      | pgAdmin UI                 | HTTP 80         |
| `webhook`      | Webhook server             | HTTP 9000       |

> **Special alias:** Traefik also has the alias `keycloak.localhost` on the `proxy-network`.
> This allows other containers to reach Keycloak via its public hostname internally
> (required for token validation and OIDC metadata requests that use the public issuer URL).

---

## 10. File Map

```
docker-compose.yml           — Master service definitions, volumes, network
.env                         — All secrets and hostnames (never commit to VCS)
setup-production.sh          — Interactive production configuration wizard
keycloak/
  realm-config.json          — Imported on first Keycloak start; defines realm, clients, users, roles
postgres/
  Dockerfile                 — Builds TimescaleDB + PostGIS image
  init.sql                   — Runs once on first postgres startup; add DBs/users/schemas here
pgadmin/
  config_local.py            — Configures OAuth2 login via Keycloak for pgAdmin
  servers.json               — Pre-registers the PostgreSQL server in pgAdmin UI
traefik/
  traefik.yml                — Static Traefik config: entry points, Docker provider, log level
webhooks/
  webhook-server.py          — HTTP server handling deploy triggers
  deploy-python.sh           — Deploy script for the Python backend project
  deploy-javascript.sh       — Deploy script for the JavaScript frontend project
  Dockerfile                 — Builds the webhook server image
```

---

## Annex A — `docker-compose.yml` (current)

```yaml
services:
  # ===========================================================================
  # Traefik - Reverse Proxy
  # ===========================================================================
  traefik:
    image: traefik:v3.6
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro
      - traefik_certs:/etc/traefik/certs
    networks:
      proxy-network:
        aliases:
          - keycloak.localhost
    labels:
      - "traefik.enable=true"
      # Dashboard
      - "traefik.http.routers.traefik-dashboard.rule=Host(`${TRAEFIK_DASHBOARD_HOST}`)"
      - "traefik.http.routers.traefik-dashboard.entrypoints=websecure"
      - "traefik.http.routers.traefik-dashboard.service=api@internal"
      - "traefik.http.routers.traefik-dashboard.tls=true"
      # Dashboard BasicAuth
      - "traefik.http.routers.traefik-dashboard.middlewares=dashboard-auth"
      - "traefik.http.middlewares.dashboard-auth.basicauth.users=${TRAEFIK_DASHBOARD_AUTH}"

  # ===========================================================================
  # PostgreSQL - Database (TimescaleDB + PostGIS)
  # ===========================================================================
  postgres:
    build:
      context: ./postgres
      dockerfile: Dockerfile
    container_name: postgresdb
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - proxy-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ===========================================================================
  # Keycloak - Identity & Access Management
  # ===========================================================================
  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    container_name: keycloak
    restart: unless-stopped
    command: start --import-realm
    environment:
      # Database connection
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/${KC_DB_NAME}
      KC_DB_USERNAME: ${KC_DB_USERNAME}
      KC_DB_PASSWORD: ${KC_DB_PASSWORD}
      # Admin credentials
      KC_BOOTSTRAP_ADMIN_USERNAME: ${KEYCLOAK_ADMIN}
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
      # Proxy settings (Traefik terminates TLS)
      KC_PROXY_HEADERS: xforwarded
      KC_HTTP_ENABLED: "true"
      KC_HOSTNAME: https://${KEYCLOAK_HOSTNAME}
    volumes:
      - keycloak_data:/opt/keycloak/data
      - ./keycloak/realm-config.json:/opt/keycloak/data/import/realm-config.json:ro
    networks:
      - proxy-network
    depends_on:
      postgres:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.keycloak.rule=Host(`${KEYCLOAK_HOSTNAME}`)"
      - "traefik.http.routers.keycloak.entrypoints=websecure"
      - "traefik.http.routers.keycloak.tls=true"
      - "traefik.http.services.keycloak.loadbalancer.server.port=8080"

  # ===========================================================================
  # pgAdmin - Database Management (OAuth2 via Keycloak)
  # ===========================================================================
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}
      # OAuth2 — browser-side URL (external, via Traefik)
      OAUTH2_AUTHORIZATION_URL: https://${KEYCLOAK_HOSTNAME}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth
      # OAuth2 — server-side URLs (internal Docker network)
      OAUTH2_CLIENT_ID: pgadmin
      OAUTH2_CLIENT_SECRET: ${PGADMIN_OAUTH_CLIENT_SECRET}
      OAUTH2_TOKEN_URL: https://${KEYCLOAK_HOSTNAME}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token
      OAUTH2_API_BASE_URL: https://${KEYCLOAK_HOSTNAME}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/
      OAUTH2_SERVER_METADATA_URL: https://${KEYCLOAK_HOSTNAME}/realms/${KEYCLOAK_REALM}/.well-known/openid-configuration
    volumes:
      - pgadmin_data:/var/lib/pgadmin
      - ./pgadmin/config_local.py:/pgadmin4/config_local.py:ro
      - ./pgadmin/servers.json:/pgadmin4/servers.json:ro
    networks:
      - proxy-network
    depends_on:
      - keycloak
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.pgadmin.rule=Host(`${PGADMIN_HOSTNAME}`)"
      - "traefik.http.routers.pgadmin.entrypoints=websecure"
      - "traefik.http.routers.pgadmin.tls=true"
      - "traefik.http.services.pgadmin.loadbalancer.server.port=80"
      # Rate limiting
      - "traefik.http.routers.pgadmin.middlewares=pgadmin-ratelimit"
      - "traefik.http.middlewares.pgadmin-ratelimit.ratelimit.average=20"
      - "traefik.http.middlewares.pgadmin-ratelimit.ratelimit.burst=50"
      - "traefik.http.middlewares.pgadmin-ratelimit.ratelimit.period=1m"

  # ===========================================================================
  # Webhook - Automated Deployments
  # ===========================================================================
  webhook:
    build:
      context: ./webhooks
      dockerfile: Dockerfile
    container_name: webhook
    restart: unless-stopped
    environment:
      WEBHOOK_SECRET: ${WEBHOOK_SECRET}
      PYTHON_PROJECT_DIR: /repos/python_keycloak_template
      JAVASCRIPT_PROJECT_DIR: /repos/javascript_keycloak_template
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./python_keycloak_template:/repos/python_keycloak_template
      - ./javascript_keycloak_template:/repos/javascript_keycloak_template
    networks:
      - proxy-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.webhook.rule=Host(`${WEBHOOK_HOSTNAME}`)"
      - "traefik.http.routers.webhook.entrypoints=websecure"
      - "traefik.http.routers.webhook.tls=true"
      - "traefik.http.services.webhook.loadbalancer.server.port=9000"

volumes:
  postgres_data:
    driver: local
  keycloak_data:
    driver: local
  pgadmin_data:
    driver: local
  traefik_certs:
    driver: local

networks:
  proxy-network:
    name: proxy-network
    driver: bridge
```
