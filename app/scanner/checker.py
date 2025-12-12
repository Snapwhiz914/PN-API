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
    
    def _check_website(self, addr: str, url: str, timeout: int):
        """
        Check if a proxy can access a specific website.
        Returns the response time if successful, False if failed.
        """
        try:
            res = requests.get(url, proxies={"http": addr, "https": addr}, timeout=timeout)
            return res.elapsed.total_seconds()
        except (requests.exceptions.ProxyError, requests.exceptions.Timeout, requests.exceptions.ConnectionError,
            requests.exceptions.JSONDecodeError, urllib3.exceptions.MaxRetryError, urllib3.exceptions.ProxyError,
            urllib3.exceptions.ProtocolError, urllib3.exceptions.NewConnectionError, socks.ProxyError) as e:
            return False
        except Exception as e:
            print("Unknown error occurred while checking " + addr + ":")
            traceback.print_exc()
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

    def check(self, addr: str, websites_config, timeout=10):
        """
        Given a proxy URI string and a list of website configurations, validate the proxy.
        Returns a tuple: (speed, anonymity level, accessible_websites, inaccessible_websites)
        If proxy is dead (all critical websites fail), returns False
        
        Args:
            addr: Proxy URI string
            websites_config: List of WebsiteConfig objects from ScannerSettings
            timeout: Default timeout (used if website doesn't specify one)
        """
        try:
            # Primary check: httpbin.org (mandatory)
            primary_url = "https://httpbin.org/anything"
            primary_timeout = timeout
            res = requests.get(primary_url, proxies={"https": addr}, timeout=primary_timeout)
            
            if res.content == None:
                return False
            
            anon = self._get_anon_from_res(res.json())
            primary_speed = res.elapsed.total_seconds()
            
            # Check all configured websites
            accessible_websites = []
            inaccessible_websites = []
            has_critical_failure = False
            total_speeds = [primary_speed]
            
            for website_config in websites_config:
                website_timeout = website_config.timeout_seconds
                website_url = website_config.url
                
                check_result = self._check_website(addr, website_url, website_timeout)
                
                if check_result != False:
                    accessible_websites.append(website_url)
                    total_speeds.append(check_result)
                else:
                    inaccessible_websites.append(website_url)
                    if website_config.mark_dead_on_fail:
                        has_critical_failure = True
                        break  # No need to check further if proxy will be marked as dead
            
            # If any critical (mark_dead_on_fail=True) website failed, mark proxy as dead
            if has_critical_failure:
                self._log_dead_check(addr, "Critical website check failed")
                return False
            
            # Calculate average speed
            speed = sum(total_speeds) / len(total_speeds)
            
            # Log successful check
            historical_checks.save(HistoricalPing(
                uri=addr,
                raw_headers='\n'.join(f"{key}: {value}" for key, value in requests.get(primary_url, proxies={"https": addr}, timeout=primary_timeout).headers.items()),
                speed=speed,
                ping_time=datetime.datetime.now(),
                error_type=""
            ))
            
            return (speed, anon, accessible_websites, inaccessible_websites)
            
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