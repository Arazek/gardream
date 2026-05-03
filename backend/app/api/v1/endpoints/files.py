import logging

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response

from app.services.storage import get_object, get_presigned_url

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/files/{key:path}")
async def download_file(
    key: str,
):
    """
    Serve a file from Garage. No auth required — the S3 key contains
    a UUID so URLs are unguessable. Upload/delete endpoints remain
    auth-protected.
    """
    try:
        data = await get_object(key)
    except Exception as exc:
        logger.warning("File not found: %s (%s)", key, exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    content_type = _infer_content_type(key)
    return Response(content=data, media_type=content_type)


@router.get("/files/{key:path}/presigned")
async def presigned_url(
    key: str,
):
    try:
        url = await get_presigned_url(key)
    except Exception as exc:
        logger.warning("Failed to generate presigned URL: %s (%s)", key, exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    return {"url": url}


def _infer_content_type(key: str) -> str:
    ext = key.rsplit(".", 1)[-1].lower() if "." in key else ""
    return {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
        "svg": "image/svg+xml",
        "pdf": "application/pdf",
    }.get(ext, "application/octet-stream")
