from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.attendance import router as attendance_router
from app.api.v1.employee import router as employee_router
from app.api.v1.zk_test import router as testConnexion
from app.api.v1.fingerprint import router as fingerprint_router
from app.api.v1.users import router as users_router
from app.api.v1.attendance_manual import router as attendance_manual_router
from app.api.v1.device import router as device_router
from app.api.v1.auth import router as auth_router
from app.api.v1.roles import router as roles_router
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

# Health check endpoint for desktop app
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

# Desktop app endpoints (no /v1/ prefix for compatibility)
app.include_router(fingerprint_router, prefix="/api/fingerprint")
app.include_router(users_router, prefix="/api/users")
app.include_router(attendance_manual_router, prefix="/api/attendance")
app.include_router(device_router, prefix="/api/device")

# Web app endpoints (with /v1/ prefix)
app.include_router(attendance_router, prefix="/api/v1/attendance")
app.include_router(employee_router, prefix="/api/v1/employee")
app.include_router(testConnexion, prefix="/api/v1/zk_test")
app.include_router(device_router, prefix="/api/v1/device")
app.include_router(attendance_manual_router, prefix="/api/v1/attendance")
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(roles_router, prefix="/api/v1/roles")

