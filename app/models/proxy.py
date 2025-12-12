from pydantic import BaseModel
import datetime
from pydantic_mongo import AbstractRepository, PydanticObjectId
from typing import Optional, List
from app.models.location import Location
from enum import IntEnum

class Anonymity(IntEnum):
    none = 0
    low = 1
    medium = 2
    high = 3

class Proxy(BaseModel):
    id: Optional[PydanticObjectId] = None
    uri: str
    speed: float
    anon: Anonymity
    reliability: float
    last_check: datetime.datetime
    last_check_status: bool
    location: Location
    accessible_websites: List[str] = []  # List of website URLs this proxy can access
    inaccessible_websites: List[str] = []  # List of website URLs this proxy cannot access

class ProxyRepo(AbstractRepository[Proxy]):
   class Meta:
      collection_name = 'proxy'