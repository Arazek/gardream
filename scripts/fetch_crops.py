#!/usr/bin/env python3
"""
Fetch edible plant data from the Trefle API (https://trefle.io)
and produce a staging JSON database ready for import into the app.

SETUP
-----
1. Register for a free account at https://trefle.io/users/sign_up
2. Copy your API token from your profile page.
3. Run:
      python scripts/fetch_crops.py --token sk-YOUR_TOKEN_HERE

USAGE
-----
    # Fetch edible crops and save to crops_staging.json (default):
    python scripts/fetch_crops.py --token YOUR_TOKEN

    # Limit to N pages (100 plants/page) — handy for a quick test:
    python scripts/fetch_crops.py --token YOUR_TOKEN --max-pages 5

    # Also insert directly into the running PostgreSQL container:
    python scripts/fetch_crops.py --token YOUR_TOKEN --insert

    # Enrich each plant with a second detail request (more data, slower):
    python scripts/fetch_crops.py --token YOUR_TOKEN --enrich

NOTES
-----
- Trefle free tier: 120 requests/minute. The script respects this automatically.
- The staging JSON is idempotent — re-running overwrites the file.
- Companion planting data is NOT available in Trefle; it is left empty and
  can be enriched manually or via a separate source later.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import Any

try:
    import requests
except ImportError:
    print("[!] requests not installed. Run: pip install requests")
    sys.exit(1)


# ── Config ────────────────────────────────────────────────────────────────────

TREFLE_BASE = "https://trefle.io/api/v1"
PER_PAGE = 100
# 120 req/min → 0.25 s gap keeps us safely under the limit
RATE_LIMIT_DELAY = 0.25
OUTPUT_FILE = "scripts/crops_staging.json"

# Trefle filter key constants
F_EDIBLE = "filter[edible]"
F_VEGETABLE = "filter[vegetable]"
F_FAMILY = "filter[family_common_name]"


# ── Category detection ────────────────────────────────────────────────────────

HERB_FAMILIES = {
    "lamiaceae", "apiaceae", "asteraceae",
    "verbenaceae", "boraginaceae",
}
HERB_KEYWORDS = {
    "basil", "mint", "thyme", "rosemary", "sage", "oregano", "parsley",
    "coriander", "cilantro", "dill", "fennel", "chive", "tarragon",
    "lavender", "lemon balm", "marjoram", "bay", "chervil", "lovage",
    "savory", "borage", "chamomile", "lemongrass",
}
FRUIT_FAMILIES = {
    "rosaceae", "rutaceae", "vitaceae", "cucurbitaceae", "solanaceae",
    "moraceae", "ericaceae", "actinidiaceae",
}
FRUIT_KEYWORDS = {
    "tomato", "strawberry", "raspberry", "blueberry", "grape", "melon",
    "watermelon", "cucumber", "courgette", "zucchini", "pumpkin", "squash",
    "apple", "pear", "plum", "cherry", "peach", "apricot", "fig",
    "citrus", "lemon", "orange", "lime", "kiwi", "gooseberry",
    "blackberry", "blackcurrant", "redcurrant",
}
FLOWER_KEYWORDS = {
    "flower", "marigold", "nasturtium", "sunflower", "calendula",
    "pansy", "zinnia", "dahlia", "echinacea", "viola", "rose",
    "pelargonium", "petunia",
}


def detect_category(plant: dict) -> str:
    name = (plant.get("common_name") or plant.get("scientific_name") or "").lower()
    family = (plant.get("family") or "").lower()
    edible_parts = plant.get("edible_part") or []

    # Herbs: name match OR family match, but roots (carrots) stay as vegetables
    if (any(k in name for k in HERB_KEYWORDS) or family in HERB_FAMILIES) \
            and "root" not in edible_parts:
        return "herb"

    if any(k in name for k in FLOWER_KEYWORDS):
        return "flower"

    if any(k in name for k in FRUIT_KEYWORDS) \
            or family in FRUIT_FAMILIES \
            or "fruits" in edible_parts:
        return "fruit"

    return "vegetable"


# ── Sun requirement mapping ───────────────────────────────────────────────────
# Trefle growth.light: integer 0–10
# 0–3 → shade, 4–6 → partial_shade, 7–10 → full_sun

def map_sun(light: int | None) -> str:
    if light is None:
        return "full_sun"
    if light <= 3:
        return "shade"
    if light <= 6:
        return "partial_shade"
    return "full_sun"


# ── Growing schedule defaults (per category) ─────────────────────────────────

DEFAULTS: dict[str, dict[str, Any]] = {
    "vegetable": {
        "days_to_germination": 10,
        "days_to_harvest": 75,
        "watering_frequency_days": 2,
        "fertilise_frequency_days": 21,
        "prune_frequency_days": None,
        "prune_start_day": None,
        "soil_mix": {
            "name": "Vegetable Mix",
            "topsoil_pct": 40,
            "compost_pct": 40,
            "perlite_pct": 20,
            "description": "Rich, well-draining mix for productive vegetables.",
        },
    },
    "herb": {
        "days_to_germination": 14,
        "days_to_harvest": 60,
        "watering_frequency_days": 3,
        "fertilise_frequency_days": 30,
        "prune_frequency_days": 21,
        "prune_start_day": 30,
        "soil_mix": {
            "name": "Herb Mix",
            "topsoil_pct": 50,
            "compost_pct": 30,
            "perlite_pct": 20,
            "description": "Light, free-draining mix herbs thrive in.",
        },
    },
    "fruit": {
        "days_to_germination": 21,
        "days_to_harvest": 120,
        "watering_frequency_days": 3,
        "fertilise_frequency_days": 28,
        "prune_frequency_days": 60,
        "prune_start_day": 60,
        "soil_mix": {
            "name": "Fruit Mix",
            "topsoil_pct": 35,
            "compost_pct": 45,
            "perlite_pct": 20,
            "description": "Deep, fertile mix for fruiting plants.",
        },
    },
    "flower": {
        "days_to_germination": 12,
        "days_to_harvest": 90,
        "watering_frequency_days": 3,
        "fertilise_frequency_days": 28,
        "prune_frequency_days": 30,
        "prune_start_day": 45,
        "soil_mix": {
            "name": "Flower Mix",
            "topsoil_pct": 45,
            "compost_pct": 35,
            "perlite_pct": 20,
            "description": "Balanced mix for colourful blooms.",
        },
    },
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_days(raw: str | None) -> int | None:
    """Average the numbers in strings like '70', '70-90', or '70, 90'."""
    if not raw:
        return None
    nums = re.findall(r"\d+", str(raw))
    if nums:
        values = [int(n) for n in nums]
        return sum(values) // len(values)
    return None


def _cm_from_range(val: dict) -> int | None:
    """Extract a centimetre value from a Trefle {minimum, maximum} range dict."""
    hi = val.get("maximum") or val.get("minimum")
    lo = val.get("minimum") or val.get("maximum")
    if hi and lo:
        try:
            return max(5, int((float(hi) + float(lo)) / 2))
        except (ValueError, TypeError):
            pass
    if hi:
        try:
            return max(5, int(float(hi)))
        except (ValueError, TypeError):
            pass
    return None


def spacing_from_growth(growth: dict | None) -> int:
    """Derive spacing in cm from Trefle growth fields."""
    if not growth:
        return 30
    for key in ("row_spacing", "spread"):
        val = growth.get(key) or {}
        if isinstance(val, dict):
            result = _cm_from_range(val)
            if result:
                return result
        elif val:
            try:
                return max(5, int(float(val)))
            except (ValueError, TypeError):
                pass
    return 30


def best_image(images_block: dict | None) -> str | None:
    """Return the first available image URL from Trefle's images object."""
    if not images_block:
        return None
    for group in images_block.values():
        if isinstance(group, list) and group:
            url = group[0].get("image_url") or group[0].get("original_url")
            if url:
                return url
    return None


