import logging
from typing import BinaryIO

import aioboto3

from app.core.config import settings

logger = logging.getLogger(__name__)

session = aioboto3.Session()


def _get_s3_client():
    return session.client(
        "s3",
        endpoint_url=settings.GARAGE_ENDPOINT,
        aws_access_key_id=settings.GARAGE_ACCESS_KEY,
        aws_secret_access_key=settings.GARAGE_SECRET_KEY,
        region_name=settings.GARAGE_REGION,
    )


async def upload_fileobj(
    key: str,
    file: BinaryIO,
    content_type: str | None = None,
) -> str:
    async with _get_s3_client() as s3:
        kwargs = {
            "Bucket": settings.GARAGE_BUCKET,
            "Key": key,
            "Body": file,
        }
        if content_type:
            kwargs["ContentType"] = content_type
        await s3.put_object(**kwargs)
    logger.info("Uploaded s3://%s/%s", settings.GARAGE_BUCKET, key)
    return key


async def upload_bytes(
    key: str,
    data: bytes,
    content_type: str | None = None,
) -> str:
    async with _get_s3_client() as s3:
        kwargs = {
            "Bucket": settings.GARAGE_BUCKET,
            "Key": key,
            "Body": data,
        }
        if content_type:
            kwargs["ContentType"] = content_type
        await s3.put_object(**kwargs)
    logger.info("Uploaded s3://%s/%s", settings.GARAGE_BUCKET, key)
    return key


async def get_presigned_url(key: str, expires_in: int = 86400) -> str:
    async with _get_s3_client() as s3:
        url = await s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.GARAGE_BUCKET, "Key": key},
            ExpiresIn=expires_in,
        )
    return url


async def get_object(key: str) -> bytes:
    async with _get_s3_client() as s3:
        response = await s3.get_object(
            Bucket=settings.GARAGE_BUCKET,
            Key=key,
        )
        data = await response["Body"].read()
    return data


async def delete_object(key: str) -> None:
    async with _get_s3_client() as s3:
        await s3.delete_object(
            Bucket=settings.GARAGE_BUCKET,
            Key=key,
        )
    logger.info("Deleted s3://%s/%s", settings.GARAGE_BUCKET, key)
