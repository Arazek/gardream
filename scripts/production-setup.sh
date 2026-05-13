#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[setup]${NC} $*"; }
success() { echo -e "${GREEN}[setup]${NC} $*"; }
warn()    { echo -e "${YELLOW}[setup]${NC} $*"; }
error()   { echo -e "${RED}[setup]${NC} $*" >&2; exit 1; }

require_tool() {
  command -v "$1" &>/dev/null || error "$1 is required but not installed."
}

# ---------------------------------------------------------------------------
# Prerequisite checks
# ---------------------------------------------------------------------------
check_prereqs() {
  require_tool docker
  require_tool openssl

  if ! docker info &>/dev/null 2>&1 && ! sudo docker info &>/dev/null 2>&1; then
    error "Docker daemon is not running. Start it with: sudo systemctl start docker"
  fi

  if [ ! -f .env.example ]; then
    error ".env.example not found. Run this script from the project root."
  fi
}

# ---------------------------------------------------------------------------
# Password generation
# ---------------------------------------------------------------------------
generate_password() {
  openssl rand -hex 16
}

generate_secret_key() {
  openssl rand -hex 32
}

# ---------------------------------------------------------------------------
# Read existing .env.prod value if it exists (for idempotent re-runs)
# ---------------------------------------------------------------------------
load_existing_prod_env() {
  if [ -f .env.prod ]; then
    set -a
    # shellcheck source=.env.prod
    source .env.prod
    set +a
  fi
}

# ---------------------------------------------------------------------------
# Prompt helper — ask with a default value, loop until non-empty for required
# ---------------------------------------------------------------------------
prompt() {
  local var="$1"
  local description="$2"
  local default="$3"
  local is_password="${4:-no}"
  local value

  while true; do
    local display_default
    if [ "$is_password" = "yes" ] && [ -n "$default" ]; then
      display_default="$(echo "$default" | cut -c1-3)...(${#default} chars)"
    else
      display_default="$default"
    fi

    local prompt_text
    if [ -n "$display_default" ]; then
      prompt_text="${BOLD}${description}${NC} [${display_default}]: "
    else
      prompt_text="${BOLD}${description}${NC}: "
    fi

    read -r -p "$(echo -e "$prompt_text")" value
    if [ -z "$value" ] && [ -n "$default" ]; then
      value="$default"
    fi

    # If there's no default and value is empty, loop again
    if [ -z "$default" ] && [ -z "$value" ]; then
      warn "This field is required."
    else
      break
    fi
  done

  printf -v "$var" '%s' "$value"
}

