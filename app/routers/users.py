from fastapi import APIRouter, HTTPException, Depends, Security
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from pydantic import EmailStr
from app.schemas.users import NewUser, Token
from app.crud.users import get_all_users, create_user, authenticate_user, delete_user, get_current_user, create_access_token
from app.models.user import User
from datetime import timedelta
from app.settings import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

@router.get("/", tags=["users"])
def read_users(current_user: Annotated[User, Security(get_current_user, scopes=["admin"])]):
    return list(get_all_users())

@router.post("/", tags=["users"])
def create_user(new_user: NewUser, current_user: Annotated[User, Security(get_current_user, scopes=["admin"])]):
    if create_user(new_user):
        return {"status": "success"}
    else:
        raise HTTPException(status_code=500, detail="Creation was unsuccessful")

@router.get("/me", tags=["users"])
def get_me(current_user: Annotated[User, Security(get_current_user)]):
    return current_user

@router.post("/delete", tags=["users"])
def delete_user(email: EmailStr, current_user: Annotated[User, Security(get_current_user, scopes=["admin"])]):
    if delete_user(email):
        return {"status": "success"}
    else:
        raise HTTPException(status_code=500, detail="Creation was unsuccessful")

def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"email": user.email, "admin": user.admin},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")