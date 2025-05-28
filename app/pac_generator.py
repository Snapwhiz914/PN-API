from typing import List
from app.models.proxy import Proxy
from app.crud.proxies import get_alive_proxies
from string import Template
from app.settings import HOSTNAME

class PacGenerator:
    def __init__(self):
        self.pac_template = Template(open("app/static/pac_template.js", "r").read())

    def _protoc_number_from_proxy(self, proxy: Proxy):
        if proxy.uri.startswith("https"): return 1
        if proxy.uri.startswith("http"): return 0
        if proxy.uri.startswith("socks4"): return 2
        if proxy.uri.startswith("socks5"): return 3

    def generate_pac(self, proxies: List[Proxy], load_balence: bool = False):
        addr_arr = []
        proxies.sort(key=lambda x:x.speed)
        for p in proxies:
            addr_arr.append(("PROXY" if self._protoc_number_from_proxy(p)<=1 else "SOCKS") + " " + p.uri.split("//")[1])
        return self.pac_template.substitute({"p_arr": str(addr_arr), "lb": str(load_balence).lower(), "host": HOSTNAME})

    def generate_blank_pac(self):
        return self.pac_template.substitute({"p_arr": "[]", "lb": "false", "host": HOSTNAME})