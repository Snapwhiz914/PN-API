from fastapi import APIRouter

router = APIRouter()

@router.get("/settings/", tags=["settings"])
def get_settings():
    return []

@router.post("/settings/{id}", tags=["settings"])
def update_settings():
    return {}