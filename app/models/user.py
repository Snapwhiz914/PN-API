from pydantic import BaseModel
from pydantic_mongo import AbstractRepository, PydanticObjectId
from typing import Optional

class User(BaseModel):
    id: Optional[PydanticObjectId] = None
    email: str
    password: str
    admin: bool = False

class UserRepo(AbstractRepository[User]):
   class Meta:
      collection_name = 'user'