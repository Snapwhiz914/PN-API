from pydantic import BaseModel
import datetime

class HistoricalPing(BaseModel):
    id: str
    raw_headers: str
    speed: int