from fastapi import APIRouter
from zk import ZK
from zk.exception import ZKNetworkError
from app.utils import get_db
from app.repositories.attendanceRepo import AttendanceRepository
from app.services.ingestion_service import IngestionService
from app.sdk.mock import ZKMock

router = APIRouter()

@router.get("/ingest-logs")
@router.post("/ingest-logs")
def ingest_logs():
    db = get_db()
    repo = AttendanceRepository(db)
    service = IngestionService(repo)

    try:
        zk = ZK('192.168.100.5', port=4370, timeout=5)
        conn = zk.connect()
        logs = conn.get_attendance()
        service.ingest_logs(logs)
        conn.disconnect()
        return {"status": "success", "inserted": len(logs)}
    except ZKNetworkError as e:
        return {"status": "error", "message": f"Cannot connect to ZK device: {str(e)}"}


@router.get("/ingest-logs-mock")
@router.post("/ingest-logs-mock")
def ingest_logs_mock():
    """
    Endpoint for testing with mocked attendance logs.
    Inserts mock logs into 'attendances_mock' collection.
    """
    db = get_db()
    mock_collection = db["attendances_mock"]
    
    # Get mock logs
    zk_mock = ZKMock('192.168.100.5', port=4370, timeout=5)
    conn = zk_mock.connect()
    logs = conn.get_attendance()
    conn.disconnect()
    
    # Insert into attendances_mock collection
    if logs:
        result = mock_collection.insert_many(logs)
        return {
            "status": "success",
            "inserted": len(result.inserted_ids),
            "collection": "attendances_mock"
        }
    else:
        return {"status": "error", "message": "No logs to insert"}

# from fastapi import APIRouter

# router = APIRouter()

# @router.get("/test")
# def test():
#     return {"message": "OK"}
