import datetime
from typing import List
import bs4
import requests
import socks
import sys
import re
import urllib3.exceptions
from re import compile
sys.path.append('../PN-API')
from ds import PROXY_PROTOC, ANONYMITY
import traceback

class Checker:
    def __init__(self, ip_info_getter):
        self.ip_info_getter = ip_info_getter
        self.ip = requests.get("https://api.ipify.org/").text
        self.ipport_pattern = compile("^((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5})$")
        pass

    def _protoc_num_to_prefix(self, num):
        p_type = list(PROXY_PROTOC.keys())[list(PROXY_PROTOC.values()).index(num)]
        return p_type + "://"
    
    def _get_anon_from_res(self, res):
        if self.ip in res["origin"]: return ANONYMITY["none"]
        if res["headers"].get("X-Forwarded-For", None) != None:
            if self.ip in res["headers"].get("X-Forwarded-For", ""): return ANONYMITY["none"]
            match = self.ipport_pattern.search(res["headers"].get("X-Forwarded-For", ""))
            if match != None:
                if self.ip not in match.string: return ANONYMITY["med"]
            return ANONYMITY["low"]
        if res["headers"].get("Forwarded", None) != None or \
            res["headers"].get("X-Forwarded-Host", None) != None or \
            res["headers"].get("X-Forwarded-Proto", None) != None or \
            res["headers"].get("Via", None) != None:
            return ANONYMITY["med"]
        return ANONYMITY["high"]

    def check(self, proxy: dict):
        try:
            res = requests.get("https://httpbin.org/anything", proxies={
                "https": self._protoc_num_to_prefix(proxy["protocs"][0]) + proxy["ip"] + ":" + str(proxy["port"])
            }, timeout=(proxy["speed"]*0.001)+2)
            if res.content != None:
                info = self.ip_info_getter.get_info(proxy["ip"])
                proxy["country"] = info["country"]
                proxy["region"] = info["region"]
                proxy["city"] = info["city"]
                proxy["lc"] = datetime.datetime.now()
                proxy["speed"] = res.elapsed.total_seconds() if proxy["speed"] == -1 else proxy["speed"]
                proxy["lat"] = round(info["lat"], 5)
                proxy["lon"] = round(info["lon"], 5)
                proxy["anon"] = self._get_anon_from_res(res.json())
                return proxy
        except requests.exceptions.ProxyError:
            return False
        except requests.exceptions.Timeout:
            return False
        except requests.exceptions.ConnectionError:
            return False
        except requests.exceptions.JSONDecodeError:
            return False
        except urllib3.exceptions.MaxRetryError:
            return False
        except urllib3.exceptions.ProxyError:
            return False
        except urllib3.exceptions.ProtocolError:
            return False
        except urllib3.exceptions.NewConnectionError:
            return False
        except socks.ProxyError:
            return False
        except Exception as e:
            print("Unknown error occurred while checking " + proxy["ip"] + ":")
            traceback.print_exc()
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