import datetime
from typing import List
import bs4
import requests
import sys
import re
sys.path.append('../PNRV2')
from ds import PROXY_PROTOC, ANONYMITY

class Checker:
    def __init__(self, ip_info_getter):
        self.ip_info_getter = ip_info_getter
        pass

    def _protoc_num_to_prefix(self, num):
        p_type = list(PROXY_PROTOC.keys())[list(PROXY_PROTOC.values()).index(num)]
        return p_type + "://"

    def check(self, proxy: dict):
        try:
            res = requests.get("https://api.ipify.org/", proxies={
                "https": self._protoc_num_to_prefix(proxy["protocs"][0]) + proxy["ip"] + ":" + str(proxy["port"])
            }, timeout=(proxy["speed"]*0.001)+3)
            if re.match(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$", res.text) != None:
                info = self.ip_info_getter.get_info(proxy["ip"])
                proxy["country"] = info["country"]
                proxy["region"] = info["region"]
                proxy["city"] = info["city"]
                proxy["lc"] = datetime.datetime.now()
                proxy["speed"] = res.elapsed.total_seconds() if proxy["speed"] == -1 else proxy["speed"]
                return proxy
        except requests.exceptions.ProxyError:
            return False
        except requests.exceptions.Timeout:
            return False
        except Exception as e:
            print("Unknown error occurred while checking " + proxy["ip"] + ":")
            print(str(e))
            return False
        return False

if __name__ == '__main__':
    from utils.ipinfo import IpInfo
    c = Checker(IpInfo())
    print(c.check({
        "ip": "216.137.184.253",
        "port": 80,
        "country": "US",
        "city": "",
        "region": "",
        "speed": 720,
        "anon": 3,
        "protocs": [0],
        "lc": datetime.datetime.now()
    }))