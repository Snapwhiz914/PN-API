import requests
import sys
import datetime
import json
import re
sys.path.append('../PN-API')
from ds import PROXY_PROTOC, ANONYMITY

class TxtLists:
    SCAN_INTERVAL = 720 #most lists update about half daily
    LABEL = "PubProxy"

    def __init__(self, usable_proxies: list):
        self.usable_proxies = usable_proxies
        self.sources = json.load(open("sources/tl_sources.json")) #tl_sources.json from mhddos on github
        self.ipport_pattern = r"((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5})$"
        self.last_check_time = datetime.datetime.now()
    
    def _proxy_type_to_abbr_str(self, protoc: int):
        abbr = list(PROXY_PROTOC.keys())[list(PROXY_PROTOC.values()).index(protoc)]
        return (abbr if abbr != "https" else "http")

    def _gen_urls(self, protoc: int):
        urls = []
        for src in self.sources:
            if src["type"] == protoc:
                urls.append(src["url"])
        return urls

    def gather(self, constraints: dict): #24 hrs in minutes
        self.last_check_time = datetime.datetime.now()
        protocs_to_scan = []
        if constraints.get('protocs', None) != None:
            protocs_to_scan = constraints["protocs"]
        else: protocs_to_scan = [3, 2, 0]
        proxies = []
        addrs = []
        for protoc_num in protocs_to_scan:
            urls = self._gen_urls(protoc_num)
            i = 0
            for url in urls:
                print("TL: protoc " + self._proxy_type_to_abbr_str(protoc_num) + " " + str(i+1) + "/" + str(len(urls)))
                i += 1
                try:
                    result = requests.get(url, timeout=10)
                except requests.exceptions.RequestException:
                    continue
                for addr in result.text.splitlines():
                    if re.match(self.ipport_pattern, addr) == None: continue
                    if addr in addrs: continue
                    proxies.append({
                        "ip": addr.split(":")[0],
                        "port": int(addr.split(":")[1]),
                        "country": "",
                        "city": "",
                        "region": "",
                        "speed": -1,
                        "protocs": [protoc_num],
                        "anon": -1,
                        "lc": datetime.datetime.now()-datetime.timedelta(minutes=1440)
                    })
                    addrs.append(addr)
        return proxies
    
    def update_usable_proxies(self, usable):
        self.usable_proxies = usable

if __name__ == '__main__':
    tl = TxtLists([])
    r = tl.gather({"country": ["US"], "anon": [ANONYMITY["high"]]})
    print(len(r))