from pydantic import BaseModel
from typing import List, Optional
from pydantic_mongo import AbstractRepository, PydanticObjectId

class WebsiteConfig(BaseModel):
    """Configuration for a website to check during proxy validation"""
    url: str
    timeout_seconds: int = 10
    mark_dead_on_fail: bool = True  # If False, proxy won't be marked as dead even if this site fails

class ScannerSettings(BaseModel):
    id: Optional[PydanticObjectId] = None
    num_scan_threads: int = 100
    alive_check_interval_minutes: int = 15
    dead_check_interval_minutes: int = 60
    scan_check_timeout_seconds: int = 10
    blacklist_files: List[str] = ["firehol_level1.netset"]
    websites: List[WebsiteConfig] = [
        WebsiteConfig(url="https://google.com", timeout_seconds=10, mark_dead_on_fail=True),
        WebsiteConfig(url="https://reddit.com", timeout_seconds=10, mark_dead_on_fail=True),
    ]

class ScannerSettingsRepo(AbstractRepository[ScannerSettings]):
   class Meta:
      collection_name = 'scanner_settings'