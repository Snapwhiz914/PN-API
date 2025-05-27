from fastapi import APIRouter
from app.models.scanner import ScannerSettings
from app.schemas.scanner import ScanningStatistics, ScannerSettingsUpdate
from app.crud.scanner import get_settings, update_settings, get_stats

router = APIRouter()

@router.get("/settings/", tags=["settings"])
def fetch_settings():
    return get_settings()

@router.post("/settings/", tags=["settings"])
def change_settings(update: ScannerSettings):
    update_settings(update)
    return {"status": "success"}

@router.get("/statistics/", tags=["settings"])
def get_statistics():
    return get_stats()