from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
import uvicorn
import app.db
from app.routers.proxies import router as proxies_router
from app.routers.profiles import router as profiles_router
from app.routers.scanner import router as scanner_router
from app.routers.users import router as users_router
from app.routers.users import login_for_access_token
from app.scanner.scanner import Scanner
from app.schemas.users import Token
from typing import Annotated
#Fix for mimetypes guessing hanging
import mimetypes
mimetypes.init(files=[])

async def lifespan(app: FastAPI):
    yield
    Scanner.get_instance().teardown()

app = FastAPI(lifespan=lifespan)
app.mount("/app", StaticFiles(directory="frontend"), name="frontend")
app.include_router(proxies_router, prefix="/api/proxies")
app.include_router(profiles_router, prefix="/api/profiles")
app.include_router(scanner_router, prefix="/api/scanner")
app.include_router(users_router, prefix="/api/users")
@app.post("/api/token")
def get_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    return login_for_access_token(form_data)

Scanner.get_instance()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7769)
