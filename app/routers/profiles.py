from fastapi import APIRouter, Response, HTTPException, Request
from fastapi.responses import HTMLResponse
from typing import Optional
from app.pac_generator import PacGenerator
from app.schemas.profiles import NewProfile, SetFingerprint
from app.schemas.proxies import FilterProxies
from app.crud.profiles import get_profile, create_profile, try_set_fingerprint, change_proxies, set_active, get_all_profiles
from app.crud.proxies import get_alive_proxies
from string import Template
import re

router = APIRouter()
pac_generator = PacGenerator()

verify_fingerprint_html = open("app/static/profile_html/verify_fingerprint.html").read()
profile_template = Template(open("app/static/profile_html/profile.html").read())

@router.get("/", tags=["profiles"])
def read_profiles():
    return list(get_all_profiles())

@router.post("/", tags=["profiles"])
def new_profile(new_profile: NewProfile):
    if create_profile(new_profile):
        return {"status": "success"}
    else:
        raise HTTPException(status_code=500, detail="Creation was unsuccessful")

@router.get("/{id}", tags=["profiles"], response_class=HTMLResponse)
def read_profile(id: str, fp: Optional[str] = None):
    profile = get_profile(id)
    if profile is not None:
        if profile.fingerprint == "":
            return profile_template.substitute({"profile_name": profile.name, "active": profile.active})
        else:
            #if fingerprint is set
            if fp is None: return verify_fingerprint_html
            if fp is not None and fp == profile.fingerprint: return profile_template.substitute({"profile_name": profile.name, "active": profile.active})
            else: raise HTTPException(status_code=403, detail="Invalid fingerprint")
    raise HTTPException(status_code=404, detail="No profile found")
    
@router.get("/{id}/pac", tags=["profiles"])
def return_pac(id: str):
    profile = get_profile(id)
    content = None
    if profile.active:
        content = pac_generator.generate_pac(get_alive_proxies(profile.proxies), profile.load_balance)
    else:
        content = pac_generator.generate_blank_pac()
    return Response(content=content, media_type="application/x-ns-proxy-autoconfig")

@router.post("/{id}/set_fingerprint", tags=["profiles"])
def set_profile_fingerprint(id: str, fingerprint: SetFingerprint):
    if try_set_fingerprint(id, fingerprint.fingerprint):
        return {"status": "success"}
    else:
        return {"status": "fingerprint already set"}

@router.post("/{id}/change_filter", tags=["profiles"])
def set_profile_fingerprint(id: str, new_filter: FilterProxies, fp: str):
    profile = get_profile(id)
    if profile is None: raise HTTPException(status_code=404, detail="No profile found")
    if fp != profile.fingerprint: raise HTTPException(status_code=403, detail="Invalid fingerprint")
    if change_proxies(profile, new_filter):
        return {"status": "success"}
    else:
        return {"status": "unsuccessful change"}

@router.post("/{id}/activate", tags=["profiles"])
def activate_profile(id: str, fp: str):
    profile = get_profile(id)
    if profile is None: raise HTTPException(status_code=404, detail="No profile found")
    if fp != profile.fingerprint:
        raise HTTPException(status_code=403, detail="Invalid fingerprint")
    if set_active(profile, True):
        return {"status": "success"}
    else:
        return {"status": "could not activate"}

@router.post("/{id}/deactivate", tags=["profiles"])
def deactivate_profile(id: str, fp: str):
    profile = get_profile(id)
    if profile is None: raise HTTPException(status_code=404, detail="No profile found")
    if fp != profile.fingerprint: raise HTTPException(status_code=403, detail="Invalid fingerprint")
    if set_active(profile, False):
        return {"status": "success"}
    else:
        return {"status": "could not deactivate"}

@router.post("/{id}/delete", tags=["profiles"])
def delete_profile(id: str):
    if delete_profile(id):
        return {"status": "success"}
    else:
        return {"status": "unsuccessful delete"}