from pydantic import BaseModel
from pydantic_mongo import AbstractRepository, PydanticObjectId
from typing import Optional
from app.schemas.proxies import FilterProxies

class Profile(BaseModel):
    id: Optional[PydanticObjectId] = None
    fingerprint: str
    name: str
    active: bool
    proxies: FilterProxies
    load_balance: bool

class ProfileRepo(AbstractRepository[Profile]):
   class Meta:
      collection_name = 'profile'