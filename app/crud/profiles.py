from app.models.profile import Profile
from app.schemas.profiles import *
from app.db import profiles
from fastapi import HTTPException
from bson import ObjectId
import re

def get_all_profiles():
    all_profiles = profiles.find_by({})
    return all_profiles

def validate_id(id: str):
    if len(id) == 24 and re.match(r"^[a-f0-9]+$", id): return
    else: raise HTTPException(status_code=400, detail="Bad ID")

def get_profile(id: str = None):
    validate_id(id)
    profile = profiles.find_one_by_id(ObjectId(id))
    if profile == None:
        raise HTTPException(status_code=404, detail="No profile found")
    return profile

def create_profile(new_profile: NewProfile):
    profile = Profile(fingerprint="", name=new_profile.name, active=False, proxies=new_profile.proxy_filter, load_balance=False)
    return profiles.save(profile).acknowledged

def try_set_fingerprint(id: str, fingerprint: str):
    profile = get_profile(id)
    if profile.fingerprint != "":
        return False
    profile.fingerprint = fingerprint
    profiles.save(profile)
    return True

def change_proxies(profile: Profile, new_proxies: FilterProxies):
    profile.proxies = new_proxies
    return profiles.save(profile).acknowledged

def set_active(profile: Profile, active: bool):
    profile.active = active
    return profiles.save(profile).acknowledged

def is_active(id: str):
    return get_profile(id).active

def delete_profile(id: str):
    dr = profiles.delete_by_id(id)
    return dr.deleted_count == 1