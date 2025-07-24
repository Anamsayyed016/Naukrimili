from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import jobs, apply, ats, fraud

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(jobs.router)
app.include_router(apply.router)
app.include_router(ats.router)
app.include_router(fraud.router, prefix="/fraud", tags=["fraud"])

@app.get("/")
def read_root():
    return {"message": "Backend API is running"} 