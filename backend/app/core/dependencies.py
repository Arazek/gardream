from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from app.core.security import verify_token
from app.db.session import AsyncSession, async_session_factory
from app.models.user_profile import UserProfile

bearer_scheme = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    user = await verify_token(credentials.credentials)

    # Upsert user profile so the scheduler can find email addresses
    email = user.get("email")
    name = user.get("name") or user.get("preferred_username")
    if email:
        result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user["sub"])
        )
        profile = result.scalar_one_or_none()
        if profile is None:
            db.add(UserProfile(user_id=user["sub"], email=email, display_name=name))
            await db.commit()
        elif profile.email != email or profile.display_name != name:
            profile.email = email
            profile.display_name = name
            await db.commit()

    return user


async def require_role(role: str):
    async def _check(user: dict = Depends(get_current_user)) -> dict:
        realm_roles: list = (
            user.get("realm_access", {}).get("roles", [])
        )
        if role not in realm_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' required",
            )
        return user
    return _check
