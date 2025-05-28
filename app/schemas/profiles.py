from pydantic import BaseModel
from app.schemas.proxies import FilterProxies

class NewProfile(BaseModel):
    name: str
    proxy_filter: FilterProxies