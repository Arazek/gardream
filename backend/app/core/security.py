"""
JWT verification via Keycloak JWKS endpoint.
The backend never talks to Google/Facebook — only verifies Keycloak-issued tokens.
"""

import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, status

from app.core.config import settings

_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.KEYCLOAK_JWKS_URL)
            response.raise_for_status()
            _jwks_cache = response.json()
    return _jwks_cache


def _invalidate_jwks_cache() -> None:
    global _jwks_cache
    _jwks_cache = None


async def verify_token(token: str) -> dict:
    """
    Verify a Keycloak JWT and return the decoded claims.
    Raises HTTP 401 on any verification failure.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        jwks = await _get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience="account",
            issuer=settings.KEYCLOAK_ISSUER,
            options={"verify_aud": False},
        )
        return payload
    except JWTError:
        # Try refreshing JWKS in case of key rotation
        _invalidate_jwks_cache()
        raise credentials_exception
    except Exception:
        raise credentials_exception
