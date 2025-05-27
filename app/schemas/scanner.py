from pydantic import BaseModel
from typing import List, Optional

class ScanningStatistics(BaseModel):
    check_queue_size: int = 0
    non_blacklisted_ips: int = 0
    blacklisted_ips: int = 0

class ScannerSettingsUpdate(BaseModel):
    num_scan_threads: Optional[int]
    alive_check_interval_minutes: Optional[int]
    dead_check_interval_minutes: Optional[int]
    scan_check_timeout_seconds: Optional[int]
    blacklist_files: Optional[List[str]]
