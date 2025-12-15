from fastapi import APIRouter, Response, HTTPException, Depends
from fastapi.responses import HTMLResponse
from typing import Optional, Annotated
from app.pac_generator import PacGenerator
from app.schemas.profiles import NewProfile
from app.schemas.proxies import FilterProxies
from app.crud.profiles import get_profile, create_profile, change_proxies, set_active, get_all_profiles, delete_profile
from app.crud.proxies import get_alive_proxies
from app.crud.users import get_current_normal_user
from app.models.user import User
from app.models.profile import Profile

router = APIRouter()
pac_generator = PacGenerator()

def verify_access_to_profile(profile: Profile, user: User):
    if profile is None: raise HTTPException(status_code=404, detail="No profile found")
    if not user.admin and profile.owner.email != user.email: raise HTTPException(status_code=404, detail="No profile found")

@router.get("/", tags=["profiles"])
def read_profiles(current_user: Annotated[User, Depends(get_current_normal_user)]):
    all_profiles = list(get_all_profiles())
    if current_user.admin: return all_profiles
    my_profiles = []
    for profile in all_profiles:
        if profile.owner.email == current_user.email: my_profiles.append(profile)
    return my_profiles

@router.post("/", tags=["profiles"])
def new_profile(new_profile: NewProfile, current_user: Annotated[User, Depends(get_current_normal_user)]):
    if create_profile(new_profile, email=current_user.email):
        return {"status": "success"}
    else:
        raise HTTPException(status_code=500, detail="Creation unsuccessful due to database error")
    
@router.get("/{id}/pac", tags=["profiles"])
def return_pac(id: str):
    profile = get_profile(id)
    content = None
    if profile.active:
        content = pac_generator.generate_pac(get_alive_proxies(profile.proxies), profile.load_balance)
    else:
        content = pac_generator.generate_blank_pac()
    return Response(content=content, media_type="application/x-ns-proxy-autoconfig")

@router.post("/{id}/change_filter", tags=["profiles"])
def change_filter(id: str, new_filter: FilterProxies, current_user: Annotated[User, Depends(get_current_normal_user)]):
    profile = get_profile(id)
    verify_access_to_profile(profile, current_user)
    if change_proxies(profile, new_filter):
        return {"status": "success"}
    else:
        raise HTTPException(status_code=500, detail="Change unsuccessful due to database error")

@router.post("/{id}/activate", tags=["profiles"])
def activate_profile(id: str, current_user: Annotated[User, Depends(get_current_normal_user)]):
    profile = get_profile(id)
    verify_access_to_profile(profile, current_user)
    if set_active(profile, True):
        return {"status": "success"}
    else:
        return {"status": "could not activate"}

@router.post("/{id}/deactivate", tags=["profiles"])
def deactivate_profile(id: str, current_user: Annotated[User, Depends(get_current_normal_user)]):
    profile = get_profile(id)
    verify_access_to_profile(profile, current_user)
    if set_active(profile, False):
        return {"status": "success"}
    else:
        return {"status": "could not deactivate"}

@router.post("/{id}/delete", tags=["profiles"])
def delete_profile_request(id: str, current_user: Annotated[User, Depends(get_current_normal_user)]):
    verify_access_to_profile(get_profile(id), current_user)
    if delete_profile(id):
        return {"status": "success"}
    else:
        raise HTTPException(status_code=500, detail="Deletion unsuccessful due to database error")