import datetime
from urllib.parse import urlparse

ANONYMITY = {
    "none": 0,
    "low": 1,
    "med": 2,
    "high": 3
}

PROXY_PROTOC = {
    "http": 0,
    "https": 1,
    "socks4": 2,
    "socks5": 3
}

class Proxy:
    uri: str
    city: str
    region: str
    country: str
    speed: int
    anon: int
    lat: float
    lon: float
    reliability: int
    last_check: datetime.datetime

    def __init__(self, uri=None, city=None, region=None, country=None, speed=None, anon=None, lat=None, lon=None, reliability=None, last_check=None):
        self.uri = uri
        self.city = city
        self.region = region
        self.country = country
        self.speed = speed
        self.anon = anon
        self.lat = lat
        self.lon = lon
        self.reliability = reliability
        self.last_check = last_check
    
    def as_dict(self):
        return {"uri": self.uri, "city": self.city, "region": self.region,
        "country": self.country, "speed": self.speed, "anon": self.anon,
        "lat": self.lat, "lon": self.lon, "reliability": self.reliability,
        "last_check": self.last_check}
    
    def get_protoc_number(self):
        return PROXY_PROTOC[self.uri.split(":")[0]]

def protoc_num_to_prefix(num):
    p_type = list(PROXY_PROTOC.keys())[list(PROXY_PROTOC.values()).index(num)]
    return p_type + "://"

def get_ip(uri):
    return urlparse(uri).hostname