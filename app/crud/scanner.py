from app.models.scanner import ScannerSettings
from app.schemas.scanner import ScanningStatistics, ScannerSettingsUpdate
from app.db import settings
from fastapi import HTTPException
from app.scanner.scanner import Scanner

def get_settings():
    return settings.find_one_by({})

def update_settings(update: ScannerSettingsUpdate):
    setngs = get_settings()
    for k, v in update.model_dump(exclude_none=True):
        setattr(setngs, k, v)
    settings.save(setngs)

def get_stats():
    return Scanner.get_instance().statistics