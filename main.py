from fastapi import FastAPI
from routes import router

app = FastAPI(title="TablePing API", version="1.0.0")

app.include_router(router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
