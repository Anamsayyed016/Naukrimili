from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import jobs, ats

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database initialization removed as it's not needed for this implementation

app.include_router(jobs.router)
app.include_router(ats.router)

@app.get("/")
def read_root():
    return {"message": "Backend API is running"} 