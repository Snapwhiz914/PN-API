import requests
import sys
import datetime
sys.path.append('../PN-API')
from ds import PROXY_PROTOC, ANONYMITY

class TxtLists:
    SCAN_INTERVAL = 1440 #most lists update about daily

    def __init__(self, usable_proxies: list):
        self.usable_proxies = usable_proxies
        pass
    
    def _proxy_type_to_abbr_str(self, protoc: int):
        abbr = list(PROXY_PROTOC.keys())[list(PROXY_PROTOC.values()).index(protoc)]
        return (abbr if abbr != "https" else "http")

    def _gen_url(self, protoc: int):
        return (
            f"https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/"
            f"{self._proxy_type_to_abbr_str(protoc)}"
            f".txt"
        )

    def gather(self, constraints: dict, ignore_time: int = 1440): #24 hrs in minutes
        protocs_to_scan = []
        if constraints.get('protocs', None) != None:
            protocs_to_scan = constraints["protocs"]
        else: protocs_to_scan = [0, 2, 3]
        proxies = []
        for protoc_num in protocs_to_scan:
            url = self._gen_url(protoc_num)
            print(url)
            result = requests.get(url)
            for addr in result.text.splitlines():
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
        return proxies
    
    def update_usable_proxies(self, usable):
        self.usable_proxies = usable

if __name__ == '__main__':
    tl = TxtLists([])
    r = tl.gather({"country": ["US"], "anon": [ANONYMITY["high"]]})
    print(r)
    print(len(r))