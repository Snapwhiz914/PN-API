from pydantic import BaseModel
from typing import List, Optional
from pydantic_mongo import AbstractRepository, PydanticObjectId

class ScannerSettings(BaseModel):
    id: Optional[PydanticObjectId] = None
    num_scan_threads: int = 100
    alive_check_interval_minutes: int = 15
    dead_check_interval_minutes: int = 60
    scan_check_timeout_seconds: int = 10
    blacklist_files: List[str] = ["firehol_level1.netset"]

class ScannerSettingsRepo(AbstractRepository[ScannerSettings]):
   class Meta:
      collection_name = 'scanner_settings'