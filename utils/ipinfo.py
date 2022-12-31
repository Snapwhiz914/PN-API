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
    
    def get_info(self, ip):
        cities = []
        regions = []
        countries = []
        for src in self.SOURCES:
            res = requests.post("https://www.iplocation.net/get-ipdata", data={
                "ip": ip,
                "source": src,
                "ipv": 4
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
            raw = self.geolocator.geocode(search_name.strip())
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