import requests
from bs4 import BeautifulSoup
import pycountry
from collections import Counter
import certifi
import ssl
import geopy.geocoders
from geopy.geocoders import Nominatim
import json
import os
from utils.config import Config

class IpInfo:
    SOURCES = [
        "ip2location",
        "ipinfo",
        "dbip",
        "ipregistry",
        "ipgeolocation",
        "ipapico",
        "ipapi",
        "ipdatas"
    ]

    def __init__(self):
        # ctx = ssl.create_default_context(cafile=certifi.where())
        # geopy.geocoders.options.default_ssl_context = ctx   
        self.geolocator = Nominatim(user_agent="pn-api", domain=Config.get_conf_option("nominatim_domain"), scheme=Config.get_conf_option("nominatim_scheme"))
        if os.path.exists(os.path.join("persistent", "gc_cache.json")):
            self.gc_cache = json.load(open(os.path.join("persistent", "gc_cache.json"), "r"))
        else:
            self.gc_cache = []
        self.usable_proxies = []
    
    def update_usable_proxies(self, proxies):
        self.usable_proxies = []
        for prox in filter(lambda x: x["protoc"] == 0 and x["speed"] <= 2.0, proxies):
            self.usable_proxies.append(prox["ip"])
        self.geolocator = Nominatim(user_agent="pn-api", proxies=self.usable_proxies, domain=Config.get_conf_option("nominatim_domain"), scheme=Config.get_conf_option("nominatim_scheme"))

    def _country_box_to_str(self, text):
        first_i = text.find('"')
        return text[first_i+1:text.find('"', first_i+1)].strip()
    
    def _country_name_to_code(self, name):
        try:
            return pycountry.countries.search_fuzzy(name)[0].alpha_2
        except:
            return "UNKNOWN"
    
    def write_out_cache(self):
        json.dump(self.gc_cache, open(os.path.join("persistent", "gc_cache.json"), "w+"))
    
    def _get_best_usable_proxy(self):
        selected = self.usable_proxies[0]
        for p in self.usable_proxies:
            if p["speed"] < selected["speed"]:
                selected = p
        return utils.protoc_num_to_prefix(p["protocs"][0]) + p["ip"] + ":" + str(p["port"])
    
    def _remove_nones(self, l):
        for item in l:
            if l is None: del l
    
    def _most_common_or_blank(self, counter_result):
        return counter_result[0][0] if len(counter_result) > 0 else ""
    
    def get_info(self, ip):
        cities = []
        regions = []
        countries = []
        for src in self.SOURCES:
            res = None
            try:
                res = requests.post("https://www.iplocation.net/get-ipdata", data={
                    "ip": ip,
                    "source": src,
                    "ipv": 4
                }).json()
            except requests.exceptions.RequestException:
                res = requests.post("https://www.iplocation.net/get-ipdata", data={
                    "ip": ip,
                    "source": src,
                    "ipv": 4
                }, proxies={
                    "https": self._get_best_usable_proxy()
                }).json()
            if res.get("res", None) == None: continue
            if res["res"].get("latitude", None) != None and res["res"].get("longitude", None) != None:
                return {
                    "country": res["res"].get("countryCode", None),
                    "region": res["res"].get("regionName", None),
                    "city": res["res"].get("cityName"),
                    "lat": res["res"]["latitude"],
                    "lon": res["res"]["longitude"]
                }
            countries.append(
                res["res"].get("countryCode", None) or
                res["res"].get("country", None) or
                res["res"].get("country_code2", None) or
                res["res"].get("country_code", None) or
                (res["res"]["location"]["country"]["code"] if res["res"].get("location", None) != None else None)
            )
            regions.append(
                res["res"].get("regionName", None) or
                res["res"].get("region", None) or
                res["res"].get("region_name", None) or
                res["res"].get("stateprov", None) or
                res["res"].get("state_prov", None) or
                (res["res"]["location"]["region"]["name"] if res["res"].get("location", None) != None else None)
            )
            cities.append(
                res["res"].get("cityName") or
                res["res"].get("city", None) or
                (res["res"]["location"]["city"] if res["res"].get("location", None) != None else None)
            )
        countries, regions, cities = self._remove_nones(countries), self._remove_nones(regions), self._remove_nones(cities)
        country = self._most_common_or_blank(Counter(countries).most_common(1))
        region = self._most_common_or_blank(Counter(regions).most_common(1))
        city = self._most_common_or_blank(Counter(cities).most_common(1))
        search_name = (city + ", " if city != "" else "") + region + ", " + country
        res = None
        for cached in self.gc_cache:
            if cached["name"] == search_name:
                res = {
                    "lat": cached["lat"],
                    "lon": cached["lon"]
                }
        if res == None:
            if country == "" and region == "":
                return {
                    "country": country,
                    "region": region,
                    "city": city,
                    "lat": None,
                    "lon": None
                }
            raw = self.geolocator.geocode({
                "city": city,
                "state": region, 
                "country": country
            })
            if raw == None:
                return {
                    "country": country,
                    "region": region,
                    "city": city,
                    "lat": 0,
                    "lon": 0
                }
            self.gc_cache.append({
                "name": search_name,
                "lat": raw.latitude,
                "lon": raw.longitude
            })
            res = {
                "lat": raw.latitude,
                "lon": raw.longitude
            }
        return {
            "country": country,
            "region": region,
            "city": city,
            "lat": res["lat"],
            "lon": res["lon"]
        }