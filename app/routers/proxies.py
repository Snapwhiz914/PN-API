from fastapi import APIRouter
from typing import List, Union
from fastapi import Query

router = APIRouter()

@router.get("/proxies/", tags=["proxies"])
def read_proxies(countries: Union[List[str], None] = Query(default=None),
    city: str = None,
    speed: int = None,
    anons: Union[List[int], None] = Query(default=None),
    protocs: Union[List[int], None] = Query(default=None),
    last_check: int = None,
    limit: int = 20):
    return []

@router.get("/proxy/", tags=["proxies"])
def read_proxy(id: str):
    return Proxy