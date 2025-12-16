from fastapi import APIRouter, Security, Depends, Query
from app.schemas.scanner import ScanningStatistics, ScannerSettingsUpdate, FilterHistoricPings
from app.crud.scanner import get_settings, update_settings, get_stats, get_blocklist_fnames, get_historic_pings
from app.crud.users import get_current_user
from app.models.user import User
from typing import Annotated
from datetime import datetime
from typing import Optional

router = APIRouter()

@router.get("/settings/", tags=["settings"])
def fetch_settings(current_user: Annotated[User, Security(get_current_user, scopes=["admin"])]):
    return get_settings()

@router.post("/settings/", tags=["settings"])
def change_settings(update: ScannerSettingsUpdate, current_user: Annotated[User, Security(get_current_user, scopes=["admin"])]):
    update_settings(update)
    return {"status": "success"}

@router.get("/settings/available_blacklist_files", tags=["settings"])
def get_available_blacklist_files(current_user: Annotated[User, Depends(get_current_user)]):
    return get_blocklist_fnames()

@router.get("/statistics/", tags=["settings"])
def get_statistics(current_user: Annotated[User, Depends(get_current_user)]):
    return get_stats()

@router.get("/historic_pings/", tags=["historic_pings"])
def fetch_historic_pings(
    current_user: Annotated[User, Depends(get_current_user)],
    uri: Optional[str] = Query(None),
    raw_headers_keyword: Optional[str] = Query(None),
    speed_min: Optional[float] = Query(None),
    speed_max: Optional[float] = Query(None),
    error_type: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=500)
):
    """
    Fetch historic ping records with optional filters.
    
    Filters:
    - uri: exact URI match
    - raw_headers_keyword: case-insensitive regex search in headers
    - speed_min/speed_max: filter by speed range
    - error_type: filter by error type
    - start_date/end_date: filter by ping date range
    - limit: max results (1-500, default 50)
    """
    filter_obj = FilterHistoricPings(
        uri=uri,
        raw_headers_keyword=raw_headers_keyword,
        speed_min=speed_min,
        speed_max=speed_max,
        error_type=error_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )
    return get_historic_pings(filter_obj)