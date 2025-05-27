import pymongo
import pymongo.errors
from app.settings import MONGODB_URL
from app.models.historical_ping import HistoricalPingRepo
from app.models.location import LocationRepo
from app.models.profile import ProfileRepo
from app.models.proxy import ProxyRepo
from app.models.scanner import ScannerSettingsRepo, ScannerSettings

client = pymongo.MongoClient(MONGODB_URL)
database = client["PN"]

try:
    database.create_collection("historical_ping", timeseries={
        "timeField": "ping_time",
        "metaField": "uri",
        "granularity": "minutes"
    })
except pymongo.errors.CollectionInvalid:
    pass
historical_checks = HistoricalPingRepo(database)
locations = LocationRepo(database)
profiles = ProfileRepo(database)
proxies = ProxyRepo(database)
settings = ScannerSettingsRepo(database)

if settings.find_one_by({}) == None:
    settings.save(ScannerSettings())