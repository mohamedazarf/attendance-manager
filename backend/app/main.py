from fastapi import FastAPI
from app.api.v1.attendance import router as attendance_router

app = FastAPI()

app.include_router(attendance_router, prefix="/api/v1/attendance")
