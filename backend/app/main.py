from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.attendance import router as attendance_router
from app.api.v1.employee import router as employee_router
from app.api.v1.zk_test import router as testConnexion

app = FastAPI()

# Allow your frontend origin
origins = [
    "http://localhost:5173",  # Vite dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # or ["*"] for all origins (not recommended in production)
    allow_credentials=True,
    allow_methods=["*"],     # GET, POST, etc.
    allow_headers=["*"],     # any headers
)

app.include_router(attendance_router, prefix="/api/v1/attendance")
app.include_router(employee_router, prefix="/api/v1/employee")
app.include_router(testConnexion, prefix="/api/v1/zk_test")