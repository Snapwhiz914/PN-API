import requests
import sys
import datetime
sys.path.append('../PNRV2')
from ds import PROXY_PROTOC, ANONYMITY

class TxtLists:
    SCAN_INTERVAL = 1440 #most lists update about daily

    def __init__(self, usable_proxies: list):
        self.usable_proxies = usable_proxies
        pass
    
    def _proxy_types_to_abbr_str(self, type_arr):
        if PROXY_PROTOC["socks5"] in type_arr: return "socks5"
        if PROXY_PROTOC["socks4"] in type_arr: return "socks4"
        return "http"

    def _gen_url(self, protoc: int):
        return (
            f"https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/"
            f"{self._proxy_types_to_abbr_str(constraints['protocs']) if constraints.get('protocs', None) is not None else self._current_auto_protoc}"
            f".txt"
        )

    def gather(self, constraints: dict, ignore_time: int = 1440): #24 hrs in minutes
        protocs_to_scan = []
        if constraints.get('protocs', None) != None:
            protocs_to_scan = constraints["protocs"]
        url = self._gen_url(constraints)
        result = requests.get(url)
        proxies = []
        for addr in result.text.splitlines():
            proxies.append({
                "ip": addr.split(":")[0],
                "port": int(addr.split(":")[1]),
                "country": "",
                "city": "",
                "region": "",
                "speed": -1,
                "protocs": [PROXY_PROTOC[self._proxy_types_to_abbr_str(constraints['protocs']) if constraints.get('protocs', None) is not None else 'socks5']],
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