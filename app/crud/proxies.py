from typing import List
from app.models.proxy import Proxy
from app.schemas.proxies import FilterProxies
from app.db import proxies
import datetime

def get_alive_proxies(filter: FilterProxies) -> List[Proxy]:
    search = {}
    if filter.countries != None: search["location.country"] = {"$in": filter.countries}
    if filter.regions != None: search["location.region"] = {"$in": filter.regions}
    if filter.city != None: search["location.city"] = filter.city
    if filter.reliability != None: search["reliability"] = {"$gte": filter.reliability}
    if filter.speed != None: search["speed"] = {"$lte": filter.speed}
    if filter.anons != None: search["anons"] = {"$in": filter.anons}
    if filter.last_check != None:
        past_dt = datetime.datetime.now() - datetime.timedelta(minutes=filter.last_check)
        search["last_check"] = {"$gte": past_dt}
    if filter.accessible_websites != None:
        # Filter proxies that have all the specified websites in their accessible_websites list
        search["accessible_websites"] = {"$all": filter.accessible_websites}
    search["last_check_status"] = True
    collected_proxies = list(proxies.find_by(search, limit=filter.limit, sort=[("speed", 1)]))
    return collected_proxies

def get_filter_values() -> tuple[List[str]]:
    """
    tuple order: countries, cities, regions
    """
    return (
        proxies.get_collection().distinct("location.country"),
        proxies.get_collection().distinct("location.city"),
        proxies.get_collection().distinct("location.region")
    )