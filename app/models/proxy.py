from pydantic import BaseModel
import datetime

class Proxy(BaseModel):
    id: str
    uri: str
    speed: int
    anon: int
    reliability: float
    last_check: datetime.datetime
    last_check_status: bool