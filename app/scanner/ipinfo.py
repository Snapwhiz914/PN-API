import requests
import pycountry
from collections import Counter
from geopy.geocoders import Nominatim
from app.db import locations
from app.models.location import Location

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
        self.geolocator = Nominatim(user_agent="pn-api")
        self.usable_proxies = []

    def _country_box_to_str(self, text):
        first_i = text.find('"')
        return text[first_i+1:text.find('"', first_i+1)].strip()
    
    def _country_name_to_code(self, name):
        try:
            return pycountry.countries.search_fuzzy(name)[0].alpha_2
        except:
            return "UNKNOWN"
    
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
            res = requests.post("https://www.iplocation.net/get-ipdata", data={
                "ip": ip,
                "source": src,
                "ipv": 4
            }).json()
            if res.get("res", None) == None: continue
            if res["res"].get("latitude", None) != None and res["res"].get("longitude", None) != None:
                location = Location(city=res["res"].get("cityName"), region=res["res"].get("regionName", ""), country=res["res"].get("countryCode", ""), lat=res["res"]["latitude"], lon=res["res"]["longitude"])
                locations.save(location)
                return location
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

        db_search_dict = {"country": country, "region": region}
        if city != None: db_search_dict["city"] = city
        cached = locations.find_one_by(db_search_dict)
        if cached != None: return cached

        raw = self.geolocator.geocode({
            "city": city,
            "state": region, 
            "country": country
        })
        if raw == None:
            location = Location(city=city, region=region, country=country, lat=0, lon=0)
            locations.save(location)
            return location
        
        location = Location(city=city, region=region, country=country, lat=raw.latitude, lon=raw.longitude)
        locations.save(location)
        return location