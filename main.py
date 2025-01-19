#Sources:
#   - hidemy list
#   - pubproxy
#   - speedx github
#Tools:
#   - hidemy checker: checks list of addr:port proxies
#   - ipify: gets info about ips

import datetime
import json
import queue
import threading
import time
from string import Template
from typing import List, Union
import uvicorn
import os
import time

import pycountry
from fastapi import FastAPI, Query, Response, status
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles

from sources import src_lists
from utils.checker import Checker
from utils.ipinfo import IpInfo
from utils.config import Config
from utils.ds import Proxy, get_ip

THREAD_KILL_FLAG = True

#objects
check_q = queue.Queue()
ipinfo = IpInfo()
checker = Checker()
alive = []

#Load saves
save_obj = json.load(open(os.path.join("persistent", "save.json")))["saves"] if os.path.exists(os.path.join("persistent", "save.json")) else []
for proxy in save_obj:
    proxy["last_check"] = datetime.datetime.fromisoformat(proxy["last_check"])
    if datetime.datetime.now() > proxy["last_check"] + datetime.timedelta(minutes=Config.get_conf_option("startup_min_lastcheck_to_rescan")):
        check_q.put(proxy["uri"])

#Load sources
sources = []
for src_class in src_lists: sources.append(src_class(usable_proxies=[]))

#Helpers
def get_now_ts() -> int:
    return round(datetime.datetime.now().timestamp())

def proxy_in_list(uri):
    for prox in alive:
        if prox.uri == uri: return True
    return False

def remove_proxy_from_list(uri):
    global alive
    for prox in alive:
        if uri == prox.uri: alive.remove(prox)

def get_proxy_in_list(uri):
    for prox in alive:
        if uri == prox.uri: return prox
    return None

#Threads

def save():
    last_scan_times = {}
    for source in sources: last_scan_times[source.LABEL] = round(source.last_check_time.timestamp())
    to_save_obj = {
        "last_scan_times": last_scan_times,
        "saves": alive
    }
    def serialize_dt(dt):
        if type(dt) == datetime.datetime: return dt.isoformat()
        if type(dt) == Proxy: return dt.as_dict()
        return str(dt)
    save_file_path = os.path.join("persistent", "save.json")
    with open(save_file_path + ".tmp", 'w') as tmp_save:
        json.dump(to_save_obj, tmp_save, default=serialize_dt)
    os.rename(save_file_path + ".tmp", save_file_path)
    ipinfo.write_out_cache()

def scan(source):
    global check_q
    while True:
        print("MAIN: Scanning from source " + type(source).__name__ + "...")
        source.update_usable_proxies(alive)
        res = []
        try:
            res = source.gather()
        except Exception as e:
            print(str(e))
        print("MAIN: Got " + str(len(res)) + " proxies from " + type(source).__name__)
        for prox in res:
            if not proxy_in_list(prox): check_q.put(prox)
        time.sleep(source.SCAN_INTERVAL*60)

for src in sources:
    threading.Thread(target=scan, args=(src,)).start()

def check():
    global check_q, THREAD_KILL_FLAG
    while THREAD_KILL_FLAG:
        to_check = check_q.get(block=True)
        timeout = to_check.speed+2 if hasattr(to_check, "speed") else None
        res = checker.check(to_check, timeout=timeout)
        if proxy_in_list(to_check):
            if res:
                proxy_ref = get_proxy_in_list(to_check)
                proxy_ref.reliability += 1
                proxy_ref.last_check = datetime.datetime.now()
                proxy_ref.speed = (proxy_ref.speed + res[0])/2.0
            else:
                remove_proxy_from_list(to_check)
        else:
            if res:
                loc_info = ipinfo.get_info(get_ip(to_check))
                new_proxy = Proxy(
                    uri=to_check,
                    city=loc_info["city"],
                    region=loc_info["region"],
                    country=loc_info["country"],
                    speed=res[0],
                    anon=res[1],
                    lat=loc_info["lat"],
                    lon=loc_info["lon"],
                    reliability=1,
                    last_check=datetime.datetime.now()
                )
                alive.append(new_proxy)

def scan_lives():
    global check_q, THREAD_KILL_FLAG
    total_list_seconds = Config.get_conf_option("live_check_freq")*60
    while THREAD_KILL_FLAG:
        for proxy in alive:
            check_q.put(proxy.uri)
            time.sleep(total_list_seconds/(len(alive)+1))
        time.sleep(0.01)

for i in range(100):
    threading.Thread(target=check).start()
threading.Thread(target=scan_lives).start()

def save_t():
    while THREAD_KILL_FLAG:
        time.sleep(5*60)
        save()
threading.Thread(target=save_t).start()

#App definition
app = FastAPI()
app.mount("/app", StaticFiles(directory="static"), name="static")

@app.get("/proxy/")
def return_proxy(countries: Union[List[str], None] = Query(default=None),
    city: str = None,
    speed: int = None,
    anons: Union[List[int], None] = Query(default=None),
    protocs: Union[List[int], None] = Query(default=None),
    last_check: int = None,
    limit: int = 20):
    collected_proxies = []
    for p in alive:
        if countries != None and p.country not in countries: continue
        if city != None and p.city != city: continue
        if speed != None and p.speed > speed: continue
        if anons != None and p.anon not in anons: continue
        if protocs != None and p.get_protoc_number() not in protocs: continue
        if last_check != None and (datetime.datetime.now() - p.last_check).minutes > last_check: continue
        collected_proxies.append(p)
    if len(collected_proxies) > limit:
        collected_proxies.sort(key= lambda x: x.speed)
        return collected_proxies[0:limit]
    return collected_proxies

pac_template = Template(open("static/pac_template.js", "r").read())
@app.get("/pac/")
def return_pac(
    response: Response,
    country: Union[List[str], None] = Query(default=None),
    city: str = None,
    speed: int = None,
    anons: Union[List[int], None] = Query(default=None),
    protocs: Union[List[int], None] = Query(default=None),
    last_check: int = None,
    limit: int = 20,
    lb: bool = False):
    proxies = return_proxy(country, city, speed, anons, protocs, last_check, limit)
    if len(proxies) == 0:
        response.status_code = status.HTTP_204_NO_CONTENT
        return ""
    addr_arr = []
    for p in proxies:
        addr_arr.append(("PROXY" if p.get_protoc_number()<=1 else "SOCKS") + " " + p.uri.split("//")[1])
    return Response(content=pac_template.substitute({"p_arr": str(addr_arr), "lb": str(lb).lower()}),
        media_type="application/x-ns-proxy-autoconfig")

@app.get("/scan_stats")
def get_scan_stats():
    return {
        "scan_q_len": check_q.qsize(),
        "current_proxies_len": len(alive)
    }

@app.post("/force_save")
def force_save():
    try:
        save()
        print("Force save successful")
        return {"success": True}
    except Exception as e:
        print("Force save request error: " + str(e))
        return {"success": False}

@app.on_event("shutdown")
def shutdown():
    global THREAD_KILL_FLAG
    THREAD_KILL_FLAG = False

if __name__ == "__main__":
    print("http://127.0.0.1:8000/app/map.html")
    uvicorn.run(app, host="0.0.0.0", port=8000)
