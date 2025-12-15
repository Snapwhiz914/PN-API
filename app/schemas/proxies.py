from pydantic import BaseModel
from typing import Optional, List
from app.models.proxy import Anonymity

class FilterProxies(BaseModel):
    countries: Optional[List[str]] = None
    regions: Optional[List[str]] = None
    city: Optional[str] = None
    speed: Optional[float] = None
    reliability: Optional[float] = None
    anons: Optional[List[Anonymity]] = None
    last_check: Optional[int] = None
    accessible_websites: Optional[List[str]] = None  # Filter by proxies that can access these websites
    limit: int = 20