# ---------------------------------------------------------------------------
# Mask string for display (show first 3 chars + length)
# ---------------------------------------------------------------------------
mask() {
  local val="$1"
  if [ ${#val} -le 6 ]; then
    echo "****"
  else
    echo "${val:0:3}...(${#val} chars)"
  fi
}

# ---------------------------------------------------------------------------
# Interactive wizard
# ---------------------------------------------------------------------------
ask_questions() {
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  Gardream — Production Setup${NC}"
  echo -e "${BOLD}══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "This wizard will ask a series of questions and generate:"
  echo "  • .env.prod                         — Production environment variables"
  echo "  • infra/docker-compose.prod.yml     — Infra production overrides"
  echo "  • infra/traefik/traefik.prod.yml    — Traefik config with Let's Encrypt"
  echo ""
  echo "Press Enter to accept defaults. Ctrl+C to cancel."
  echo ""

  # Load existing .env.prod for defaults (idempotent re-run)
  load_existing_prod_env

  # ── Domain ──────────────────────────────────────────────────────────
  echo -e "${BOLD}── Domain & TLS ─────────────────────────────────────────${NC}"
  echo ""

  local domain_default="${DOMAIN:-}"
  prompt DOMAIN "Domain name (e.g. myapp.duckdns.org)" "$domain_default"

  local acme_default="${ACME_EMAIL:-}"
  prompt ACME_EMAIL "Let's Encrypt contact email" "$acme_default"

  local gateway_default="${GATEWAY_HOSTNAME:-gateway.${DOMAIN}}"
  prompt GATEWAY_HOSTNAME "Gateway hostname (infra services)" "$gateway_default"

  echo ""

  # ── Database ───────────────────────────────────────────────────────
  echo -e "${BOLD}── Database ──────────────────────────────────────────────${NC}"
  echo ""

  local pg_password_default="${POSTGRES_PASSWORD:-$(generate_password)}"
  prompt POSTGRES_PASSWORD "PostgreSQL superuser password" "$pg_password_default" "yes"

  local db_name_default="${POSTGRES_DB:-app_db}"
  prompt POSTGRES_DB "Application database name" "$db_name_default"

  echo ""

  # ── Keycloak ───────────────────────────────────────────────────────
  echo -e "${BOLD}── Keycloak ──────────────────────────────────────────────${NC}"
  echo ""

  local kc_admin_default="${KEYCLOAK_ADMIN_PASSWORD:-$(generate_password)}"
  prompt KEYCLOAK_ADMIN_PASSWORD "Keycloak admin password" "$kc_admin_default" "yes"

  local kc_db_default="${KEYCLOAK_DB_PASSWORD:-$(generate_password)}"
  prompt KEYCLOAK_DB_PASSWORD "Keycloak database password" "$kc_db_default" "yes"

  echo ""

  # ── Backend ────────────────────────────────────────────────────────
  echo -e "${BOLD}── Backend ───────────────────────────────────────────────${NC}"
  echo ""

  local secret_default="${SECRET_KEY:-$(generate_secret_key)}"
  prompt SECRET_KEY "Backend SECRET_KEY" "$secret_default" "yes"

  local cors_default="${BACKEND_CORS_ORIGINS:-[\"https://${DOMAIN}\"]}"
  prompt BACKEND_CORS_ORIGINS "CORS origins (comma-separated or JSON array)" "$cors_default"

  echo ""

  # ── SMTP (optional) ────────────────────────────────────────────────
  echo -e "${BOLD}── Email / SMTP (optional) ───────────────────────────────${NC}"
  echo ""

  read -r -p "$(echo -e "${BOLD}Enable email notifications? [y/N]${NC}: ")" enable_email
  if [ "${enable_email,,}" = "y" ] || [ "${enable_email,,}" = "yes" ]; then
    SMTP_ENABLED="true"

    local smtp_host_default="${SMTP_HOST:-smtp.gmail.com}"
    prompt SMTP_HOST "SMTP host" "$smtp_host_default"

    local smtp_port_default="${SMTP_PORT:-587}"
    prompt SMTP_PORT "SMTP port" "$smtp_port_default"

    prompt SMTP_USERNAME "SMTP username/email" "${SMTP_USERNAME:-}"
    prompt SMTP_PASSWORD "SMTP password" "${SMTP_PASSWORD:-}" "yes"

    local from_name_default="${SMTP_FROM_NAME:-Digital Arboretum}"
    prompt SMTP_FROM_NAME "From name" "$from_name_default"

    local from_email_default="${SMTP_FROM_EMAIL:-${SMTP_USERNAME}}"
    prompt SMTP_FROM_EMAIL "From email" "$from_email_default"
  else
    SMTP_ENABLED="false"
    SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
    SMTP_PORT="${SMTP_PORT:-587}"
    SMTP_USERNAME="${SMTP_USERNAME:-}"
    SMTP_PASSWORD="${SMTP_PASSWORD:-}"
    SMTP_FROM_NAME="${SMTP_FROM_NAME:-Digital Arboretum}"
    SMTP_FROM_EMAIL="${SMTP_FROM_EMAIL:-}"
  fi

  echo ""

  # ── Infra extras ───────────────────────────────────────────────────
  echo -e "${BOLD}── Infra Extras ──────────────────────────────────────────${NC}"
  echo ""

  local pgadmin_email_default="${PGADMIN_DEFAULT_EMAIL:-admin@${DOMAIN}}"
  prompt PGADMIN_DEFAULT_EMAIL "pgAdmin login email" "$pgadmin_email_default"

  local pgadmin_pass_default="${PGADMIN_DEFAULT_PASSWORD:-$(generate_password)}"
  prompt PGADMIN_DEFAULT_PASSWORD "pgAdmin password" "$pgadmin_pass_default" "yes"

  local pgadmin_oauth_default="${PGADMIN_OAUTH_CLIENT_SECRET:-$(generate_password)}"
  prompt PGADMIN_OAUTH_CLIENT_SECRET "pgAdmin OAuth client secret" "$pgadmin_oauth_default" "yes"

  local garage_access_default="${GARAGE_ACCESS_KEY:-GK$(openssl rand -hex 16)}"
  prompt GARAGE_ACCESS_KEY "Garage S3 access key" "$garage_access_default" "yes"

  local garage_secret_default="${GARAGE_SECRET_KEY:-$(generate_secret_key)}"
  prompt GARAGE_SECRET_KEY "Garage S3 secret key" "$garage_secret_default" "yes"

  local webhook_secret_default="${WEBHOOK_SECRET:-$(generate_password)}"
  prompt WEBHOOK_SECRET "Webhook secret" "$webhook_secret_default" "yes"

  echo ""

  # ── Validation ─────────────────────────────────────────────────────
  if [[ "$ACME_EMAIL" != *@* ]]; then
    error "Let's Encrypt email must contain '@'. Got: ${ACME_EMAIL}"
  fi
  if [ -z "$DOMAIN" ]; then
    error "Domain name is required."
  fi
  if [[ "$DOMAIN" == *"localhost"* ]] || [[ "$DOMAIN" == *".local"* ]]; then
    warn "Domain '${DOMAIN}' looks like a local domain. Let's Encrypt requires a real public domain."
  fi
  if [ ${#POSTGRES_PASSWORD} -lt 8 ]; then
    error "PostgreSQL password must be at least 8 characters."
  fi
  if [[ "$BACKEND_CORS_ORIGINS" == *"localhost"* ]]; then
    warn "CORS origins contain 'localhost'. This is fine if you're testing, but remove before real production use."
  fi

  # ── Derived values ─────────────────────────────────────────────────
  KEYCLOAK_PUBLIC_URL="https://${GATEWAY_HOSTNAME}/keycloak"
  KEYCLOAK_INTERNAL_URL="http://keycloak:8080"
  KEYCLOAK_DB="keycloak_db"
  KEYCLOAK_DB_USER="keycloak"
  KEYCLOAK_REALM="${KEYCLOAK_REALM:-gardream}"
  GARAGE_BUCKET="${GARAGE_BUCKET:-gardream-uploads}"
  GARAGE_ENDPOINT="http://garage:3900"
  GARAGE_REGION="garage"
  GARAGE_PUBLIC_URL=""
  POSTGRES_HOST="postgres"
  POSTGRES_PORT="5432"
  POSTGRES_USER="appuser"
  PROJECT_NAME="Gardream"
  APP_URL="https://${DOMAIN}"
  LOG_LEVEL="info"
  APP_ID="${APP_ID:-com.gardream.app}"
  APP_NAME="${APP_NAME:-Gardream}"
  TLS_MODE="production"
  TRAEFIK_DASHBOARD_AUTH="${TRAEFIK_DASHBOARD_AUTH:-}"
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
show_summary() {
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  Configuration Summary${NC}"
  echo -e "${BOLD}══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${BOLD}Domain${NC}"
  echo "    Domain:               ${DOMAIN}"
  echo "    ACME email:           ${ACME_EMAIL}"
  echo "    Gateway hostname:     ${GATEWAY_HOSTNAME}"
  echo ""
  echo -e "  ${BOLD}Database${NC}"
  echo "    Host:                 ${POSTGRES_HOST}:${POSTGRES_PORT}"
  echo "    DB name:              ${POSTGRES_DB}"
  echo "    User:                 ${POSTGRES_USER}"
  echo "    Password:             $(mask "$POSTGRES_PASSWORD")"
  echo ""
  echo -e "  ${BOLD}Keycloak${NC}"
  echo "    Admin password:       $(mask "$KEYCLOAK_ADMIN_PASSWORD")"
  echo "    DB password:          $(mask "$KEYCLOAK_DB_PASSWORD")"
  echo "    Public URL:           ${KEYCLOAK_PUBLIC_URL}"
  echo ""
  echo -e "  ${BOLD}Backend${NC}"
  echo "    SECRET_KEY:           $(mask "$SECRET_KEY")"
  echo "    CORS origins:         ${BACKEND_CORS_ORIGINS}"
  echo ""
  echo -e "  ${BOLD}Email${NC}"
  if [ "$SMTP_ENABLED" = "true" ]; then
    echo "    Enabled:              yes"
    echo "    SMTP host:            ${SMTP_HOST}:${SMTP_PORT}"
    echo "    SMTP username:        ${SMTP_USERNAME}"
    echo "    SMTP password:        $(mask "$SMTP_PASSWORD")"
    echo "    From:                 ${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>"
  else
    echo "    Enabled:              no"
  fi
  echo ""
  echo -e "  ${BOLD}Infra Extras${NC}"
  echo "    pgAdmin email:        ${PGADMIN_DEFAULT_EMAIL}"
  echo "    pgAdmin password:     $(mask "$PGADMIN_DEFAULT_PASSWORD")"
  echo "    Garage access key:    $(mask "$GARAGE_ACCESS_KEY")"
  echo "    Garage secret key:    $(mask "$GARAGE_SECRET_KEY")"
  echo "    Webhook secret:       $(mask "$WEBHOOK_SECRET")"
  echo ""
}

# ---------------------------------------------------------------------------
# File generators
# ---------------------------------------------------------------------------
write_env_prod() {
  info "Writing .env.prod..."

  cat > .env.prod <<ENVEOF
# =============================================================================
# Gardream — Production Environment
# Generated by scripts/production-setup.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# =============================================================================

# App — PostgreSQL connection
POSTGRES_HOST=${POSTGRES_HOST}
POSTGRES_PORT=${POSTGRES_PORT}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}

# App — Keycloak connection
KEYCLOAK_INTERNAL_URL=${KEYCLOAK_INTERNAL_URL}
KEYCLOAK_PUBLIC_URL=${KEYCLOAK_PUBLIC_URL}
KEYCLOAK_REALM=${KEYCLOAK_REALM}

# App — Backend
SECRET_KEY=${SECRET_KEY}
BACKEND_CORS_ORIGINS='${BACKEND_CORS_ORIGINS}'
LOG_LEVEL=${LOG_LEVEL}
PROJECT_NAME=${PROJECT_NAME}
APP_URL=${APP_URL}

# App — Email / SMTP
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USERNAME=${SMTP_USERNAME}
SMTP_PASSWORD=${SMTP_PASSWORD}
SMTP_FROM_NAME=${SMTP_FROM_NAME}
SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL}
SMTP_ENABLED=${SMTP_ENABLED}

# App — Scheduler
SCHEDULER_TIMEZONE=UTC
MORNING_REMINDER_HOUR=7
MORNING_REMINDER_MINUTE=0
EVENING_REMINDER_HOUR=19
EVENING_REMINDER_MINUTE=0

# App — Garage / S3
GARAGE_ENDPOINT=${GARAGE_ENDPOINT}
GARAGE_REGION=${GARAGE_REGION}
GARAGE_BUCKET=${GARAGE_BUCKET}
GARAGE_ACCESS_KEY=${GARAGE_ACCESS_KEY}
GARAGE_SECRET_KEY=${GARAGE_SECRET_KEY}

# App — Android / Capacitor
APP_ID=${APP_ID}
APP_NAME=${APP_NAME}

# Infra — Keycloak database
KEYCLOAK_DB=${KEYCLOAK_DB}
KEYCLOAK_DB_USER=${KEYCLOAK_DB_USER}
KEYCLOAK_DB_PASSWORD=${KEYCLOAK_DB_PASSWORD}

# Infra — Gateway
GATEWAY_HOSTNAME=${GATEWAY_HOSTNAME}

# Infra — Keycloak admin
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD}

# Infra — Traefik
# Generate new hash: docker run --rm httpd:2-alpine htpasswd -nbB admin yourpassword
TRAEFIK_DASHBOARD_AUTH=${TRAEFIK_DASHBOARD_AUTH}

# Infra — pgAdmin
PGADMIN_DEFAULT_EMAIL=${PGADMIN_DEFAULT_EMAIL}
PGADMIN_DEFAULT_PASSWORD=${PGADMIN_DEFAULT_PASSWORD}
PGADMIN_OAUTH_CLIENT_SECRET=${PGADMIN_OAUTH_CLIENT_SECRET}

# Infra — Webhook
WEBHOOK_SECRET=${WEBHOOK_SECRET}

# Infra — TLS / domain
TLS_MODE=${TLS_MODE}
DOMAIN=${DOMAIN}
ACME_EMAIL=${ACME_EMAIL}
ENVEOF

  success ".env.prod written."
}

write_infra_prod_compose() {
  info "Writing infra/docker-compose.prod.yml..."

  cat > infra/docker-compose.prod.yml <<COMPOSEEOF
# =============================================================================
# Production overrides for infra/docker-compose.yml.
# Generated by scripts/production-setup.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# =============================================================================

services:

  traefik:
    volumes:
      - ./traefik/traefik.prod.yml:/etc/traefik/traefik.yml:ro

  keycloak:
    command: start --import-realm
    environment:
      KC_HOSTNAME: https://\${GATEWAY_HOSTNAME}/keycloak
COMPOSEEOF

  success "infra/docker-compose.prod.yml written."
}

write_traefik_prod_config() {
  info "Writing infra/traefik/traefik.prod.yml..."

  cat > infra/traefik/traefik.prod.yml <<TRAEFIKEOF
# =============================================================================
# Traefik production configuration — Let's Encrypt TLS
# Generated by scripts/production-setup.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# =============================================================================

api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"
    http:
      tls:
        certResolver: letsencrypt

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: proxy-network

certificatesResolvers:
  letsencrypt:
    acme:
      email: ${ACME_EMAIL}
      storage: /etc/traefik/certs/acme.json
      httpChallenge:
        entryPoint: web

log:
  level: INFO
TRAEFIKEOF

  success "infra/traefik/traefik.prod.yml written."
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  check_prereqs

  # Ask all questions
  ask_questions

  # Show summary and confirm
  show_summary

  echo ""
  read -r -p "$(echo -e "${BOLD}Write these files? [Y/n]${NC}: ")" confirm
  if [ -n "$confirm" ] && [ "${confirm,,}" != "y" ] && [ "${confirm,,}" != "yes" ]; then
    info "Aborted. No files were written."
    exit 0
  fi

  # Back up .env.prod if it already exists
  if [ -f .env.prod ]; then
    cp .env.prod .env.prod.bak
    info "Backed up existing .env.prod → .env.prod.bak"
  fi

  # Generate files
  write_env_prod
  write_infra_prod_compose
  write_traefik_prod_config

  # Print next steps
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  Setup Complete — Next Steps${NC}"
  echo -e "${BOLD}══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "  1. Review .env.prod and infra/traefik/traefik.prod.yml"
  echo "  2. Ensure your domain (${DOMAIN}) points to this server's public IP"
  echo "  3. Ensure ports 80 and 443 are open in your firewall"
  echo "  4. Run the production bootstrap:"
  echo ""
  echo -e "     ${BOLD}./run.sh prod:setup${NC}"
  echo ""
  echo "  This will:"
  echo "    • Start all infra services (postgres, keycloak, traefik, etc.)"
  echo "    • Run database migrations"
  echo "    • Import the Keycloak realm"
  echo ""
  echo "  5. After bootstrap, start the app:"
  echo ""
  echo -e "     ${BOLD}./run.sh prod${NC}"
  echo ""
  echo "  Your app will be live at: ${BOLD}https://${DOMAIN}/${NC}"
  echo ""

  success "All files generated. Review them before running prod:setup."
}

main
