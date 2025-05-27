import requests
import sys
import datetime
import json
import re
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

class TxtLists:
    SCAN_INTERVAL = 720 #most lists update about half daily
    LABEL = "TxtLists"

    def _download_and_return_list(self):
        result = requests.get("https://raw.githubusercontent.com/MatrixTM/MHDDoS/main/config.json", timeout=10)
        if not result.ok:
            print(f"TextList warning: could not redownload proxy list due to error {result.status_code}, using old")
            return json.load(open("app/static/sources/tl_sources.json"))["list"]
        raw_json_list = result.json()["proxy-providers"]
        conversion_table = {4:2, 5:3, 1:0} #convert list types to compatible protocol types
        for i in range(len(raw_json_list)):
            raw_json_list[i]["type"] = conversion_table[raw_json_list[i]["type"]]
        obj_to_write = {"list": raw_json_list, "last_downloaded": datetime.datetime.now().isoformat()}
        json.dump(obj_to_write, open("app/static/sources/tl_sources.json", "w+"))
        return raw_json_list

    def _get_sources_list(self):
        if not os.path.exists("app/static/sources/tl_sources.json"): return self._download_and_return_list()
        obj = json.load(open("app/static/sources/tl_sources.json"))
        if datetime.datetime.now() - datetime.timedelta(days=1) > datetime.datetime.fromisoformat(obj["last_downloaded"]):
            del obj
            return self._download_and_return_list()
        return obj["list"]

    def __init__(self, usable_proxies: list):
        self.usable_proxies = usable_proxies
        self.ipport_pattern = r"((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5})$"
        self.last_check_time = datetime.datetime.now()

    def _gen_urls(self, protoc: int):
        urls = []
        self.sources = self._get_sources_list()
        for src in self.sources:
            if src["type"] == protoc:
                urls.append(src["url"])
        return urls

    def _protoc_num_to_prefix(self, num):
        if num == 0: return "http://"
        if num == 1: return "https://"
        if num == 2: return "socks4://"
        if num == 3: return "socks5://"
    
    def _download_list(self, url, protoc_num):
        addrs = []
        try:
            result = requests.get(url, timeout=10)
        except requests.exceptions.RequestException:
            return []
        for addr in result.text.splitlines():
            if re.match(self.ipport_pattern, addr) == None: continue
            if addr in addrs: continue
            addrs.append(self._protoc_num_to_prefix(protoc_num) + addr)
        return addrs

    def gather(self): #24 hrs in minutes
        self.last_check_time = datetime.datetime.now()
        addrs = []
        for protoc_num in [0, 2, 3]:
            urls = self._gen_urls(protoc_num)
            with ThreadPoolExecutor(max_workers=None) as executor:
                futures = [executor.submit(self._download_list, url, protoc_num) for i, url in enumerate(urls)]
                for future in as_completed(futures):
                    result = future.result()
                    for addr in result:
                        if addr in addrs: continue
                        addrs.append(addr)
        return addrs
    
    def update_usable_proxies(self, usable):
        self.usable_proxies = usable