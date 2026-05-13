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
