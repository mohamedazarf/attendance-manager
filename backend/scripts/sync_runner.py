from app.services.SyncService import SyncService

if __name__ == "__main__":
    service = SyncService()
    
    # Sync employees only
    emp_result = service.sync_employees()
    print(f"✅ Employees synced: {emp_result['employees_synced']}")
    print(f"⚠️ Employees marked inactive: {emp_result['inactive_employees_marked']}")
    
    # Sync attendances only
    att_result = service.sync_attendances()
    print(f"Attendance logs synced: {att_result['attendance_logs_synced']}")
    
    # Sync both
    all_result = service.sync_all()
    print(f"All data synced: {all_result['details']}")
