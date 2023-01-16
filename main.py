#Sources:
#   - hidemy list
#   - pubproxy
#   - speedx github
#Tools:
#   - hidemy checker: checks list of addr:port proxies
#   - ipify: gets info about ips
#Goal:
#   - constant list of at least 5 working, moderate-speed (1000ms) proxies at all times
#   - serve them through an api

#Structure:
#Proxy gatherer.py:
# - class that start backgd job to scan lists for proxies
# - uses all sources and tools available in tools/ and lists/
# - proxy data structure: dict{ip: str, port: str, country: str, city: str, region: str, speed: int(0-10000)ms,
# anon: 0(none), 1(low), 2(med), 3(high), protocs: [int], lc(last check, in minutes): int}
#main.py (this file):
# - serves an api with these lists

import datetime
import json
from ds import PROXY_PROTOC, ANONYMITY
from sources.hidemy import HideMyNameNet
from fastapi import FastAPI, Query, Response, status
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from typing import Union, List
import threading
import time
import queue
import pycountry

from sources.pubproxy import PubProxy
from sources.txt_lists import TxtLists
from utils.checker import Checker
from utils.ipinfo import IpInfo
from string import Template

idle_scan_constraints = {
    "anon": [ANONYMITY["high"], ANONYMITY["med"]],
    "speed": 10000
}

current_proxies = json.load(open("save.json"))

hm = HideMyNameNet(usable_proxies=current_proxies)
pp = PubProxy(usable_proxies=current_proxies)
tl = TxtLists(usable_proxies=current_proxies)
sources = [pp, hm, tl]

ipinfo = IpInfo()
checker = Checker(ipinfo)

pac_template = Template(open("pac_template.js", "r").read())

scan_q = queue.Queue()
for proxy in current_proxies:
    proxy["lc"] = datetime.datetime.fromisoformat(proxy["lc"])
    if int((datetime.datetime.now()-proxy["lc"]).seconds/60) >= 30:
        scan_q.put(proxy)

def save():
    json.dump(current_proxies, open("save.json", "w+"), default=str)
    ipinfo.write_out_cache()
    print("saved proxies")

app = FastAPI(on_shutdown=[save])
app.mount("/app", StaticFiles(directory="static"), name="static")

def protoc_num_to_prefix(num):
    p_type = list(PROXY_PROTOC.keys())[list(PROXY_PROTOC.values()).index(num)]
    return p_type + "://"

def bkgd_scan():
    global current_proxies, scan_q
    minutes_since_start = 720
    while True:
        for s in sources:
            if minutes_since_start%s.SCAN_INTERVAL == 0:
                print("MAIN: Scanning from source " + type(s).__name__ + "...")
                s.update_usable_proxies(current_proxies)
                res = []
                try:
                    res = s.gather(idle_scan_constraints)
                except: pass
                print("MAIN: Got " + str(len(res)) + " proxies from " + type(s).__name__)
                for prox in res:
                    for proxy in current_proxies:
                        if proxy["ip"] == prox["ip"]: continue
                    scan_q.put(prox)
        time.sleep(60)
        minutes_since_start += 1

def bkgd_check_driver():
    global current_proxies, scan_q
    while True:
        time.sleep(15*60) #Every 15 minutes
        for proxy in current_proxies:
            if int((datetime.datetime.now()-proxy["lc"]).seconds/60) >= 30:
                scan_q.put(proxy)

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

def bkgd_check():
    global current_proxies, scan_q
    while True:
        to_check = scan_q.get(block=True)
        print("CHECKER: Checking " + tl._proxy_type_to_abbr_str(to_check["protocs"][0]) + "://" + to_check["ip"] + "...")
        res = checker.check(to_check)
        if res != False:
            if proxy_in_proxy_list(res):
                current_proxies[get_index_of_proxy(res)] = res
            else:
                current_proxies.append(res)
            print("CHECKER: " + to_check["ip"] + " has PASSED")
        else:
            if proxy_in_proxy_list(to_check): remove_proxy_from_list(to_check)
            print("CHECKER: " + to_check["ip"] + " has FAILED")

def bkgd_save(): 
    while True:
        json.dump(current_proxies, open("save.json", "w+"), default=str)
        ipinfo.write_out_cache()
        time.sleep(5*60)

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
        if countries != None:
            approved = True
            for country in countries:
                if p["country"] not in countries:
                    approved = False
            if not approved: continue
        if city != None and p["city"] != city: continue
        if speed != None and p["speed"] > speed: continue
        if anons != None:
            approved = True
            for anon in anons:
                if p["anon"] not in anons:
                    approved = False
            if not approved: continue
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
    idle_scan_constraints = {
        "country": country or idle_scan_constraints["country"],
        "city": city or idle_scan_constraints["city"],
        "speed": speed or idle_scan_constraints["speed"],
        "anon": anon or idle_scan_constraints["anon"],
        "protocs": protocs or idle_scan_constraints["protocs"],
        "lc": last_check or idle_scan_constraints["lc"]
    }

@app.get("/constraints/")
def get_constraints():
    return idle_scan_constraints

threading.Thread(target=bkgd_scan).start()
for i in range(10): #10 Background scan threads
    threading.Thread(target=bkgd_check).start()
threading.Thread(target=bkgd_check_driver).start()
threading.Thread(target=bkgd_save).start()