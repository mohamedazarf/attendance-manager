from fastapi import APIRouter
from zk import ZK
from app.utils import get_db
from app.repositories.attendanceRepo import AttendanceRepository
from app.services.ingestion_service import IngestionService

router = APIRouter()

@router.get("/ingest-logs")
@router.post("/ingest-logs")
def ingest_logs():
    db = get_db()
    repo = AttendanceRepository(db)
    service = IngestionService(repo)

    zk = ZK('192.168.100.5', port=4370, timeout=5)
    conn = zk.connect()
    logs = conn.get_attendance()

    service.ingest_logs(logs)

    conn.disconnect()
    return {"status": "success", "inserted": len(logs)}

# from fastapi import APIRouter

# router = APIRouter()

# @router.get("/test")
# def test():
#     return {"message": "OK"}
