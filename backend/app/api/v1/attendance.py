from fastapi import APIRouter, Query, HTTPException, Body
from zk import ZK
from zk.exception import ZKNetworkError
from app.utils import get_db
from app.repositories.attendanceRepo import AttendanceRepository
from app.services.ingestion_service import IngestionService
from app.services.attendance_processing_service import AttendanceProcessingService
from app.services.attendance_metrics_service import AttendanceMetricsService
from app.sdk.mock import ZKMock
from typing import List, Optional, Dict
from datetime import datetime, date, time
from app import utils
from pydantic import BaseModel
from app.services.day_rules_service import DayRulesService
from app.config.attendance_config import AttendanceConfig
from app.schemas.attendance import (
    IncludeSundayPayload, 
    SpecialDayPayload, 
    RamadanDepartmentHours, 
    NormalDepartmentHours, 
    RamadanConfigPayload, 
    NormalConfigPayload
)

router = APIRouter()

@router.get("/ingest-logs")
@router.post("/ingest-logs")
def ingest_logs():
    db = get_db()
    repo = AttendanceRepository(db)
    service = IngestionService(repo)

    try:
        zk = ZK(AttendanceConfig.DEVICE_IP, port=AttendanceConfig.DEVICE_PORT, timeout=5)
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
    zk_mock = ZKMock(AttendanceConfig.DEVICE_IP, port=AttendanceConfig.DEVICE_PORT, timeout=5)
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
            "anomalies": summary.anomalies,
          
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


# ==================== METRICS ENDPOINTS ====================

@router.get("/metrics/employee/{employee_id}")
def get_employee_metrics(employee_id: int, year: int, month: int):
    """
    Get attendance metrics for a specific employee in a given month.
    
    Parameters:
    - employee_id: Employee ID
    - year: Year (e.g., 2024)
    - month: Month (1-12)
    
    Returns:
    - presence_rate: Percentage of days present
    - absence_rate: Percentage of days absent
    - total_working_days: Number of working days in month
    - days_present: Number of days employee attended
    - days_absent: Number of days employee was absent
    """
    try:
        service = AttendanceMetricsService()
        metrics = service.get_employee_attendance_status(employee_id, year, month)
        return {"status": "success", "data": metrics}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/metrics/all-employees")
