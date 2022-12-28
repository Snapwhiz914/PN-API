import requests
from bs4 import BeautifulSoup
import pycountry
from collections import Counter

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
        pass

    def _country_box_to_str(self, text):
        first_i = text.find('"')
        return text[first_i+1:text.find('"', first_i+1)].strip()
    
    def _country_name_to_code(self, name):
        try:
            return pycountry.countries.search_fuzzy(name)[0].alpha_2
        except:
            return "UNKNOWN"
    
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
            #print(res)
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
        return {
            "country": Counter(countries).most_common(1)[0][0],
            "region": Counter(regions).most_common(1)[0][0],
            "city": Counter(cities).most_common(1)[0][0]
        }

if __name__ == '__main__':
    ii = IpInfo()
    print(ii.get_info("99.76.56.237"))