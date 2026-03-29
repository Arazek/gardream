#!/usr/bin/env bash
# Runs once on first postgres startup (empty data volume).
# Creates the Keycloak database and user.
# app_db is auto-created by postgres via POSTGRES_DB env var.
set -euo pipefail

KC_USER="${KEYCLOAK_DB_USER:-keycloak}"
KC_PASS="${KEYCLOAK_DB_PASSWORD:-changeme}"
KC_DB="${KEYCLOAK_DB:-keycloak_db}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER ${KC_USER} WITH PASSWORD '${KC_PASS}';
  CREATE DATABASE ${KC_DB} OWNER ${KC_USER};
EOSQL

# Enable extensions on Keycloak's database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$KC_DB" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS timescaledb;
  CREATE EXTENSION IF NOT EXISTS postgis;
  CREATE EXTENSION IF NOT EXISTS postgis_topology;
EOSQL

# Enable extensions on the app database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS timescaledb;
  CREATE EXTENSION IF NOT EXISTS postgis;
  CREATE EXTENSION IF NOT EXISTS postgis_topology;
EOSQL