def _is_edible(data: dict) -> bool:
    """Return False only when Trefle explicitly marks a record as non-edible."""
    edible = data.get("edible")
    vegetable = data.get("vegetable")
    edible_parts = data.get("edible_part") or []
    return not (edible is False and vegetable is False and not edible_parts)


def _resolve_name(data: dict) -> tuple[str, str] | None:
    """Return (common_name, latin_name) or None if unusable."""
    latin = (data.get("scientific_name") or "").strip()
    if not latin:
        return None
    name = (data.get("common_name") or "").strip()
    if not name:
        name = latin.split()[0].capitalize()
    if len(name) < 2:
        return None
    return name, latin


# ── Transformation ────────────────────────────────────────────────────────────

def transform(data: dict) -> dict | None:
    """
    Map a Trefle species record to our crop schema.
    Returns None if the record is unsuitable.
    """
    names = _resolve_name(data)
    if names is None:
        return None
    name, latin = names

    if not _is_edible(data):
        return None

    category = detect_category(data)
    defaults = DEFAULTS[category]
    growth = data.get("growth") or {}

    description = (data.get("observations") or "").strip() or None
    if description and len(description) > 1000:
        description = description[:997] + "…"

    now = datetime.now(timezone.utc).isoformat()

    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "latin_name": latin,
        "category": category,
        "description": description,
        "thumbnail_url": data.get("image_url") or best_image(data.get("images")),
        "days_to_germination": defaults["days_to_germination"],
        "days_to_harvest": defaults["days_to_harvest"],
        "watering_frequency_days": defaults["watering_frequency_days"],
        "fertilise_frequency_days": defaults["fertilise_frequency_days"],
        "prune_frequency_days": defaults["prune_frequency_days"],
        "prune_start_day": defaults["prune_start_day"],
        "sun_requirement": map_sun(growth.get("light")),
        "spacing_cm": spacing_from_growth(growth),
        "soil_mix": defaults["soil_mix"],
        "companion_crops": [],  # not available in Trefle
        "avoid_crops": [],
        "created_at": now,
        "updated_at": now,
    }


