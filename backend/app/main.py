from fastapi import FastAPI
from app.api.v1.attendance import router as attendance_router
from app.api.v1.employee import router as employee_router

app = FastAPI()

app.include_router(attendance_router, prefix="/api/v1/attendance")
app.include_router(employee_router, prefix="/api/v1/employee")