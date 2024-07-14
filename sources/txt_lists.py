import requests
import sys
import datetime
import json
import re
sys.path.append('../PN-API')
from utils.ds import ANONYMITY, PROXY_PROTOC, protoc_num_to_prefix
import os

class TxtLists:
    SCAN_INTERVAL = 720 #most lists update about half daily
    LABEL = "TxtLists"

    def _download_and_return_list(self):
        result = requests.get("https://raw.githubusercontent.com/MatrixTM/MHDDoS/main/config.json", timeout=10)
        if not result.ok:
            print(f"TextList warning: could not redownload proxy list due to error {result.status_code}, using old")
            return json.load(open("persistent/tl_sources.json"))["list"]
        raw_json_list = result.json()["proxy-providers"]
        conversion_table = {4:2, 5:3, 1:0} #convert list types to compatible protocol types
        for i in range(len(raw_json_list)):
            raw_json_list[i]["type"] = conversion_table[raw_json_list[i]["type"]]
        obj_to_write = {"list": raw_json_list, "last_downloaded": datetime.datetime.now().isoformat()}
        json.dump(obj_to_write, open("persistent/tl_sources.json", "w+"))
        return raw_json_list

    def _get_sources_list(self):
        if not os.path.exists("persistent/tl_sources.json"): return self._download_and_return_list()
        obj = json.load(open("persistent/tl_sources.json"))
        if datetime.datetime.now() - datetime.timedelta(days=7) > datetime.datetime.fromisoformat(obj["last_downloaded"]):
            del obj
            return self._download_and_return_list()
        return obj["list"]

    def __init__(self, usable_proxies: list):
        self.usable_proxies = usable_proxies
        self.sources = self._get_sources_list()
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

    def gather(self): #24 hrs in minutes
        self.last_check_time = datetime.datetime.now()
        proxies = []
        addrs = []
        for protoc_num in [PROXY_PROTOC["http"], PROXY_PROTOC["socks4"], PROXY_PROTOC["socks5"]]:
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
                    addrs.append(protoc_num_to_prefix(protoc_num) + addr)
        return addrs
    
    def update_usable_proxies(self, usable):
        self.usable_proxies = usable

if __name__ == '__main__':
    tl = TxtLists([])
    r = tl.gather({"country": ["US"], "anon": [ANONYMITY["high"]]})
    print(len(r))