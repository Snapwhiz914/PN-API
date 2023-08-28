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

import pycountry
from fastapi import FastAPI, Query, Response, status
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles

from ds import PROXY_PROTOC
from sources import src_lists
from sources.txt_lists import TxtLists
from utils.checker import Checker
from utils.ipinfo import IpInfo

#objects
idle_scan_constraints = {
    "speed": 7000
}
scan_q = queue.Queue()
ipinfo = IpInfo()
checker = Checker(ipinfo)
check_back_on = []

#Load saves
save_obj = json.load(open("save.json"))
current_proxies = save_obj["saves"]
scan_q = queue.Queue()
for proxy in current_proxies:
    proxy["lc"] = datetime.datetime.fromtimestamp(proxy["lc"])
    scan_q.put(proxy)

#Load sources
sources = []
for src_class in src_lists:
    sources.append(src_class(usable_proxies=[]))

#Helpers
def get_now_ts() -> int:
    return round(datetime.datetime.now().timestamp())

def protoc_num_to_prefix(num):
    p_type = list(PROXY_PROTOC.keys())[list(PROXY_PROTOC.values()).index(num)]
    return p_type + "://"

def save():
    last_scan_times = {}
    for source in sources:
        last_scan_times[source.LABEL] = round(source.last_check_time.timestamp())
    to_save_obj = {
        "last_scan_times": last_scan_times,
        "saves": current_proxies
    }
    def serialize_dt(dt):
        if type(dt) == datetime.datetime: return dt.timestamp()
        return str(dt)
    json.dump(to_save_obj, open("save.json", "w+"), default=serialize_dt)
    ipinfo.write_out_cache()
    print("saved proxies")

def proxy_in_proxy_list(proxy):
    for prox in current_proxies:
        if proxy["ip"] == prox["ip"]: return True
    return False

def remove_proxy_from_list(proxy):
    for prox in current_proxies:
        if proxy["ip"] == prox["ip"]: current_proxies.remove(prox)

def get_index_of_proxy(proxy):
    for i in range(len(current_proxies)):
        if current_proxies[i]["ip"] == proxy["ip"]: return i
    return -1

#Threads

def scan(source):
    global current_proxies, scan_q
    print("MAIN: Scanning from source " + type(source).__name__ + "...")
    source.update_usable_proxies(current_proxies)
    res = []
    try:
        res = source.gather(idle_scan_constraints)
    except Exception as e:
        print(str(e))
        pass
    print("MAIN: Got " + str(len(res)) + " proxies from " + type(source).__name__)
    for prox in res:
        if not proxy_in_proxy_list(prox): scan_q.put(prox)
    threading.Timer(source.SCAN_INTERVAL*60, scan, args=(source,)).start()
for src in sources:
    threading.Thread(target=scan, args=(src,)).start()

def check():
    global current_proxies, scan_q
    while True:
        to_check = scan_q.get(block=True)
        #print("CHECKER: Checking " + TxtLists._proxy_type_to_abbr_str(None, to_check["protocs"][0]) + "://" + to_check["ip"] + "...")
        res = checker.check(to_check)
        if res != False:
            if proxy_in_proxy_list(res):
                current_proxies[get_index_of_proxy(res)] = res
            else:
                current_proxies.append(res)
            #print("CHECKER: " + to_check["ip"] + " has PASSED")
        else:
            if proxy_in_proxy_list(to_check): remove_proxy_from_list(to_check)
            #print("CHECKER: " + to_check["ip"] + " has FAILED")
            check_back_on.append(to_check)

def check_driver():
    global current_proxies, scan_q
    while True:
        time.sleep(15*60) #Every 15 minutes
        for proxy in current_proxies:
            if int((datetime.datetime.now()-proxy["lc"]).seconds/60) >= 30:
                scan_q.put(proxy)
        for proxy in check_back_on:
            scan_q.put(proxy)
            for prox in check_back_on:
                if proxy["ip"] == prox["ip"]: check_back_on.remove(prox)

for i in range(100): #100 Background scan threads
    threading.Thread(target=check).start()
threading.Thread(target=check_driver).start()
threading.Thread(target=save).start()

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
    for p in current_proxies:
        if countries != None and p["country"] not in countries: continue
        if city != None and p["city"] != city: continue
        if speed != None and p["speed"] > speed: continue
        if anons != None and p["anon"] not in anons: continue
        if protocs != None:
            approved = False
            for protoc in protocs:
                if protoc in p["protocs"]:
                    approved = True
            if not approved: continue
        if last_check != None and (datetime.datetime.now() - p["lc"]).minutes > last_check: continue
        collected_proxies.append(p)
    if len(collected_proxies) > limit:
        collected_proxies.sort(key= lambda x: x["speed"], reverse=True)
        for i in range(len(collected_proxies)-limit):
            collected_proxies.pop()
        return collected_proxies
    return collected_proxies

pac_template = Template(open("pac_template.js", "r").read())
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
        addr_arr.append(("PROXY" if p["protocs"][0]<=1 else "SOCKS") + " " + p["ip"] + ":" + str(p["port"]) + ";")
    return Response(content=pac_template.substitute({"p_arr": str(addr_arr), "lb": str(lb).lower()}),
        media_type="application/x-ns-proxy-autoconfig")

@app.post("/constraints/")
def set_constraints(
    response: Response,
    country: Union[List[str], None] = Query(default=None),
    city: Union[List[str], None] = Query(default=None),
    speed: int = None,
    anon: Union[List[int], None] = Query(default=None),
    protocs: Union[List[int], None] = Query(default=None),
    last_check: int = None):
    for c in country:
        try:
            pycountry.countries.get(c)
        except:
            response.status_code == status.HTTP_400_BAD_REQUEST
            return
    if speed <= 20:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return
    for a in anon:
        if not (a<=3 and a>= 0):
            response.status_code == status.HTTP_400_BAD_REQUEST
            return
    for p in protocs:
        if not (p<=3 and p>= 0):
            response.status_code == status.HTTP_400_BAD_REQUEST
            return
    if country != None: idle_scan_constraints["country"] = country
    if city != None: idle_scan_constraints["city"] = city
    if speed != None: idle_scan_constraints["speed"] = speed
    if anon != None: idle_scan_constraints["anon"] = anon
    if protocs != None: idle_scan_constraints["protocs"] = protocs
    if last_check != None: idle_scan_constraints["lc"] = last_check

@app.get("/constraints/")
def get_constraints():
    return idle_scan_constraints

@app.get("/scan_stats")
def get_scan_stats():
    return {
        "scan_q_len": scan_q.qsize(),
        "check_back_len": len(check_back_on),
        "current_proxies_len": len(current_proxies)
    }

@app.post("/force_save")
def force_save():
    try:
        save()
        return {"success": True}
    except Exception as e:
        print("Force save request error: " + str(e))
        return {"success": False}

if __name__ == "__main__":
    print("http://127.0.0.1:8000/app/map.html")
    uvicorn.run(app, host="0.0.0.0", port=8000)