from fastapi import FastAPI, Response
import datetime

app = FastAPI()

pac_script = f"""
function FindProxyForURL(url, host) {{
    return "DIRECT";
}}
""".strip()

last_access = None

@app.get("/proxy.pac")
async def proxy():
    global last_access
    if last_access == None:
        print("First access")
        last_access = datetime.datetime.now()
    else:
        print(f"Interval: {(datetime.datetime.now()-last_access).seconds/60} minutes")
        last_access = datetime.datetime.now()
    return Response(
        content=pac_script,
        media_type="application/x-ns-proxy-autoconfig",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )