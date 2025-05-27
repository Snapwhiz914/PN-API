import datetime
import requests
import socks
import urllib3.exceptions
import traceback
from re import compile
from app.models.historical_ping import HistoricalPing
from app.models.proxy import Anonymity
from app.db import historical_checks

class Checker:
    def __init__(self):
        self.ip = requests.get("https://api.ipify.org/").text
        self.ipport_pattern = compile("^((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5})$")
    
    def _get_anon_from_res(self, res):
        if self.ip in res["origin"]: return Anonymity.none
        if res["headers"].get("X-Forwarded-For", None) != None:
            if self.ip in res["headers"].get("X-Forwarded-For", ""): return Anonymity.none
            match = self.ipport_pattern.search(res["headers"].get("X-Forwarded-For", ""))
            if match != None:
                if self.ip not in match.string: return Anonymity.medium
            return Anonymity.low
        if res["headers"].get("Forwarded", None) != None or \
            res["headers"].get("X-Forwarded-Host", None) != None or \
            res["headers"].get("X-Forwarded-Proto", None) != None or \
            res["headers"].get("Via", None) != None:
            return Anonymity.medium
        return Anonymity.high
    
    def _check_popular(self, addr: str, timeout: int):
        try:
            res1 = requests.get("https://google.com", proxies={
                "https": addr
            }, timeout=timeout)
            res2 = requests.get("https://reddit.com", proxies={
                "https": addr
            }, timeout=timeout)
            return (res1.elapsed.total_seconds() + res2.elapsed.total_seconds())/2
        except (requests.exceptions.ProxyError, requests.exceptions.Timeout, requests.exceptions.ConnectionError,
            requests.exceptions.JSONDecodeError, urllib3.exceptions.MaxRetryError, urllib3.exceptions.ProxyError,
            urllib3.exceptions.ProtocolError, urllib3.exceptions.NewConnectionError, socks.ProxyError) as e:
            self._log_dead_check(addr, "In popular check: " + type(e).__name__)
            return False
        except Exception as e:
            print("Unknown error occurred while popular checking " + addr + ":")
            traceback.print_exc()
            self._log_dead_check(addr, "In popular check: unknown")
            return False
    
    def get_reliability_for(self, uri):
        past_checks = historical_checks.find_by({"uri": uri})
        num_past_checks = 0
        alive_for = 0
        for check in past_checks:
            num_past_checks += 1
            if check.speed > 0: alive_for += 1
        if num_past_checks == 0: return 1.0
        return alive_for/num_past_checks

    def _log_dead_check(self, addr, error_type):
        historical_checks.save(HistoricalPing(uri=addr, raw_headers="", speed=0, ping_time=datetime.datetime.now(), error_type=error_type))

    def check(self, addr: str, timeout=10):
        """
        Given a proxy URI string, return a tuple of properties if alive: speed, anonymity level, if dead just return False
        """
        try:
            res = requests.get("https://httpbin.org/anything", proxies={
                "https": addr
            }, timeout=timeout)
            if res.content != None:
                anon = self._get_anon_from_res(res.json())
                other_checks_result = self._check_popular(addr, res.elapsed.total_seconds())
                if other_checks_result == False:
                    return False
                speed = (res.elapsed.total_seconds()+other_checks_result)/2
                historical_checks.save(HistoricalPing(uri=addr, raw_headers='\n'.join(f"{key}: {value}" for key, value in res.headers.items()), speed=speed, ping_time=datetime.datetime.now(), error_type=""))
                return (speed, anon)
        except (requests.exceptions.ProxyError, requests.exceptions.Timeout, requests.exceptions.ConnectionError,
            requests.exceptions.JSONDecodeError, urllib3.exceptions.MaxRetryError, urllib3.exceptions.ProxyError,
            urllib3.exceptions.ProtocolError, urllib3.exceptions.NewConnectionError, socks.ProxyError) as e:
            self._log_dead_check(addr, type(e).__name__)
            return False
        except Exception as e:
            print("Unknown error occurred while checking " + addr + ":")
            traceback.print_exc()
            self._log_dead_check(addr, "unknown")
            return False
        
if __name__ == '__main__':
    c = Checker()
    print(c.check("socks5://5.9.98.142:3080"))