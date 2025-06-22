from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import models
from .database import engine
from fastapi.staticfiles import StaticFiles

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include the main API router
from .routers.api import router as api_router
app.include_router(api_router)

app.mount("/static/uploads", StaticFiles(directory="app/routers/uploads"), name="uploads") 