import requests
import sys
import datetime
sys.path.append('../PN-API')
from ds import PROXY_PROTOC, ANONYMITY

class PubProxy:
    SCAN_INTERVAL = 60
    LABEL = "PubProxy"

    def __init__(self, usable_proxies: list):
        self.usable_proxies = usable_proxies
        self.last_check_time = datetime.datetime.now()
        pass

    def _anon_types_to_abbr_str(self, anon_types):
        if ANONYMITY["high"] in anon_types: return "elite"
        return "anonymous"
    
    def _proxy_types_to_abbr_str(self, type_arr):
        if PROXY_PROTOC["socks5"] in type_arr: return "type=socks5"
        if PROXY_PROTOC["socks4"] in type_arr: return "type=socks4"
        if PROXY_PROTOC["http"] in type_arr: return "type=http"

    def _gen_url(self, constraints: dict):
        return (
            f"http://pubproxy.com/api/proxy?format=json&"
            f"{'country=' + ','.join(constraints['country']) + '&' if constraints.get('country', None) is not None else ''}"
            f"{'speed=' + str(constraints['speed']*0.001 if constraints['speed']*0.001 <= 60 else 60) + '&' if constraints.get('speed', None) is not None else ''}"
            f"{self._proxy_types_to_abbr_str(constraints['type']) + '&' if constraints.get('type', None) is not None else ''}"
            f"{'anon=' + self._anon_types_to_abbr_str(constraints['anon']) + '&' if constraints.get('anon', None) is not None else ''}"
            f"{'last_check=' + str(constraints['lc']) + '&' if constraints.get('lc', None) is not None else ''}"
            f"limit=5"
        )

    def gather(self, constraints: dict): #24 hrs in minutes
        self.last_check_time = datetime.datetime.now()
        url = self._gen_url(constraints)
        print(url)
        result = requests.get(url).json()
        proxies = []
        for r in result["data"]:
            if int((datetime.datetime.now()-datetime.datetime.fromisoformat(r["last_checked"])).seconds/60) > ignore_time:
                continue
            proxies.append({
                "ip": r["ip"],
                "port": int(r["port"]),
                "country": r["country"],
                "city": "",
                "region": "",
                "speed": int(r["speed"])*1000,
                "protocs": [PROXY_PROTOC[r["type"]]],
                "anon": ANONYMITY["med"] if r["proxy_level"] == "anonymous" else ANONYMITY["high"],
                "lc": datetime.datetime.now()-datetime.datetime.fromisoformat(r["last_checked"])
            })
        return proxies
    
    def update_usable_proxies(self, usable):
        self.usable_proxies = usable

if __name__ == '__main__':
    pp = PubProxy([])
    r = pp.gather({"country": ["US"], "anon": [ANONYMITY["high"]]})
    print(r)
    print(len(r))