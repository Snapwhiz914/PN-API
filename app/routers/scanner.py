from fastapi import APIRouter, Security
from app.models.scanner import ScannerSettings
from app.schemas.scanner import ScanningStatistics, ScannerSettingsUpdate
from app.crud.scanner import get_settings, update_settings, get_stats
from app.crud.users import get_current_user
from app.models.user import User
from typing import Annotated

router = APIRouter()

@router.get("/settings/", tags=["settings"])
def fetch_settings(current_user: Annotated[User, Security(get_current_user, scopes=["admin"])]):
    return get_settings()

@router.post("/settings/", tags=["settings"])
def change_settings(update: ScannerSettings, current_user: Annotated[User, Security(get_current_user, scopes=["admin"])]):
    update_settings(update)
    return {"status": "success"}

@router.get("/statistics/", tags=["settings"])
def get_statistics(current_user: Annotated[User, get_current_user]):
    return get_stats()