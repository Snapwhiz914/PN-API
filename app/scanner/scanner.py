import threading
from app.scanner.sources import src_lists
import queue
import time
from app.db import proxies, settings
from app.models.proxy import Proxy
from app.models.scanner import ScannerSettings
from app.schemas.scanner import ScanningStatistics
from app.scanner.checker import Checker
from app.scanner.ipinfo import IpInfo
from app.scanner.blacklist import Blacklist
import datetime
import random

"""
The heart of PN
 - sets up all of the scanning threads for each source
 - feeds all of the found proxies into a checking queue
    - new proxies are checked first
    - already seen proxies are checked last, sorted by most reliable gets scanned first
 - dead proxies get checked every hour
 - alive proxies get checked every 15 minutes
"""
scanner_instance = None
class Scanner:
    def __init__(self):
        self.thread_kill_flag = False

        self.settings = settings.find_one_by({})
        self.statistics = ScanningStatistics()

        self.sources = []
        for src_class in src_lists:
            self.sources.append(src_class(usable_proxies=[]))
        self.scan_threads = []
        for src in self.sources:
            new_thread = threading.Thread(target=self._scan, args=(src,))
            self.scan_threads.append(new_thread)
            new_thread.start()
        
        self.checker = Checker()
        self.blacklist = Blacklist()
        self.ipinfo = IpInfo()

        self.check_queue = queue.Queue()
        self.check_threads = []
        print(f"Starting {self.settings.num_scan_threads} check threads...")
        for i in range(self.settings.num_scan_threads):
            t = threading.Thread(target=self._check)
            self.check_threads.append(t)
            t.start()
        print(f"All threads started")
        
        self.check_back = threading.Thread(target=self._check_back_t)
        self.check_back.start()
    
    def get_instance():
        global scanner_instance
        if scanner_instance == None:
            scanner_instance = Scanner()
        return scanner_instance
    
    def _scan_proxy_sorter(self, length):
        def sort_function(uri):
            proxy = proxies.find_one_by({"uri": uri})
            if proxy == None: return random.randint(0, length)
            return proxy.speed
        return sort_function
    
    def _scan(self, source):
        seconds_counter = -1
        while not self.thread_kill_flag:
            seconds_counter += 1
            if not (seconds_counter%(source.SCAN_INTERVAL*60) == 0):
                time.sleep(1)
                continue
            print("Now scanning " + source.LABEL)
            res = []
            try:
                res = source.gather()
            except Exception as e:
                raise e
            # print(f"Sorting {len(res)}")
            # res.sort(key=self._scan_proxy_sorter(len(res)))
            print("Queueing " + source.LABEL)
            for uri in res:
                self.check_queue.put(uri)
                self.statistics.check_queue_size += 1
            print("Done with " + source.LABEL)
    
    def _check(self):
        while not self.thread_kill_flag:
            try:
                uri = self.check_queue.get(block=False)
                self.statistics.check_queue_size -= 1
            except queue.Empty:
                time.sleep(1)
                continue
            
            if self.blacklist.is_blacklisted(uri):
                self.statistics.blacklisted_ips += 1
                continue
            self.statistics.non_blacklisted_ips += 1

            res = self.checker.check(uri, websites_config=self.settings.websites, timeout=self.settings.scan_check_timeout_seconds)
            proxy = proxies.find_one_by({"uri": uri})
            now = datetime.datetime.now()
            rel = self.checker.get_reliability_for(uri)
            if res != False:
                speed, anon, accessible_websites, inaccessible_websites = res
                if proxy == None:
                    location = self.ipinfo.get_info(uri.split(':')[1][2:])
                    proxies.save(Proxy(uri=uri, speed=speed, anon=anon, reliability=1, last_check=now, last_check_status=True, location=location, accessible_websites=accessible_websites, inaccessible_websites=inaccessible_websites))
                else:
                    proxy.speed = speed
                    proxy.anon = anon
                    proxy.reliability = rel
                    proxy.last_check = now
                    proxy.last_check_status = True
                    proxy.accessible_websites = accessible_websites
                    proxy.inaccessible_websites = inaccessible_websites
                    proxies.save(proxy)
            else:
                if proxy != None:
                    proxy.reliability = rel
                    proxy.last_check = now
                    proxy.last_check_status = False
                    proxies.save(proxy)

    def _check_back_t(self):
        seconds_counter = -1
        while not self.thread_kill_flag:
            seconds_counter += 1
            if not (seconds_counter%(self.settings.alive_check_interval_minutes*60) == 0):
                time.sleep(1)
                continue

            for proxy in proxies.find_by({"last_check_status": True}):
                self.check_queue.put(proxy.uri)
                self.statistics.check_queue_size += 1
            
            if not (seconds_counter%(self.settings.dead_check_interval_minutes*60)==0):
                time.sleep(1)
                continue
            
            for proxy in proxies.find_by({"last_check_status": False}):
                self.check_queue.put(proxy.uri)
                self.statistics.check_queue_size += 1
    
    def teardown(self):
        self.thread_kill_flag = True
        self.blacklist.update_thread_kill = True
    
    def hot_change_settings(self, new_settings: ScannerSettings):
        if new_settings.num_scan_threads != len(self.check_threads):
            self.thread_kill_flag = True
            for thread in self.check_threads:
                thread.join()
            self.thread_kill_flag = False
            for i in range(new_settings.num_scan_threads):
                t = threading.Thread(target=self._check)
                self.check_threads.append(t)
                t.start()
        
        if new_settings.blacklist_files != self.blacklist.blocklists:
            self.blacklist.set_blocklist(new_settings.blacklist_files)
        
        self.settings.num_scan_threads = new_settings