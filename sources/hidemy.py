import bs4
import requests
import sys
sys.path.append('../PN-API')
from ds import PROXY_PROTOC, ANONYMITY
import pycountry
import datetime

class HideMyNameNet:
    SCAN_INTERVAL = 15
    LABEL = "PubProxy"

    def __init__(self, usable_proxies: list):
        self.usable_proxies = usable_proxies
        self.cloudflare_flagged = False
        self.last_check_time = datetime.datetime.now()
        pass
    
    def _proxy_types_to_abbr_str(self, arr):
        result = ""
        for type in arr:
            if type == PROXY_PROTOC["http"]: result += "h"
            if type == PROXY_PROTOC["https"]: result += "s"
            if type == PROXY_PROTOC["socks4"]: result += "4"
            if type == PROXY_PROTOC["socks5"]: result += "5"
        return result
    
    def _anon_types_to_abbr_str(self, arr):
        result = ""
        for type in arr:
            if type == ANONYMITY["none"]: result += "1"
            if type == ANONYMITY["low"]: result += "2"
            if type == ANONYMITY["med"]: result += "3"
            if type == ANONYMITY["high"]: result += "4"
        return result

    def _gen_url(self, constraints: dict, start: int):
        return (
            f"https://hidemy.name/en/proxy-list/?"
            f"{'country=' + ''.join(constraints['country']) + '&' if constraints.get('country', None) is not None else ''}"
            f"{'maxtime=' + str(constraints['speed']) + '&' if constraints.get('speed', None) is not None else ''}"
            f"{'type=' + self._proxy_types_to_abbr_str(constraints['type']) + '&' if constraints.get('type', None) is not None else ''}"
            f"{'anon=' + self._anon_types_to_abbr_str(constraints['anon']) + '&' if constraints.get('anon', None) is not None else ''}"
            f"{'start=' + str(start)}"
        )

    def _protocs_str_to_ds(self, p_str: str):
        l = []
        if ',' in p_str:
            for p in p_str.split(','):
                l.append(PROXY_PROTOC[p.strip().lower()])
        else: l.append(PROXY_PROTOC[p_str.strip().lower()])
        return l
    
    def _anon_str_to_int(self, a_str: str):
        if "no" in a_str: return ANONYMITY["none"]
        if "Low" in a_str: return ANONYMITY["low"]
        if "Average" in a_str: return ANONYMITY["med"]
        if "High" in a_str: return ANONYMITY["high"]
        return "no"
     
    def _time_str_to_int_minutes(self, t_str):
        if '.' in t_str:
            #format: <hour> h. <min> min.
            return int(t_str.split(" ")[0])*60 + int(t_str.split(" ")[2])
        num = int(t_str.split(" ")[0])
        if "minutes" in t_str:
            return num
        if "seconds" in t_str:
            return 0
    
    def _country_name_to_code(self, name):
        try:
            return pycountry.countries.search_fuzzy(name)[0].alpha_2
        except:
            return "UNKNOWN"
    
    def _protoc_num_to_prefix(self, num):
        p_type = list(PROXY_PROTOC.keys())[list(PROXY_PROTOC.values()).index(num)]
        return p_type + "://"
    
    def _get_best_usable_proxy(self):
        selected = self.usable_proxies[0]
        for p in self.usable_proxies:
            if p["speed"] < selected["speed"]:
                selected = p
        return self._protoc_num_to_prefix(p["protocs"][0]) + p["ip"] + ":" + str(p["port"])
    
    def _get_page(self, constraints, start):
        if self.cloudflare_flagged == False:
            return bs4.BeautifulSoup(requests.get(self._gen_url(constraints, start=start), headers={
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                "sec-ch-ua": '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"'
            }, verify=False, timeout=5).text, "html.parser")
        else:
            self.cloudflare_flagged = False
            proxy_addr = self._get_best_usable_proxy()
            print("Loading page from proxy " + proxy_addr + "...")
            return bs4.BeautifulSoup(requests.get(self._gen_url(constraints, start=start), headers={
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                "sec-ch-ua": '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"'
            }, proxies={
                "https": proxy_addr
            }, verify=False, timeout=10).text, "html.parser")

    def gather(self, constraints: dict, ignore_time: int = 15):
        '''
        Gathers proxies (blocking op) until ignore_time (minutes) is hit
        '''
        self.last_check_time = datetime.datetime.now()
        proxies = []
        current_gathered = 1
        current_trs = []
        i = 0
        attempts = 0

        while True:
            if current_gathered == 1 or current_gathered%64 == 0:
                current_page = self._get_page(constraints, current_gathered)
                current_tbody = current_page.select_one("div.wrap > div.services_proxylist.services > div > div.table_block > table > tbody")
                try:
                    current_trs = current_tbody.find_all("tr")
                except AttributeError as e:
                    if attempts == 25:
                        print("HM: 25 attempts reached, returning empty")
                        return []
                    #generally means cloudflare flagged us, so use a proxy
                    print("HM: Cloudflare flagged detected")
                    self.cloudflare_flagged = True
                    attempts += 1
                    continue
                i = 0
            tds = current_trs[i].find_all("td")
            if self._time_str_to_int_minutes(tds[6].text) > ignore_time:
                break
            proxies.append({
                "ip": tds[0].text,
                "port": int(tds[1].text),
                "country": self._country_name_to_code(tds[2].find("span", {"class": "country"}).text),
                "city": tds[2].find("span", {"class": "city"}).text,
                "region": "",
                "speed": round(int(tds[3].find("p").text.split(" ")[0])*0.001),
                "protocs": self._protocs_str_to_ds(tds[4].text),
                "anon": self._anon_str_to_int(tds[5].text),
                "lc": datetime.datetime.now() - datetime.timedelta(minutes=self._time_str_to_int_minutes(tds[6].text))
            })
            current_gathered = current_gathered + 1
            i = i + 1
        return proxies
    
    def update_usable_proxies(self, usable):
        self.usable_proxies = usable

if __name__ == '__main__':
    hm = HideMyNameNet([])
    r = hm.gather({"country": ["US"], "anon": [ANONYMITY["high"]]}, ignore_time=15)
    print(r)
    print(len(r))