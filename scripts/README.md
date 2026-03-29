# Crop Management Scripts

This directory contains scripts for fetching edible plant data and populating the crops database.

## Prerequisites

- Docker (for running PostgreSQL container)
- Python 3.8+
- `jq` (for JSON processing in fetch_crops.py)

Python dependencies for fetch_crops.py:
```bash
pip install requests
```

## Quick Start

### 1. Fetch Crop Data from Trefle API

Fetch plant data from [Trefle.io](https://trefle.io) and save to `crops_staging.json`:

```bash
# Get a free Trefle API token at https://trefle.io/users/sign_up
python scripts/fetch_crops.py --token YOUR_TOKEN

# Quick test (limit to 1 page = 100 plants):
python scripts/fetch_crops.py --token YOUR_TOKEN --max-pages 1

# Enrich with detailed plant info (slower, more data):
python scripts/fetch_crops.py --token YOUR_TOKEN --enrich
```

**Output:** `scripts/crops_staging.json` (ready for loading into database)

### 2. Load Crops into Database

Load the staging JSON file into PostgreSQL:

```bash
# Load all crops
./scripts/load_crops.py

# Test mode: load first 50 crops
./scripts/load_crops.py --limit 50

# Clear existing crops and load fresh data
./scripts/load_crops.py --clear

# Load from a different file
./scripts/load_crops.py --input custom_crops.json
```

## Script Details

### `fetch_crops.py`

Fetches edible plant data from the Trefle API and produces a staging JSON file.

**Features:**
- Automatic rate limiting (respects Trefle's 120 req/min limit)
- Category detection (vegetable, herb, fruit, flower)
- Sun requirement mapping (shade, partial_shade, full_sun)
- Default growing schedules per category
- Idempotent (safe to re-run)

**Options:**
- `--token TOKEN` (required) — Trefle API token
- `--max-pages N` — Limit to N pages per filter (100 plants/page)
- `--enrich` — Fetch full detail per plant (slower, more complete)
- `--insert` — Insert into PostgreSQL after fetching (deprecated, use load_crops.py instead)
- `--output PATH` — Output file path (default: `scripts/crops_staging.json`)

### `load_crops.py`

Loads crop data from JSON into PostgreSQL database using docker exec + psql.

**Features:**
- Fast batch insertion via docker exec (no authentication issues)
- Automatic database schema handling
- Upsert logic (insert or update if exists by ID)
- Progress indication and statistics
- Category breakdown before insertion

**Options:**
- `--input FILE` — Input JSON file (default: `scripts/crops_staging.json`)
- `--limit N` — Load only first N crops (for testing)
- `--clear` — Delete all existing crops before loading

**How it works:**
1. Loads JSON from `crops_staging.json`
2. Generates SQL INSERT statements
3. Uses `docker exec` to run `psql` inside the postgres container
4. Executes the SQL via container's peer authentication (no password needed)
5. Reports success/failure and final count

## Common Tasks

### Quick Test: Fetch and Load Sample Data

```bash
# Fetch 100 plants from Trefle
python scripts/fetch_crops.py --token YOUR_TOKEN --max-pages 1

# Load first 50 into database
./scripts/load_crops.py --limit 50

# Verify in database
docker exec postgres psql -U appuser -d app_db -c "SELECT COUNT(*) FROM crops;"
```

### Refresh All Crops

```bash
# Fetch latest data from Trefle (with enrichment)
python scripts/fetch_crops.py --token YOUR_TOKEN --enrich

# Clear old crops and load new ones
./scripts/load_crops.py --clear
```

### Check What's in the Database

```bash
# Count by category
docker exec postgres psql -U appuser -d app_db -c "
  SELECT category, COUNT(*) FROM crops GROUP BY category ORDER BY count DESC;
"

# Show sample crops
docker exec postgres psql -U appuser -d app_db -c "
  SELECT name, category, days_to_harvest FROM crops LIMIT 10;
"

# Get statistics
docker exec postgres psql -U appuser -d app_db -c "
  SELECT
    COUNT(*) as total,
    COUNT(DISTINCT category) as categories,
    AVG(days_to_harvest) as avg_days_to_harvest
  FROM crops;
"
```

## Data Schema

Crops are stored with the following attributes:

```json
{
  "id": "UUID",
  "name": "Common name",
  "latin_name": "Scientific name",
  "category": "vegetable|herb|fruit|flower",
  "description": "Short description",
  "thumbnail_url": "Image URL",
  "days_to_germination": 10,
  "days_to_harvest": 75,
  "watering_frequency_days": 2,
  "fertilise_frequency_days": 21,
  "prune_frequency_days": null,
  "prune_start_day": null,
  "sun_requirement": "full_sun|partial_shade|shade",
  "spacing_cm": 30,
  "soil_mix": {
    "name": "Vegetable Mix",
    "topsoil_pct": 40,
    "compost_pct": 40,
    "perlite_pct": 20,
    "description": "Rich, well-draining mix for productive vegetables."
  },
  "companion_crops": [],
  "avoid_crops": [],
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

## Troubleshooting

**Docker not running:**
```bash
# Start docker daemon
sudo systemctl start docker

# Or start via run.sh
./run.sh infra:start
./run.sh dev
```

**Crops not showing in database:**
```bash
# Check total count
docker exec postgres psql -U appuser -d app_db -c "SELECT COUNT(*) FROM crops;"

# Check for errors (look at script output for detailed error messages)
./scripts/load_crops.py --limit 5 2>&1 | head -20
```

**File not found errors:**
Ensure you're running scripts from the project root:
```bash
cd /path/to/gardream
./scripts/load_crops.py
```

**Invalid schema:**
If you see column name errors, the database schema may be outdated. Run migrations:
```bash
./run.sh db:migrate
```
