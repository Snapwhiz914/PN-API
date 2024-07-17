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
dead = []

#Load saves
for proxy in json.load(open(os.path.join("persistent", "save.json")))["saves"] if os.path.exists(os.path.join("persistent", "save.json")) else []:
    if proxy["last_check"] == None: continue
    proxy["last_check"] = datetime.datetime.fromisoformat(proxy["last_check"])
    if datetime.datetime.now() > proxy["last_check"] + datetime.timedelta(minutes=Config.get_conf_option("startup_min_lastcheck_to_rescan")):
        check_q.put(proxy["uri"])

#Load sources
sources = []
for src_class in src_lists: sources.append(src_class(usable_proxies=[]))

#Helpers
def get_now_ts() -> int:
    return round(datetime.datetime.now().timestamp())

def proxy_in_either_list(uri):
    for prox in alive:
        if prox.uri == uri: return True
    for prox in dead:
        if prox.uri == uri: return True
    return False

def remove_proxy_from_either(proxy):
    global alive, dead
    for prox in alive:
        if proxy.uri == prox.uri: alive.remove(prox)
    for prox in dead:
        if proxy.uri == prox.uri: prox.remove(prox)

def get_index_of_proxy_in_list(proxy_list, proxy):
    i = 0
    for prox in proxy_list:
        if proxy.uri == prox.uri: return i
        i+=1
    return -1

def transfer_to_alive(proxy):
    global alive
    remove_proxy_from_either(proxy)
    alive.append(proxy)

def transfer_to_dead(proxy):
    global dead
    remove_proxy_from_either(proxy)
    dead.append(proxy)

#Threads

def save():
    last_scan_times = {}
    for source in sources: last_scan_times[source.LABEL] = round(source.last_check_time.timestamp())
    to_save_obj = {
        "last_scan_times": last_scan_times,
        "saves": alive + dead
    }
    def serialize_dt(dt):
        if type(dt) == datetime.datetime: return dt.isoformat()
        if type(dt) == Proxy: return dt.as_dict()
        return str(dt)
    json.dump(to_save_obj, open(os.path.join("persistent", "save.json"), "w+"), default=serialize_dt)
    ipinfo.write_out_cache()
    print("saved proxies")

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
            if not proxy_in_either_list(prox): check_q.put(prox)
        time.sleep(source.SCAN_INTERVAL*60)

for src in sources:
    threading.Thread(target=scan, args=(src,)).start()

def check():
    global check_q
    while True:
        to_check = check_q.get(block=True)
        if type(to_check) == Proxy:
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
        else:
            res = checker.check(to_check)
            if res != False:
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
                # if to_check is a uri, we can assume it is not already in the proxy list, so no need to check here before appending
                alive.append(new_proxy)
            else:
                dead.append(Proxy(uri=to_check, last_check=datetime.datetime.now()))

def scan_lives():
    global check_q
    total_list_seconds = Config.get_conf_option("live_check_freq")*60
    while True:
        for proxy in alive:
            check_q.put(proxy)
            time.sleep(total_list_seconds/(len(alive)+1))
        time.sleep(0.01)

def scan_deads():
    global check_q
    total_list_seconds = Config.get_conf_option("dead_check_freq")*60
    while True:
        for proxy in dead:
            check_q.put(proxy)
            time.sleep(total_list_seconds/(len(dead)+1))
        time.sleep(0.01)

for i in range(100):
    threading.Thread(target=check).start()
threading.Thread(target=scan_lives).start()
threading.Thread(target=scan_deads).start()

def save_t():
    while True:
        time.sleep(5*60)
        save()
threading.Thread(target=save_t).start()

#App definition
app = FastAPI(on_shutdown=[save])
app.mount("/app", StaticFiles(directory="static"), name="static")
@app.on_event("shutdown")
def shutdown_save():
    save()

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
        if protocs != None:
            approved = False
            for protoc in protocs:
                if protoc == p.protoc:
                    approved = True
            if not approved: continue
        if last_check != None and (datetime.datetime.now() - p.last_check).minutes > last_check: continue
        collected_proxies.append(p)
    if len(collected_proxies) > limit:
        collected_proxies.sort(key= lambda x: x.speed)
        for i in range(len(collected_proxies)-limit):
            collected_proxies.pop()
        return collected_proxies
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
        "check_back_len": len(dead),
        "current_proxies_len": len(alive)
    }

@app.post("/force_save")
def force_save():
    try:
        save()
        return {"success": True}
    except Exception as e:
        print("Force save request error: " + str(e))
        return {"success": False}

@app.on_event("shutdown")
def shutdown():
    THREAD_KILL_FLAG = False

if __name__ == "__main__":
    print("http://127.0.0.1:8000/app/map.html")
    uvicorn.run(app, host="0.0.0.0", port=8000)
