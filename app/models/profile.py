from pydantic import BaseModel
from pydantic_mongo import AbstractRepository, PydanticObjectId
from typing import Optional
from app.schemas.proxies import FilterProxies
from app.models.user import User

class Profile(BaseModel):
    id: Optional[PydanticObjectId] = None
    name: str
    active: bool
    proxies: FilterProxies
    load_balance: bool
    owner: User

class ProfileRepo(AbstractRepository[Profile]):
   class Meta:
      collection_name = 'profile'