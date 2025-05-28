from app.models.user import User
from app.schemas.users import *
from app.db import users
from fastapi import HTTPException, Depends, status, Security
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
import jwt
from jwt.exceptions import InvalidTokenError
from app.settings import JWT_SECRET
from passlib.context import CryptContext
from typing import Annotated
from pydantic import ValidationError
from datetime import timedelta, timezone, datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(security_scopes: SecurityScopes, token: Annotated[str, Depends(oauth2_scheme)]):
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
        headers={"WWW-Authenticate": authenticate_value}
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, is_admin=payload.get("admin"))
    except (InvalidTokenError, ValidationError) as e:
        raise credentials_exception
    user = users.find_one_by({"email": token_data.email})
    if user is None:
        raise credentials_exception
    if "admin" in security_scopes.scopes and not user.admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin only route",
            headers={"WWW-Authenticate": authenticate_value}
        )
    return user

def get_current_normal_user(
    current_user: Annotated[User, Security(get_current_user, scopes=[])],
):
    return current_user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    return encoded_jwt

def get_all_users():
    all_users = users.find_by({})
    return all_users

def create_user(new_user: NewUser):
    user = User(email=new_user.email, password=pwd_context.hash(new_user.plaintext_password))
    return users.save(user).acknowledged

def authenticate_user(email: str, password: str):
    user = users.find_one_by({"email": email})
    if user == None or not pwd_context.verify(password, user.password):
        return False
    return user

def delete_user(email: str):
    dr = users.delete(users.find_one_by({"email": email}))
    return dr.deleted_count == 1