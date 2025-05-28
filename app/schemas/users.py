from pydantic import BaseModel, EmailStr
from typing import List, Optional

class NewUser(BaseModel):
    email: EmailStr
    plaintext_password: str

class TokenData(BaseModel):
    email: Optional[EmailStr]
    is_admin: bool

class Token(BaseModel):
    access_token: str
    token_type: str