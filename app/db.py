import os
import pymongo
import pymongo.errors
from app.settings import MONGODB_URL, JWT_SECRET
from app.models.historical_ping import HistoricalPingRepo
from app.models.location import LocationRepo
from app.models.profile import ProfileRepo
from app.models.proxy import ProxyRepo
from app.models.scanner import ScannerSettingsRepo, ScannerSettings
from app.models.user import UserRepo, User
import getpass
from passlib.context import CryptContext

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
users = UserRepo(database)

# Only run initialization in non-test mode
if not os.getenv('PYTEST_CURRENT_TEST'):
    if settings.find_one_by({}) == None:
        settings.save(ScannerSettings())

    admin = users.find_one_by({"admin": True})
    if admin == None:
        print("NO ADMIN USER IS SET!")
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        email = input("Admin email: ")
        password = getpass.getpass()
        users.save(User(email=email, password=pwd_context.hash(password), admin=True))