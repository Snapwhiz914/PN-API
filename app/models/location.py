from pydantic import BaseModel
from pydantic_mongo import AbstractRepository, PydanticObjectId
from typing import Optional

class Location(BaseModel):
    id: Optional[PydanticObjectId] = None
    city: str
    region: str
    country: str
    lat: float
    lon: float

class LocationRepo(AbstractRepository[Location]):
   class Meta:
      collection_name = 'location'