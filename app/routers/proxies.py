from fastapi import APIRouter, Depends
from typing import List, Union, Annotated
from fastapi import Query
from app.crud.proxies import *
from app.schemas.proxies import *
from app.models.proxy import Anonymity
from app.models.user import User
from app.crud.users import get_current_user

router = APIRouter()

@router.get("/", tags=["proxies"])
def read_proxies(current_user: Annotated[User, Depends(get_current_user)],
    countries: Union[List[str], None] = Query(default=None),
    regions: Union[List[str], None] = Query(default=None),
    city: str = None,
    speed: int = None,
    anons: Union[List[Anonymity], None] = Query(default=None),
    reliability: float = None,
    protocs: Union[List[int], None] = Query(default=None),
    last_check: int = None,
    limit: int = 20):
    return get_alive_proxies(FilterProxies(countries=countries, regions=regions, city=city, speed=speed, reliability=reliability, anons=anons, protocs=protocs, last_check=last_check, limit=limit))