#!/usr/bin/env python3
"""
Load crops from JSON staging file into PostgreSQL database.

This script inserts crop data from crops_staging.json into the app_db database.
It uses docker exec to run psql directly in the postgres container, bypassing
any authentication issues.

Usage:
    ./scripts/load_crops.py                    # Load all crops
    ./scripts/load_crops.py --limit 50         # Load first 50 crops (test mode)
    ./scripts/load_crops.py --input file.json  # Load from different file
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


def load_crops_json(filepath: str) -> list[dict]:
    """Load crops from JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        crops = json.load(f)
    return crops if isinstance(crops, list) else []


def build_insert_sql(crop: dict) -> str:
    """Build a single INSERT statement for a crop."""
    # Escape single quotes in string fields
    def esc(val):
        if val is None:
            return "NULL"
        if isinstance(val, bool):
            return "true" if val else "false"
        if isinstance(val, (int, float)):
            return str(val)
        # String: escape single quotes
        s = str(val).replace("'", "''")
        return f"'{s}'"

    # Convert soil_mix dict to JSON string
    soil_mix = json.dumps(crop.get("soil_mix")) if crop.get("soil_mix") else None
    soil_mix_sql = esc(soil_mix)

    # Convert arrays to text array format ('{elem1,elem2,...}')
    def array_to_sql(arr):
        if not arr:
            return "'{}'::text[]"
        # Escape each element and join with commas
        escaped = [str(e).replace("'", "''") for e in arr]
        joined = ",".join(escaped)
        return f"'{{{joined}}}'::text[]"

    companion = array_to_sql(crop.get("companion_crops", []))
    avoid = array_to_sql(crop.get("avoid_crops", []))

    sql = f"""
    INSERT INTO crops (
        id, name, latin_name, category, description, thumbnail_url,
        days_to_germination, days_to_harvest,
        watering_frequency_days, fertilise_frequency_days,
        prune_frequency_days, prune_start_day,
        sun_requirement, spacing_cm, soil_mix,
        companion_crops, avoid_crops, created_at, updated_at
    ) VALUES (
        {esc(crop.get('id'))},
        {esc(crop.get('name'))},
        {esc(crop.get('latin_name'))},
        {esc(crop.get('category'))}::crop_category,
        {esc(crop.get('description'))},
        {esc(crop.get('thumbnail_url'))},
        {crop.get('days_to_germination') or 'NULL'},
        {crop.get('days_to_harvest') or 'NULL'},
        {crop.get('watering_frequency_days') or 'NULL'},
        {crop.get('fertilise_frequency_days') or 'NULL'},
        {crop.get('prune_frequency_days') or 'NULL'},
        {crop.get('prune_start_day') or 'NULL'},
        {esc(crop.get('sun_requirement'))}::sun_requirement,
        {crop.get('spacing_cm') or 'NULL'},
        {soil_mix_sql}::jsonb,
        {companion},
        {avoid},
        {esc(crop.get('created_at'))},
        {esc(crop.get('updated_at'))}
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        latin_name = EXCLUDED.latin_name,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        thumbnail_url = EXCLUDED.thumbnail_url,
        days_to_germination = EXCLUDED.days_to_germination,
        days_to_harvest = EXCLUDED.days_to_harvest,
        watering_frequency_days = EXCLUDED.watering_frequency_days,
        fertilise_frequency_days = EXCLUDED.fertilise_frequency_days,
        prune_frequency_days = EXCLUDED.prune_frequency_days,
        prune_start_day = EXCLUDED.prune_start_day,
        sun_requirement = EXCLUDED.sun_requirement,
        spacing_cm = EXCLUDED.spacing_cm,
        soil_mix = EXCLUDED.soil_mix,
        companion_crops = EXCLUDED.companion_crops,
        avoid_crops = EXCLUDED.avoid_crops,
        updated_at = EXCLUDED.updated_at;
    """
    return sql.strip()


def insert_crops_via_docker(crops: list[dict], clear: bool = False) -> bool:
    """Insert crops using docker exec + psql."""
    if not crops:
        print("No crops to insert.")
        return True

    # Build SQL statements
    sql_statements = ["BEGIN;"]

    if clear:
        sql_statements.append("DELETE FROM crops;")

    for crop in crops:
        sql_statements.append(build_insert_sql(crop))

    sql_statements.append("COMMIT;")
    sql_script = "\n".join(sql_statements)

    # Write to temp file
    temp_file = "/tmp/load_crops.sql"
    with open(temp_file, "w") as f:
        f.write(sql_script)

    # Copy to container and execute
    try:
        print(f"📤 Copying SQL to container...")
        subprocess.run(
            ["docker", "cp", temp_file, "postgres:/tmp/load_crops.sql"],
            check=True,
            capture_output=True,
        )

        print(f"⚙️  Executing {len(crops)} INSERT statements...")
        result = subprocess.run(
            [
                "docker",
                "exec",
                "postgres",
                "psql",
                "-U",
                "appuser",
                "-d",
                "app_db",
                "-f",
                "/tmp/load_crops.sql",
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print(f"❌ Error executing SQL:")
            print(result.stderr)
            return False

        # Clean up
        subprocess.run(
            ["docker", "exec", "postgres", "rm", "-f", "/tmp/load_crops.sql"],
            capture_output=True,
        )

        print(f"✅ Successfully inserted {len(crops)} crops!")

        # Show final count
        result = subprocess.run(
            [
                "docker",
                "exec",
                "postgres",
                "psql",
                "-U",
                "appuser",
                "-d",
                "app_db",
                "-t",
                "-c",
                "SELECT COUNT(*) FROM crops;",
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            count = result.stdout.strip()
            print(f"📊 Total crops in database: {count}")

        return True

    except subprocess.CalledProcessError as e:
        print(f"❌ Docker command failed: {e}")
        return False
    finally:
        # Cleanup local temp file
        Path(temp_file).unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Load crops from JSON into PostgreSQL database."
    )
    parser.add_argument(
        "--input",
        default="scripts/crops_staging.json",
        help="Input JSON file (default: scripts/crops_staging.json)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of crops to load (for testing)",
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Delete all existing crops before loading",
    )
    args = parser.parse_args()

    # Load JSON
    try:
        crops = load_crops_json(args.input)
    except FileNotFoundError:
        print(f"❌ File not found: {args.input}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        sys.exit(1)

    if not crops:
        print("❌ No crops found in JSON file")
        sys.exit(1)

    print(f"📂 Loaded {len(crops)} crops from {args.input}")

    # Apply limit if specified
    if args.limit:
        crops = crops[: args.limit]
        print(f"🔍 Limited to {len(crops)} crops for testing")

    # Show statistics
    stats = {}
    for crop in crops:
        cat = crop.get("category", "unknown")
        stats[cat] = stats.get(cat, 0) + 1

    print(f"\n📊 Crop categories:")
    for cat, count in sorted(stats.items()):
        print(f"   {cat:<15} {count:>4}")

    if args.clear:
        print(f"\n⚠️  CLEAR mode: will DELETE ALL existing crops first")

    print(f"\n⏳ Inserting {len(crops)} crops...")

    # Insert via docker
    success = insert_crops_via_docker(crops, args.clear)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
