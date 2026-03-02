from datetime import datetime, time, date
from app.config.attendance_config import AttendanceConfig
from app.services.attendance_processing_service import AttendanceProcessingService
from app.schemas.attendance import ProcessedAttendance

def test_department_logic():
    config = AttendanceConfig()
    processor = AttendanceProcessingService(config)
    
    test_date = date(2024, 3, 2)
    
    # Logs for an employee starting at 7:45 AM (late for Employee 7:30, on time for Admin 8:30)
    # Ends at 4:45 PM (on time for Employee 4:30, early for Admin 5:30)
    raw_logs = [
        {"user_id": 1, "timestamp": datetime.combine(test_date, time(7, 45))},
        {"user_id": 1, "timestamp": datetime.combine(test_date, time(16, 45))}
    ]
    
    print("Testing Employee Department (Target: 07:30 - 16:30)")
    processed_employee = processor._process_daily_logs(1, test_date, raw_logs, department="employee")
    print(f"Worked Hours: {processed_employee.total_hours_worked}")
    print(f"Is Late: {processed_employee.is_late} (Expected: True)")
    print(f"Expected Hours: {processed_employee.expected_hours}")
    print(f"Anomalies: {processed_employee.anomalies}")
    
    print("\nTesting Administration Department (Target: 08:30 - 17:30)")
    processed_admin = processor._process_daily_logs(1, test_date, raw_logs, department="administration")
    print(f"Worked Hours: {processed_admin.total_hours_worked}")
    print(f"Is Late: {processed_admin.is_late} (Expected: False)")
    print(f"Expected Hours: {processed_admin.expected_hours}")
    print(f"Anomalies: {processed_admin.anomalies}")
    
    # Assertions
    assert processed_employee.is_late == True, "Employee should be late"
    assert processed_admin.is_late == False, "Admin should not be late"
    assert "EARLY_DEPARTURE" in processed_admin.anomalies, "Admin should have early departure anomaly"
    assert "EARLY_DEPARTURE" not in processed_employee.anomalies, "Employee should NOT have early departure anomaly"
    
    print("\nSUCCESS: Department logic verified!")

if __name__ == "__main__":
    test_department_logic()
