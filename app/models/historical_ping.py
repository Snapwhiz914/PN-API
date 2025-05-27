from pydantic import BaseModel
from pydantic_mongo import AbstractRepository, PydanticObjectId
import datetime
from typing import Optional

class HistoricalPing(BaseModel):
    id: Optional[PydanticObjectId] = None
    uri: str
    raw_headers: str
    speed: float
    error_type: str
    ping_time: datetime.datetime

class HistoricalPingRepo(AbstractRepository[HistoricalPing]):
   class Meta:
      collection_name = 'historical_ping'