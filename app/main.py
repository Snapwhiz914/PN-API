from fastapi import FastAPI
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
import uvicorn
import app.db
from app.routers.proxies import router as proxies_router
from app.routers.profiles import router as profiles_router
from app.routers.scanner import router as scanner_router
from app.scanner.scanner import Scanner

async def lifespan(app: FastAPI):
    yield
    Scanner.get_instance().teardown()

app = FastAPI(lifespan=lifespan)
app.mount("/app", StaticFiles(directory="app/static/site", html=True), name="static")
app.include_router(proxies_router, prefix="/proxies")
app.include_router(profiles_router, prefix="/profiles")
app.include_router(scanner_router, prefix="/scanner")
Scanner.get_instance()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7769)
