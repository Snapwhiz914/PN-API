import pymongo
from app.settings import MONGODB_URL

client = pymongo.MongoClient(MONGODB_URL)
database = client["PN"]

proxies = database["proxies"]