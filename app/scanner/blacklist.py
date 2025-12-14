import requests
import threading
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import timeit
import struct
import socket
import ipaddress
from app.db import settings

PREFIX = "https://raw.githubusercontent.com/firehol/blocklist-ipsets/refs/heads/master/"

class Blacklist:
    def __init__(self, update_frequency_hours: int = 24):
        self.update_frequency_hours = update_frequency_hours
        self.update_thread_kill = False
        self.update_thread = threading.Thread(target=self._update_thread)
        self.update_thread.start()

        self.settings = settings.find_one_by({})
        self.blocklists = self.settings.blacklist_files
        self.checked_cache = []
        self.downloading = False
        self._download()
    
    def _ip_to_number(self, ip):
        return struct.unpack('!I', socket.inet_aton(ip))[0]
    
    def _download(self):
        print("Blacklist is refreshing")
        self.downloading = True
        self.main_cache = {}
        for list_name in self.blocklists:
            res = requests.get(f"{PREFIX}{list_name}")

            content = ""
            if res.status_code != 200:
                if os.path.exists(f"app/static/blacklist/{list_name}"):
                    content = open(f"app/static/blacklist/{list_name}", "r").read()
                else:
                    print(f"Warning: blocklist fetch for {list_name} was unsuccessful with status code {res.status_code}, and no file backup was found. skipping")
                    continue
            else:
                content = res.content.decode()
                f = open(f"app/static/blacklist/{list_name}", "w")
                f.write(content)
                f.close()
                
            self.main_cache[list_name] = []
            for line in content.splitlines():
                if line[0] == '#': continue
                if "/" not in line:
                    self.main_cache[list_name].append(self._ip_to_number(line))
                else:
                    net = ipaddress.IPv4Network(line)
                    self.main_cache[list_name].append(str(int(net.network_address)) + "-" + str(int(net.broadcast_address)))
        self.downloading = False

    def _update_thread(self):
        seconds_counter = 0
        first_run = True
        while not self.update_thread_kill:
            seconds_counter += 1
            if not ((seconds_counter/60/60)%self.update_frequency_hours == 0):
                time.sleep(1)
                continue
            if first_run:
                first_run = False
                continue
            self._download()
    
    def _compare_ipornetset_to_ip(self, ipornetset, ip):
        """
        returns 1 if ip is greater than ipornetset, -1 if less than, 0 if ip is equal to (or within) ipornetset
        """
        ip = self._ip_as_number(ip)
        if "/" in ipornetset:
            cidr = ipornetset.split("/")
            if ip < self._ip_as_number(cidr[0]): return 1
            
            ip_parts = list(map(int, cidr[0].split('.')))
            ip_int = (ip_parts[0] << 24) | (ip_parts[1] << 16) | (ip_parts[2] << 8) | ip_parts[3]
            host_bits = 32 - int(cidr[1])
            broadcast_int = ip_int | ((1 << host_bits) - 1)
            if ip > sum([((broadcast_int >> (8 * i)) & 0xFF) for i in reversed(range(4))]): return 1
            return 0
        other_ip = self._ip_as_number(ipornetset)
        if ip > other_ip: return -1
        if ip < other_ip: return 1
        return 0

    # def _binary_search_ip_list(self, lst, ip):
    #     low = 0
    #     high = len(lst) - 1
    #     mid = 0

    #     while low <= high:
    #         mid = (high + low) // 2
    #         print(mid)
    #         if self._compare_ipornetset_to_ip(lst[mid], ip) < 0:
    #             print(f"{self._ip_as_number(ip)} > {self._ip_as_number(lst[mid])}")
    #             low = mid + 1
    #         elif self._compare_ipornetset_to_ip(lst[mid], ip) > 0:
    #             print(f"{self._ip_as_number(ip)} < {self._ip_as_number(lst[mid])}")
    #             high = mid - 1
    #         else:
    #             return True
    #     return False

    def _binary_search_ip_list(self, lst, ip):
        low = 0
        high = len(lst) - 1
        mid = 0

        ip = self._ip_to_number(ip)
        while low <= high:
            mid = (high + low) // 2
            if type(lst[mid]) == int:
                if ip > lst[mid]:
                    low = mid + 1
                elif ip < lst[mid]:
                    high = mid - 1
                else:
                    return True
            else:
                l, h = lst[mid].split("-")
                if ip > int(h):
                    low = mid + 1
                elif ip < int(l):
                    high = mid - 1
                else:
                    return True
        return False
    
    def is_blacklisted(self, uri):
        ip = uri.split(':')[1][2:]
        if ip in self.checked_cache: return True
        # with ThreadPoolExecutor(max_workers=None) as executor:
        #     futures = [executor.submit(self._binary_search_ip_list, lst, ip) for i, lst in enumerate(self.main_cache.values())]
        #     for future in as_completed(futures):
        #         result = future.result()
        #         if result:
        #             # Cancel all other futures if one result is found
        #             for f in futures:
        #                 f.cancel()
        #             self.checked_cache.append(ip)
        #             return True
        while self.downloading:
            time.sleep(0.001)
        for name, lst in self.main_cache.items():
            if self._binary_search_ip_list(lst, ip):
                return True
        return False
    
    def set_blocklist(self, new_blocklist):
        self.blocklists = new_blocklist
        while self.downloading:
            time.sleep(0.001)
        self._download()