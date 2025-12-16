from app.models.scanner import ScannerSettings
from app.schemas.scanner import ScanningStatistics, ScannerSettingsUpdate, FilterHistoricPings
from app.db import settings, historical_checks
from fastapi import HTTPException
from app.scanner.scanner import Scanner
from typing import List
from app.models.historical_ping import HistoricalPing
import datetime

def get_settings():
    return settings.find_one_by({})

def update_settings(update: ScannerSettingsUpdate):
    setngs = get_settings()
    for k, v in update.model_dump(exclude_none=True).items():
        setattr(setngs, k, v)
    settings.save(setngs)
    Scanner.get_instance().hot_change_settings(setngs)

def get_stats():
    return Scanner.get_instance().statistics

def get_blocklist_fnames():
    return Scanner.get_instance().blacklist.list_available_blocklists()

def get_historic_pings(filter: FilterHistoricPings) -> List[HistoricalPing]:
    """
    Fetch historic pings with optional filtering by uri, headers keyword, speed range, error type, and date range.
    """
    search = {}
    
    if filter.uri is not None:
        search["uri"] = filter.uri
    
    if filter.raw_headers_keyword is not None:
        search["raw_headers"] = {"$regex": filter.raw_headers_keyword, "$options": "i"}
    
    if filter.speed_min is not None or filter.speed_max is not None:
        speed_filter = {}
        if filter.speed_min is not None:
            speed_filter["$gte"] = filter.speed_min
        if filter.speed_max is not None:
            speed_filter["$lte"] = filter.speed_max
        search["speed"] = speed_filter
    
    if filter.error_type is not None:
        search["error_type"] = filter.error_type
    
    if filter.start_date is not None or filter.end_date is not None:
        date_filter = {}
        if filter.start_date is not None:
            date_filter["$gte"] = filter.start_date
        if filter.end_date is not None:
            date_filter["$lte"] = filter.end_date
        search["ping_time"] = date_filter
    
    collected_pings = list(historical_checks.find_by(search, limit=filter.limit, sort=[("ping_time", -1)]))
    return collected_pings