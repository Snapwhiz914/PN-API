import requests
from bs4 import BeautifulSoup
import pycountry
from collections import Counter
from geopy.geocoders import Nominatim
import json

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
        self.geolocator = Nominatim(user_agent="pn-api")
        self.gc_cache = json.load(open("gc_cache.json", "r"))
        self.usable_proxies = []
    
    def update_usable_proxies(self, proxies):
        self.usable_proxies = []
        for prox in filter(lambda x: x["protoc"] == 0 and x["speed"] <= 2.0, proxies):
            self.usable_proxies.append(prox["ip"])
        self.geolocator = Nominatim(user_agent="pn-api", proxies=self.usable_proxies)

    def _country_box_to_str(self, text):
        first_i = text.find('"')
        return text[first_i+1:text.find('"', first_i+1)].strip()
    
    def _country_name_to_code(self, name):
        try:
            return pycountry.countries.search_fuzzy(name)[0].alpha_2
        except:
            return "UNKNOWN"
    
    def write_out_cache(self):
        json.dump(self.gc_cache, open("gc_cache.json", "w+"))
    
    def _protoc_num_to_prefix(self, num):
        proxy_protocs = {"http": 0,"https": 1,"socks4": 2,"socks5": 3}
        p_type = list(proxy_protocs.keys())[list(proxy_protocs.values()).index(num)]
        return p_type + "://"
    def _get_best_usable_proxy(self):
        selected = self.usable_proxies[0]
        for p in self.usable_proxies:
            if p["speed"] < selected["speed"]:
                selected = p
        return self._protoc_num_to_prefix(p["protocs"][0]) + p["ip"] + ":" + str(p["port"])
    
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
        country = Counter(countries).most_common(1)[0][0]
        region = Counter(regions).most_common(1)[0][0]
        city = Counter(cities).most_common(1)[0][0]
        search_name = (city + ", " if city != "" else "") + region + ", " + country
        res = None
        for cached in self.gc_cache:
            if cached["name"] == search_name:
                res = {
                    "lat": cached["lat"],
                    "lon": cached["lon"]
                }
        if res == None:
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

if __name__ == '__main__':
    ii = IpInfo()
    print(ii.get_info("99.76.56.237"))
    ii.write_out_cache()