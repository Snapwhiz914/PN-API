from pydantic import BaseModel
from typing import List, Optional

class ScanningStatistics(BaseModel):
    check_queue_size: int = 0
    non_blacklisted_ips: int = 0
    blacklisted_ips: int = 0

class WebsiteConfigUpdate(BaseModel):
    url: str
    timeout_seconds: Optional[int] = 10
    mark_dead_on_fail: Optional[bool] = True

class ScannerSettingsUpdate(BaseModel):
    num_scan_threads: Optional[int] = None
    alive_check_interval_minutes: Optional[int] = None
    dead_check_interval_minutes: Optional[int] = None
    scan_check_timeout_seconds: Optional[int] = None
    blacklist_files: Optional[List[str]] = None
    websites: Optional[List[WebsiteConfigUpdate]] = None
