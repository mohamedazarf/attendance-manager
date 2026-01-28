import sys
from pathlib import Path
from unittest.mock import MagicMock, patch
from datetime import datetime

import pytest
from mongomock import MongoClient

# Add project root to Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.schemas.employee import Employee
from app.schemas.attendanceLog import AttendanceLog


@pytest.fixture
def mock_mongodb():
    """Create an in-memory MongoDB mock for testing"""
    client = MongoClient()
    db = client["gestionDePointage"]
    yield db
    # Cleanup
    client.drop_database("gestionDePointage")


@pytest.fixture
def mock_zk_connection():
    """Create a mock ZK device connection"""
    mock_zk = MagicMock()
    mock_user_1 = MagicMock()
    mock_user_1.user_id = "001"
    mock_user_1.name = "John Doe"
    mock_user_1.privilege = 0
    mock_user_1.group_id = "G1"
    mock_user_1.card = 12345

    mock_user_2 = MagicMock()
    mock_user_2.user_id = "002"
    mock_user_2.name = "Jane Smith"
    mock_user_2.privilege = 0
    mock_user_2.group_id = "G1"
    mock_user_2.card = 12346

    mock_zk.get_users.return_value = [mock_user_1, mock_user_2]

    # Mock attendance logs
    mock_log_1 = MagicMock()
    mock_log_1.user_id = 1
    mock_log_1.timestamp = datetime(2024, 1, 15, 8, 30, 0)

    mock_log_2 = MagicMock()
    mock_log_2.user_id = 2
    mock_log_2.timestamp = datetime(2024, 1, 15, 8, 45, 0)

    mock_zk.get_attendance.return_value = [mock_log_1, mock_log_2]

    return mock_zk


@pytest.fixture
def sample_employees():
    """Create sample employee objects"""
    return [
        Employee(
            employee_code="001",
            name="John Doe",
            privilege=0,
            group_id="G1",
            card=12345
        ),
        Employee(
            employee_code="002",
            name="Jane Smith",
            privilege=0,
            group_id="G1",
            card=12346
        ),
    ]


@pytest.fixture
def sample_attendance_logs():
    """Create sample attendance log objects"""
    return [
        AttendanceLog(
            user_id=1,
            timestamp=datetime(2024, 1, 15, 8, 30, 0)
        ),
        AttendanceLog(
            user_id=2,
            timestamp=datetime(2024, 1, 15, 8, 45, 0)
        ),
    ]
