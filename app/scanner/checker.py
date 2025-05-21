import datetime
from typing import List
import bs4
import requests
import socks
import sys
import re
import urllib3.exceptions
import traceback
from re import compile
sys.path.append('../PN-API')
from utils.ds import ANONYMITY, protoc_num_to_prefix

class Checker:
    def __init__(self):
        self.ip = requests.get("https://api.ipify.org/").text
        self.ipport_pattern = compile("^((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5})$")
    
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
    
    def _check_popular(self, addr: str, timeout: int):
        try:
            res1 = requests.get("https://google.com", proxies={
                "https": addr
            }, timeout=timeout)
            res2 = requests.get("https://reddit.com", proxies={
                "https": addr
            }, timeout=timeout)
            return (res1.elapsed.total_seconds() + res2.elapsed.total_seconds())/2
        except Exception as e:
            return False

    def check(self, addr: str, timeout=10) -> (float, int):
        """
        Given a proxy URI string, return a tuple of properties if alive: speed, anonymity level, if dead just return False
        """
        try:
            res = requests.get("https://httpbin.org/anything", proxies={
                "https": addr
            }, timeout=timeout)
            if res.content != None:
                anon = self._get_anon_from_res(res.json())
                other_checks_result = self._check_popular(addr, res.elapsed.total_seconds()+2)
                if other_checks_result == False: return False
                return ((res.elapsed.total_seconds()+other_checks_result)/2, anon)
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
            print("Unknown error occurred while checking " + addr + ":")
            traceback.print_exc()
            return False
        return False