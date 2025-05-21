from fastapi import APIRouter

router = APIRouter()

@router.get("/profiles/", tags=["profiles"])
def read_profiles():
    return []

@router.get("/profiles/{id}", tags=["profiles"])
def read_profile(id: str):
    return Proxy()

@router.post("/profiles/set_fingerprint", tags=["profiles"])
def set_profile_fingerprint(profile: Profile):
    return {}

@router.post("/profiles/activate", tags=["profiles"])
def activate_profile(profile: Profile):
    return {}

@router.post("/profiles/deactivate", tags=["profiles"])
def activate_profile(profile: Profile):
    return {}

@router.post("/profiles/delete", tags=["profiles"])
def delete_profile(profile: Profile):
    return {}