# ── API client ────────────────────────────────────────────────────────────────

class TrefleClient:
    def __init__(self, token: str) -> None:
        self.token = token
        self.session = requests.Session()
        self.session.headers["Accept"] = "application/json"

    def _get(self, url: str, params: dict | None = None) -> dict:
        p = {"token": self.token, **(params or {})}
        resp = self.session.get(url, params=p, timeout=20)
        resp.raise_for_status()
        return resp.json()

    def species_page(self, page: int, filters: dict | None = None) -> tuple[list[dict], int]:
        """Return (records, total_pages)."""
        params: dict = {"page": page, "per_page": PER_PAGE}
        if filters:
            params.update(filters)
        data = self._get(f"{TREFLE_BASE}/species", params)
        records = data.get("data") or []
        meta = data.get("meta") or {}
        total = meta.get("total", 0)
        total_pages = (total + PER_PAGE - 1) // PER_PAGE if total else 1
        return records, total_pages

    def species_detail(self, slug: str) -> dict | None:
        try:
            data = self._get(f"{TREFLE_BASE}/species/{slug}")
            return data.get("data")
        except requests.HTTPError:
            return None


# ── Fetch strategies ──────────────────────────────────────────────────────────

FILTER_SETS: list[tuple[str, dict]] = [
    ("edible vegetables",             {F_VEGETABLE: "true", F_EDIBLE: "true"}),
    ("edible non-veg",                {F_EDIBLE: "true", F_VEGETABLE: "false"}),
    ("solanaceae",                    {F_FAMILY: "Nightshade family"}),
    ("apiaceae (umbellifers)",        {F_FAMILY: "Carrot family"}),
    ("brassicaceae",                  {F_FAMILY: "Mustard family"}),
    ("lamiaceae (mints)",             {F_FAMILY: "Mint family"}),
    ("rosaceae (stone fruits)",       {F_FAMILY: "Rose family"}),
    ("cucurbitaceae (gourds)",        {F_FAMILY: "Cucumber family"}),
    ("alliaceae (onions)",            {F_FAMILY: "Onion family"}),
    ("fabaceae (legumes)",            {F_FAMILY: "Pea family"}),
    ("asteraceae (daisies)",          {F_FAMILY: "Daisy family"}),
]


def _process_page_records(
    records: list[dict],
    seen_slugs: set[str],
    client: TrefleClient,
    enrich: bool,
) -> list[dict]:
    """Transform a page of records, deduplicating by slug."""
    crops: list[dict] = []
    for rec in records:
        slug = rec.get("slug") or rec.get("scientific_name", "").lower().replace(" ", "-")
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)

        if enrich:
            detail = client.species_detail(slug)
            if detail:
                rec = {**rec, **detail}
            time.sleep(RATE_LIMIT_DELAY)

        crop = transform(rec)
        if crop:
            crops.append(crop)
    return crops


def _fetch_filter(
    label: str,
    filters: dict,
    client: TrefleClient,
    seen_slugs: set[str],
    max_pages: int | None,
    enrich: bool,
) -> list[dict]:
    """Fetch all pages for a single filter group and return transformed crops."""
    crops: list[dict] = []
    page = 1
    print(f"\n▸ Fetching: {label}")

    while True:
        if max_pages and page > max_pages:
            print(f"  ↳ max-pages limit ({max_pages}) reached.")
            break

        print(f"  Page {page}…", end=" ", flush=True)
        try:
            records, total_pages = client.species_page(page, filters)
        except requests.RequestException as exc:
            print(f"failed ({exc})")
            break

        if not records:
            print("empty.")
            break

        new_crops = _process_page_records(records, seen_slugs, client, enrich)
        crops.extend(new_crops)
        print(f"{len(new_crops)} kept")

        if page >= total_pages:
            break

        page += 1
        time.sleep(RATE_LIMIT_DELAY)

    return crops


