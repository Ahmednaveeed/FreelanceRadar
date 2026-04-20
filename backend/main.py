from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import profile
from database import engine, Base
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FreelanceRadar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)

@app.get("/")
def root():
    return {"status": "FreelanceRadar backend is running ✅"}