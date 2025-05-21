from pydantic import BaseModel

class Location(BaseModel):
    city: str
    region: str
    country: str
    lat: float
    lon: float