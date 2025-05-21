from pydantic import BaseModel
import datetime

class Profile(BaseModel):
    id: str
    fingerprint: str
    name: str
    active: str