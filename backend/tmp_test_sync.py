import sys
import os
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock

# Path setup to import app modules
sys.path.append(r"c:\Users\MohamedAzizArfaoui\OneDrive - dynamix-services.com\Bureau\zkteco_project\attendanceManagement\backend")

from app.services.SyncService import SyncService
from app.schemas.attendanceLog import AttendanceLog

def test_sync_logic():
    print("Starting sync logic test...")
    
    # Mocking dependencies
    service = SyncService()
    service.attendance_repo = MagicMock()
    service.zk_service = MagicMock()
    
    # Scenario: Last log in DB was 2 days ago
    last_log_time = datetime.now(timezone.utc) - timedelta(days=2)
    service.attendance_repo.get_latest_timestamp.return_value = last_log_time
    
    print(f"Mocked Latest DB Timestamp: {last_log_time}")
    
    # Mocked device logs: 1 from 3 days ago (old), 1 from 1 day ago (new), 1 from today (new)
    mock_att_old = MagicMock()
    mock_att_old.user_id = "1"
    mock_att_old.timestamp = (datetime.now() - timedelta(days=3)).replace(microsecond=0)
    
    mock_att_past = MagicMock()
    mock_att_past.user_id = "1"
    mock_att_past.timestamp = (datetime.now() - timedelta(days=1)).replace(microsecond=0)
    
    mock_att_today = MagicMock()
    mock_att_today.user_id = "2"
    mock_att_today.timestamp = datetime.now().replace(microsecond=0)
    
    service.zk_service.get_attendances.return_value = [mock_att_old, mock_att_past, mock_att_today]
    
    result = service.sync_attendances()
    
    print(f"Sync Result: {result}")
    
    # Check if insert_many was called with the correct logs (should be 2: mock_att_past and mock_att_today)
    if service.attendance_repo.insert_many.called:
        inserted_logs = service.attendance_repo.insert_many.call_args[0][0]
        print(f"Inserted {len(inserted_logs)} logs.")
        for log in inserted_logs:
            print(f" - Log: User {log.user_id} at {log.timestamp}")
        
        if len(inserted_logs) == 2:
            print("SUCCESS: Incremental sync correctly identified 2 new logs.")
        else:
            print(f"FAILURE: Expected 2 logs, but found {len(inserted_logs)}.")
    else:
        print("FAILURE: insert_many was not called.")

if __name__ == "__main__":
    try:
        test_sync_logic()
    except Exception as e:
        print(f"Error during test: {e}")
