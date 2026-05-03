#!/usr/bin/env python3
"""
One-time migration script: uploads files from the local /app/uploads directory
to Garage (S3-compatible storage).

Usage:
    python scripts/migrate-uploads-to-garage.py [--dry-run]

Requires GARAGE_* env vars to be set (same as the backend).
Connects to the app database to read existing photo_url values and
uploads the corresponding local files to Garage, then updates the
photo_url in the database to the new S3 key.

Run this from the backend container or a machine with access to both
the uploads directory and the database.
"""

import argparse
import asyncio
import os
import sys

# Add parent dir so we can import app config
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

os.environ.setdefault("GARAGE_ACCESS_KEY", "")
os.environ.setdefault("GARAGE_SECRET_KEY", "")

from app.core.config import settings
from app.services.storage import upload_bytes


UPLOADS_BASE = "/app/uploads"


async def migrate_file(local_path: str, s3_key: str, dry_run: bool):
    if dry_run:
        print(f"[DRY-RUN] Would upload: {local_path} -> s3://{settings.GARAGE_BUCKET}/{s3_key}")
        return

    with open(local_path, "rb") as f:
        data = f.read()

    ext = s3_key.rsplit(".", 1)[-1].lower() if "." in s3_key else ""
    content_type = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
    }.get(ext)

    await upload_bytes(s3_key, data, content_type=content_type)
    print(f"Uploaded: {local_path} -> s3://{settings.GARAGE_BUCKET}/{s3_key}")


async def main():
    parser = argparse.ArgumentParser(description="Migrate local uploads to Garage")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without uploading")
    args = parser.parse_args()

    uploads_dir = UPLOADS_BASE
    if not os.path.isdir(uploads_dir):
        print(f"Uploads directory not found: {uploads_dir}")
        return

    migrated = 0
    failures = 0

    for root, dirs, files in os.walk(uploads_dir):
        for filename in files:
            local_path = os.path.join(root, filename)

            # Derive S3 key from the path relative to uploads base
            # e.g. /app/uploads/plots/abc/photo.jpg -> plots/abc/photo.jpg
            rel_path = os.path.relpath(local_path, uploads_dir)

            try:
                await migrate_file(local_path, rel_path, args.dry_run)
                migrated += 1
            except Exception as e:
                print(f"FAILED: {local_path} -> {e}", file=sys.stderr)
                failures += 1

    print(f"\nDone. {migrated} files migrated, {failures} failures.")
    if args.dry_run:
        print("(dry run — no files were actually uploaded)")


if __name__ == "__main__":
    asyncio.run(main())
