import threading
from sources import src_lists
import queue
import time
from db import proxies

"""
The heart of PN
 - sets up all of the scanning threads for each source
 - feeds all of the found proxies into a checking queue
    - new proxies are checked first
    - already seen proxies are checked last, sorted by most reliable gets scanned first
 - dead proxies get checked every hour
 - alive proxies get checked every 15 minutes
"""
class Scanner:
    def __init__(self, num_scan_threads: int = 100, dead_check: int = 60, alive_check: int = 15):
        self.thread_kill_flag = False
        self.sources = []
        for src_class in src_lists:
            self.sources.append(src_class(usable_proxies=[]))
        self.scan_threads = []
        for src in self.sources:
            new_thread = threading.Thread(target=self._scan, args=(src,))
            self.scan_threads.append(new_thread)
            new_thread.start()
        
        self.check_queue = queue.Queue()
        self.check_threads = []
        for i in range(num_scan_threads):
            t = threading.Thread(target=self._check)
            self.check_threads.append(t)
            t.start()
        
        self.check_alive = threading.Thread(target=self._scan_lives)
        self.check_dead = threading.Thread(target=self._scan_deads)
        self.check_alive.start()
        self.check_dead.start()
    
    def _scan_proxy_sorter(self, uri):
        proxy = proxies.find_one({"uri": uri})
        if proxy == None: return 0
        return proxy["speed"]
    
    def _scan(self, source):
        seconds_counter = 0
        while not self.thread_kill_flag:
            if not seconds_counter%(source.SCAN_INTERVAL*60):
                seconds_counter += 1
                time.sleep(1)
                continue
            res = []
            try:
                res = source.gather()
            except Exception as e:
                print(str(e))
            res.sort(self._scan_proxy_sorter)
            for uri in res:
                self.check_queue.put(uri)
    
    def _check(self):
        while not self.thread_kill_flag:
            try:
                to_check = self.check_queue.get(block=False)
            except queue.Empty:
                time.sleep(1)
                continue
            
            res = checker.check(to_check.uri, timeout=(to_check.speed+2 if to_check.speed is not None else 10))
            if res != False:
                to_check.speed = res[0]
                to_check.reliability = to_check.reliability + 1
                to_check.last_check = datetime.datetime.now()
                transfer_to_alive(to_check)
            else:
                to_check.last_check = datetime.datetime.now()
                to_check.reliability = to_check.reliability - 1
                transfer_to_dead(to_check)


    def _scan_lives(self):
        pass

    def _scan_deads(self):
        pass

    def get_queue_size(self):
        return self.check_queue.qsize()