from fastapi import APIRouter
from zk import ZK
from zk.exception import ZKNetworkError
from app.utils import get_db
from app.repositories.attendanceRepo import AttendanceRepository
from app.services.ingestion_service import IngestionService
from app.services.attendance_processing_service import AttendanceProcessingService
from app.sdk.mock import ZKMock
from typing import List

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


@router.get("/process-logs-mock")
@router.post("/process-logs-mock")
def process_logs_mock():
    """
    Process raw mock attendance logs and calculate working hours.
    Returns processed attendance records with anomaly detection.
    """
    db = get_db()
    mock_collection = db["attendances_mock"]
    
    # Fetch all mock logs
    raw_logs = list(mock_collection.find({}, {"_id": 0}))
    
    if not raw_logs:
        return {"status": "error", "message": "No mock logs found. Call /ingest-logs-mock first"}
    
    # Process logs
    service = AttendanceProcessingService()
    processed = service.process_logs(raw_logs)
    
    # Convert to dict for JSON response
    results = []
    for (user_id, date), attendance in processed.items():
        results.append({
            "user_id": attendance.user_id,
            "date": str(attendance.date),
            "check_in_time": attendance.check_in_time.isoformat() if attendance.check_in_time else None,
            "check_out_time": attendance.check_out_time.isoformat() if attendance.check_out_time else None,
            "total_hours_worked": round(attendance.total_hours_worked, 2),
            "expected_hours": round(attendance.expected_hours, 2),
            "has_anomaly": attendance.has_anomaly,
            "anomalies": attendance.anomalies,
            "is_late": attendance.is_late,
            "late_minutes": attendance.late_minutes,
            "is_complete_day": attendance.is_complete_day,
            "status": attendance.status,
            "events": [
                {
                    "timestamp": event.timestamp.isoformat(),
                    "event_type": event.event_type,
                    "event_order": event.event_order
                }
                for event in attendance.events
            ]
        })
    
    return {
        "status": "success",
        "total_records": len(results),
        "data": results
    }


@router.get("/daily-summary-mock")
@router.post("/daily-summary-mock")
def daily_summary_mock():
    """
    Get daily attendance summaries with employee information.
    Includes anomaly detection and hours calculation.
    """
    db = get_db()
    logs_collection = db["attendances_mock"]
    employees_collection = db["employees_mock"]
    
    # Fetch logs and employees
    raw_logs = list(logs_collection.find({}, {"_id": 0}))
    employees = {emp["user_id"]: emp for emp in employees_collection.find({}, {"_id": 0})}
    
    if not raw_logs:
        return {"status": "error", "message": "No mock logs found. Call /ingest-logs-mock first"}
    
    # Process logs
    service = AttendanceProcessingService()
    processed = service.process_logs(raw_logs)
    
    # Generate summaries with employee info
    summaries = []
    for (user_id, date), attendance in processed.items():
        employee_info = employees.get(user_id, {})
        summary = service.generate_summary(attendance, employee_info)
        
        summaries.append({
            "user_id": summary.user_id,
            "employee_code": summary.employee_code,
            "employee_name": summary.employee_name,
            "date": str(summary.date),
            "first_event": summary.first_event.isoformat() if summary.first_event else None,
            "last_event": summary.last_event.isoformat() if summary.last_event else None,
            "total_hours_worked": round(summary.total_hours_worked, 2),
            "expected_hours": round(summary.expected_hours, 2),
            "hours_difference": round(summary.hours_difference, 2),
            "status": summary.status,
            "anomalies": summary.anomalies
        })
    
    return {
        "status": "success",
        "total_records": len(summaries),
        "data": summaries
    }


@router.get("/anomalies-mock")
@router.post("/anomalies-mock")
def anomalies_mock():
    """
    Get only attendance records with anomalies.
    Useful for monitoring and investigation.
    """
    db = get_db()
    logs_collection = db["attendances_mock"]
    employees_collection = db["employees_mock"]
    
    # Fetch logs and employees
    raw_logs = list(logs_collection.find({}, {"_id": 0}))
    employees = {emp["user_id"]: emp for emp in employees_collection.find({}, {"_id": 0})}
    
    if not raw_logs:
        return {"status": "error", "message": "No mock logs found. Call /ingest-logs-mock first"}
    
    # Process logs
    service = AttendanceProcessingService()
    processed = service.process_logs(raw_logs)
    
    # Filter only anomalies
    anomalies = []
    for (user_id, date), attendance in processed.items():
        if attendance.has_anomaly:
            employee_info = employees.get(user_id, {})
            summary = service.generate_summary(attendance, employee_info)
            
            anomalies.append({
                "user_id": summary.user_id,
                "employee_code": summary.employee_code,
                "employee_name": summary.employee_name,
                "date": str(summary.date),
                "anomalies": summary.anomalies,
                "total_hours_worked": round(summary.total_hours_worked, 2),
                "expected_hours": round(summary.expected_hours, 2),
                "hours_difference": round(summary.hours_difference, 2),
                "status": summary.status
            })
    
    return {
        "status": "success",
        "total_anomalies": len(anomalies),
        "data": anomalies
    }


@router.get("/report-mock")
@router.post("/report-mock")
def report_mock():
    """
    Get a comprehensive attendance report.
    Summary by employee with daily breakdown.
    """
    db = get_db()
    logs_collection = db["attendances_mock"]
    employees_collection = db["employees_mock"]
    
    # Fetch logs and employees
    raw_logs = list(logs_collection.find({}, {"_id": 0}))
    employees = {emp["user_id"]: emp for emp in employees_collection.find({}, {"_id": 0})}
    
    if not raw_logs:
        return {"status": "error", "message": "No mock logs found. Call /ingest-logs-mock first"}
    
    # Process logs
    service = AttendanceProcessingService()
    processed = service.process_logs(raw_logs)
    
    # Group by user
    by_employee = {}
    for (user_id, date), attendance in processed.items():
        if user_id not in by_employee:
            employee_info = employees.get(user_id, {})
            by_employee[user_id] = {
                "user_id": user_id,
                "employee_code": employee_info.get("employee_code"),
                "employee_name": employee_info.get("name"),
                "daily_records": [],
                "total_hours": 0.0,
                "expected_hours": 0.0,
                "anomaly_count": 0
            }
        
        summary = service.generate_summary(attendance, employees.get(user_id, {}))
        by_employee[user_id]["daily_records"].append({
            "date": str(summary.date),
            "hours_worked": round(summary.total_hours_worked, 2),
            "expected_hours": round(summary.expected_hours, 2),
            "status": summary.status,
            "anomalies": summary.anomalies
        })
        by_employee[user_id]["total_hours"] += summary.total_hours_worked
        by_employee[user_id]["expected_hours"] += summary.expected_hours
        if summary.status == "anomaly":
            by_employee[user_id]["anomaly_count"] += 1
    
    return {
        "status": "success",
        "total_employees": len(by_employee),
        "data": list(by_employee.values())
    }

# from fastapi import APIRouter

# router = APIRouter()

# @router.get("/test")
# def test():
#     return {"message": "OK"}