def fetch_all(
    client: TrefleClient,
    max_pages_per_filter: int | None,
    enrich: bool,
) -> list[dict]:
    seen_slugs: set[str] = set()
    crops: list[dict] = []

    for label, filters in FILTER_SETS:
        batch = _fetch_filter(label, filters, client, seen_slugs, max_pages_per_filter, enrich)
        crops.extend(batch)
        print(f"  Running total: {len(crops)}")

    return crops


# ── DB insertion ──────────────────────────────────────────────────────────────

INSERT_SQL = """
    INSERT INTO crops (
        id, name, latin_name, category, description, thumbnail_url,
        days_to_germination, days_to_harvest,
        watering_frequency_days, fertilise_frequency_days,
        prune_frequency_days, prune_start_day,
        sun_requirement, spacing_cm, soil_mix,
        companion_crops, avoid_crops, created_at, updated_at
    ) VALUES (
        %(id)s, %(name)s, %(latin_name)s,
        %(category)s::crop_category, %(description)s, %(thumbnail_url)s,
        %(days_to_germination)s, %(days_to_harvest)s,
        %(watering_frequency_days)s, %(fertilise_frequency_days)s,
        %(prune_frequency_days)s, %(prune_start_day)s,
        %(sun_requirement)s::sun_requirement, %(spacing_cm)s,
        %(soil_mix)s, %(companion_crops)s, %(avoid_crops)s,
        %(created_at)s, %(updated_at)s
    )
    ON CONFLICT DO NOTHING
"""


def _db_connect():
    import os
    import psycopg2  # noqa: PLC0415
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return psycopg2.connect(db_url)
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "arboretum"),
        user=os.getenv("DB_USER", "arboretum"),
        password=os.getenv("DB_PASSWORD", "arboretum"),
    )


def insert_into_db(crops: list[dict]) -> None:
    try:
        conn = _db_connect()
    except ImportError:
        print("\n[!] psycopg2 not installed. Run: pip install psycopg2-binary")
        sys.exit(1)

    cur = conn.cursor()
    inserted = skipped = 0

    for crop in crops:
        try:
            cur.execute(INSERT_SQL, {
                **crop,
                "soil_mix": json.dumps(crop["soil_mix"]) if crop["soil_mix"] else None,
            })
            inserted += 1
        except Exception as exc:
            conn.rollback()
            print(f"  [!] Skipped '{crop['name']}': {exc}", file=sys.stderr)
            skipped += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nDB: {inserted} inserted, {skipped} skipped.")


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch edible plant data from Trefle and build a crop staging database."
    )
    parser.add_argument(
        "--token", required=True,
        help="Trefle API token (free at https://trefle.io/users/sign_up).",
    )
    parser.add_argument(
        "--max-pages", type=int, default=None,
        help="Max pages per filter group (100 plants/page). Omit to fetch all.",
    )
    parser.add_argument(
        "--enrich", action="store_true",
        help="Fetch full detail per plant (slower, more data: sun, spacing, description).",
    )
    parser.add_argument(
        "--insert", action="store_true",
        help="Insert into PostgreSQL after fetching.",
    )
    parser.add_argument(
        "--output", default=OUTPUT_FILE,
        help="Output JSON path (default: " + OUTPUT_FILE + ").",
    )
    args = parser.parse_args()

    client = TrefleClient(args.token)
    try:
        client.species_page(1, {F_EDIBLE: "true"})
    except requests.HTTPError as exc:
        if exc.response is not None and exc.response.status_code in (401, 403):
            print("[!] Invalid API token. Register at https://trefle.io/users/sign_up")
            sys.exit(1)
        raise

    crops = fetch_all(client, args.max_pages, args.enrich)

    if not crops:
        print("No crops fetched.")
        sys.exit(1)

    # Final deduplication by name + latin_name in case filter sets overlapped
    seen: set[str] = set()
    unique: list[dict] = []
    for c in crops:
        key = c["name"].lower() + "|" + c["latin_name"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(c)
    crops = unique

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(crops, f, ensure_ascii=False, indent=2)

    stats = {cat: sum(1 for c in crops if c["category"] == cat)
             for cat in ("vegetable", "herb", "fruit", "flower")}

    print(f"\n✓ {len(crops)} crops saved to {args.output}")
    for cat, n in stats.items():
        print(f"  {cat:<12} {n}")

    if args.insert:
        insert_into_db(crops)


if __name__ == "__main__":
    main()