def get_all_employees_metrics(year: int, month: int):
    """
    Get attendance metrics for all employees in a given month.
    
    Parameters:
    - year: Year (e.g., 2024)
    - month: Month (1-12)
    
    Returns:
    - List of all employees with their metrics (presence_rate, absence_rate, etc.)
    """
    try:
        service = AttendanceMetricsService()
        metrics_list = service.get_all_employees_metrics(year, month)
        return {
            "status": "success",
            "total_employees": len(metrics_list),
            "year": year,
            "month": month,
            "data": metrics_list
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/metrics/employee/{employee_id}/range")
def get_employee_metrics_range(
    employee_id: int,
    start_date: str,
    end_date: str
):
    """
    Get attendance metrics for a specific employee over a custom date range.
    
    Parameters:
    - employee_id: Employee ID
    - start_date: Start date (format: YYYY-MM-DD)
    - end_date: End date (format: YYYY-MM-DD)
    
    Returns:
    - Metrics for the specified date range
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        service = AttendanceMetricsService()
        metrics = service.get_employee_metrics_date_range(employee_id, start, end)
        return {"status": "success", "data": metrics}
    except ValueError as e:
        return {"status": "error", "message": "Invalid date format. Use YYYY-MM-DD"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/metrics/employee/{employee_id}/weekend")
def get_employee_weekend_metrics(employee_id: int, year: int, month: int):
    """
    Get weekend work metrics for a specific employee in a given month.
    
    Parameters:
    - employee_id: Employee ID
    - year: Year (e.g., 2024)
    - month: Month (1-12)
    
    Returns:
    - weekend_days_worked: Number of weekend days with work
    - weekend_hours_worked: Total hours worked on weekends
    """
    try:
        service = AttendanceMetricsService()
        metrics = service.get_employee_attendance_status(employee_id, year, month)
        
        # Extract only weekend-related data
        weekend_data = {
            "employee_id": employee_id,
            "year": year,
            "month": month,
            "period": metrics.get("period"),
            "weekend_days_worked": metrics.get("weekend_days_worked", 0),
            "weekend_hours_worked": metrics.get("weekend_hours_worked", 0.0),
            "total_attendance_count": metrics.get("attendance_count", 0)
        }
        
        return {"status": "success", "data": weekend_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/report-mock-weekend")
@router.post("/report-mock-weekend")
def report_mock_weekend():
    """
    Get a comprehensive attendance report with weekend hours.
    Summary by employee with daily breakdown.
    """
    db = get_db()
    logs_collection = db["attendances_mock"]
    employees_collection = db["employees_mock"]
    
    raw_logs = list(logs_collection.find({}, {"_id": 0}))
    employees = {emp["user_id"]: emp for emp in employees_collection.find({}, {"_id": 0})}
    
    if not raw_logs:
        return {"status": "error", "message": "No mock logs found. Call /ingest-logs-mock first"}
    
    service = AttendanceProcessingService()
    processed = service.process_logs(raw_logs)
    
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
                "weekend_hours": 0.0,  # nouveau KPI
                "weekend_days": 0,     # nouveau KPI
                "anomaly_count": 0
            }

        summary = service.generate_summary(attendance, employees.get(user_id, {}))
        
        # Calcul weekend pour ce jour
        weekend_hours = 0
        if summary.date.weekday() in [5, 6]:  # samedi=5, dimanche=6
            weekend_hours = summary.total_hours_worked
        
        by_employee[user_id]["daily_records"].append({
            "date": str(summary.date),
            "hours_worked": round(summary.total_hours_worked, 2),
            "expected_hours": round(summary.expected_hours, 2),
            "status": summary.status,
            "anomalies": summary.anomalies,
            "weekend_hours": round(weekend_hours, 2)
        })
        
        # Cumuler les totaux
        by_employee[user_id]["total_hours"] += summary.total_hours_worked
        by_employee[user_id]["expected_hours"] += summary.expected_hours
        by_employee[user_id]["weekend_hours"] += weekend_hours
        if weekend_hours > 0:
            by_employee[user_id]["weekend_days"] += 1
        if summary.status == "anomaly":
            by_employee[user_id]["anomaly_count"] += 1

    return {
        "status": "success",
        "total_employees": len(by_employee),
        "data": list(by_employee.values())
    }





@router.get("/read-logs")
def read_logs_from_zk():
    """Read attendance logs directly from ZK device and return them"""
    try:
        # Connect to ZK device
        zk = ZK(AttendanceConfig.DEVICE_IP, port=AttendanceConfig.DEVICE_PORT, timeout=5)
        conn = zk.connect()
        
        # Get logs from device
        logs = conn.get_attendance()
        
        # Format the logs for display
        formatted_logs = []
        for log in logs:
            # Format each log entry
            formatted_log = {
                "user_id": log.user_id,
                "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else None,
                "status": log.status,
                "punch": log.punch,
                "uid": log.uid,
                "device_id": "ZK001"
            }
            formatted_logs.append(formatted_log)
        
        conn.disconnect()
        
        return {
            "status": "success",
            "source": f"zk_device_{AttendanceConfig.DEVICE_IP}",
            "logs": formatted_logs,
            "count": len(logs),
            "read_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
    except ZKNetworkError as e:
        return {"status": "error", "message": f"Cannot connect to ZK device: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"Error reading logs: {str(e)}"}





from app.services.DailyAttendanceDashboardService import DailyAttendanceDashboardService
@router.get("/dashboard/today")
def dashboard_today():
    """
    Dashboard global + per-employee data for today
    """
    service = DailyAttendanceDashboardService()
    return service.get_today_data()




@router.get("/dashboard/day")
def dashboard_day(
    day: date = Query(None, description="YYYY-MM-DD (optional)")
):
    service = DailyAttendanceDashboardService()
    return service.get_today_data(day)


@router.get("/dashboard/day-rules")
def get_day_rules():
    service = DayRulesService()
    return service.get_config()


@router.put("/dashboard/day-rules")
def update_day_rules(payload: IncludeSundayPayload):
    service = DayRulesService()
    return service.set_include_sunday(payload.include_sunday)


@router.get("/dashboard/special-days")
def get_special_days(
    start_date: date = Query(None, description="YYYY-MM-DD"),
    end_date: date = Query(None, description="YYYY-MM-DD"),
):
    service = DayRulesService()
    return {
        "special_days": service.list_special_days(start_date=start_date, end_date=end_date)
    }


@router.post("/dashboard/special-days")
def upsert_special_day(payload: SpecialDayPayload):
    if payload.type not in ["holiday", "remote_day"]:
        raise HTTPException(
            status_code=400,
            detail="type must be 'holiday' or 'remote_day'",
        )

    service = DayRulesService()
    day = service.upsert_special_day(
        day=payload.date,
        day_type=payload.type,
        label=payload.label,
    )
    return {"status": "success", "special_day": day}


@router.delete("/dashboard/special-days/{day}")
def delete_special_day(day: date):
    service = DayRulesService()
    result = service.delete_special_day(day)
    return {"status": "success", **result}


@router.get("/dashboard/ramadan-config")
def get_ramadan_config():
    service = DayRulesService()
    return service.get_ramadan_config()


@router.get("/dashboard/normal-config")
def get_normal_config():
    service = DayRulesService()
    return service.get_normal_config()


@router.get("/dashboard/departments")
def get_departments():
    service = DayRulesService()
    return {"departments": service.list_departments()}


@router.post("/dashboard/departments")
def upsert_department(payload: dict = Body(default={})):
    service = DayRulesService()
    name = str(payload.get("name", "")).strip().lower()
    start_raw = str(payload.get("start_time", "")).strip()
    end_raw = str(payload.get("end_time", "")).strip()

    if not name or not start_raw or not end_raw:
        raise HTTPException(
            status_code=400,
            detail="name, start_time et end_time sont obligatoires",
        )

    try:
        start_time = datetime.strptime(start_raw, "%H:%M").strftime("%H:%M")
        end_time = datetime.strptime(end_raw, "%H:%M").strftime("%H:%M")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="start_time et end_time doivent etre au format HH:MM",
        )

    try:
        return service.upsert_department_hours(
            department=name,
            start_time=start_time,
            end_time=end_time,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/dashboard/departments/{department}")
def delete_department(
    department: str,
    employee_strategy: str = Query(
        "reassign_default",
        description="delete | reassign_default",
    ),
):
    service = DayRulesService()
    try:
        return service.delete_department(
            department=department,
            employee_strategy=employee_strategy,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.put("/dashboard/ramadan-config")
def update_ramadan_config(payload: RamadanConfigPayload):
    service = DayRulesService()

    # Normalize department keys to lowercase for consistency
    departments_payload = {}
    for key, value in (payload.departments or {}).items():
        departments_payload[key.lower()] = {
            "start_time": value.start_time.strftime("%H:%M"),
            "end_time": value.end_time.strftime("%H:%M"),
        }

    config = service.update_ramadan_config(
        start_date=payload.start_date,
        end_date=payload.end_date,
        departments=departments_payload,
    )
    return config


@router.put("/dashboard/normal-config")
def update_normal_config(payload: NormalConfigPayload):
    service = DayRulesService()

    departments_payload = {}
    for key, value in (payload.departments or {}).items():
        departments_payload[key.lower()] = {
            "start_time": value.start_time.strftime("%H:%M"),
            "end_time": value.end_time.strftime("%H:%M"),
            "pause_minutes": max(0, int(value.pause_minutes or 0)),
        }

    config = service.update_normal_config(
        start_date=payload.start_date,
        end_date=payload.end_date,
        departments=departments_payload,
    )
    return config
