from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List,Optional

from app.models.user import User
from app.schemas.user import UserCreate, UserPublic, UserUpdate, UserDeletedResponse
from app.database import get_session
from app.utils.auth import (
    get_current_user,
    get_current_active_superuser,
    hash_password
)
from pydantic import BaseModel, EmailStr
from app.utils.auth import hash_password, verify_password

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_superuser)
):
    existing_user = session.exec(select(User).where(User.email == user.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    db_user = User(
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        password=hash_password(user.password),
        is_superuser=user.is_superuser
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UserPublic])
def list_users(
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_superuser)
):
    users = session.exec(select(User)).all()
    return users


@router.get("/me", response_model=UserPublic)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/{user_id}", response_model=UserPublic)
def get_user(
    user_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_active_superuser)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserPublic)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Authorization
    if db_user.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Password change
    if user_update.password:
        if not current_user.is_superuser:
            if not user_update.old_password:
                raise HTTPException(status_code=400, detail="Current password required")
            if not verify_password(user_update.old_password, db_user.password):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
        db_user.password = hash_password(user_update.password)

    # Update other fields
    update_data = user_update.dict(exclude_unset=True, exclude={"old_password", "password"})
    for key, value in update_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserPublic)
def replace_user(
    user_id: int,
    user_update: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if db_user.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(db_user, field, value)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.delete("/{user_id}", response_model=UserDeletedResponse)
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")    
    
    if db_user.id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")

    deleted_user = UserDeletedResponse(id=db_user.id, email=db_user.email)
    session.delete(db_user)
    session.commit()
    return deleted_user
