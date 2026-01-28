import sys
from pathlib import Path
from unittest.mock import patch, MagicMock
from datetime import datetime

import pytest
from mongomock import MongoClient

# Add project root to Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.repositories.attendanceRepo import AttendanceRepository
from app.schemas.attendanceLog import AttendanceLog


class TestAttendanceRepository:
    """Test cases for AttendanceRepository"""

    @pytest.fixture
    def mock_db(self):
        """Create an in-memory MongoDB instance for testing"""
        client = MongoClient()
        db = client["gestionDePointage_test"]
        yield db
        # Cleanup
        client.drop_database("gestionDePointage_test")

    def test_insert_log_success(self, mock_db):
        """Test successfully inserting a single attendance log"""
        # Arrange
        with patch('app.repositories.attendanceRepo.utils.get_db', return_value=mock_db):
            repo = AttendanceRepository(MagicMock())
            log = AttendanceLog(
                user_id=1,
                timestamp=datetime(2024, 1, 15, 8, 30, 0)
            )

            # Act
            repo.insert_log(log)

            # Assert
            result = mock_db["attendance_logs"].find_one({"user_id": 1})
            assert result is not None
            assert result["user_id"] == 1
            assert result["timestamp"] == datetime(2024, 1, 15, 8, 30, 0)

    def test_insert_log_multiple_different_users(self, mock_db):
        """Test inserting logs for different users"""
        # Arrange
        with patch('app.repositories.attendanceRepo.utils.get_db', return_value=mock_db):
            repo = AttendanceRepository(MagicMock())
            log1 = AttendanceLog(
                user_id=1,
                timestamp=datetime(2024, 1, 15, 8, 30, 0)
            )
            log2 = AttendanceLog(
                user_id=2,
                timestamp=datetime(2024, 1, 15, 8, 45, 0)
            )

            # Act
            repo.insert_log(log1)
            repo.insert_log(log2)

            # Assert
            count = mock_db["attendance_logs"].count_documents({})
            assert count == 2

    def test_insert_many_logs(self, mock_db):
        """Test inserting multiple attendance logs"""
        # Arrange
        with patch('app.repositories.attendanceRepo.utils.get_db', return_value=mock_db):
            repo = AttendanceRepository(MagicMock())
            logs = [
                AttendanceLog(
                    user_id=1,
                    timestamp=datetime(2024, 1, 15, 8, 30, 0)
                ),
                AttendanceLog(
                    user_id=2,
                    timestamp=datetime(2024, 1, 15, 8, 45, 0)
                ),
                AttendanceLog(
                    user_id=3,
                    timestamp=datetime(2024, 1, 15, 9, 0, 0)
                ),
            ]

            # Act
            repo.insert_many(logs)

            # Assert
            count = mock_db["attendance_logs"].count_documents({})
            assert count == 3

    def test_insert_many_same_user_different_times(self, mock_db):
        """Test inserting multiple logs for same user at different times"""
        # Arrange
        with patch('app.repositories.attendanceRepo.utils.get_db', return_value=mock_db):
            repo = AttendanceRepository(MagicMock())
            logs = [
                AttendanceLog(
                    user_id=1,
                    timestamp=datetime(2024, 1, 15, 8, 30, 0)
                ),
                AttendanceLog(
                    user_id=1,
                    timestamp=datetime(2024, 1, 15, 17, 0, 0)
                ),
                AttendanceLog(
                    user_id=1,
                    timestamp=datetime(2024, 1, 16, 8, 45, 0)
                ),
            ]

            # Act
            repo.insert_many(logs)

            # Assert
            count = mock_db["attendance_logs"].count_documents({})
            assert count == 3
            user_logs = list(mock_db["attendance_logs"].find({"user_id": 1}))
            assert len(user_logs) == 3

    def test_get_all_logs(self, mock_db):
        """Test retrieving all attendance logs"""
        # Arrange
        with patch('app.repositories.attendanceRepo.utils.get_db', return_value=mock_db):
            repo = AttendanceRepository(MagicMock())
            logs = [
                AttendanceLog(
                    user_id=1,
                    timestamp=datetime(2024, 1, 15, 8, 30, 0)
                ),
                AttendanceLog(
                    user_id=2,
                    timestamp=datetime(2024, 1, 15, 8, 45, 0)
                ),
            ]
            repo.insert_many(logs)

            # Act
            result = repo.get_all_logs()

            # Assert
            assert len(result) == 2
            assert result[0]["user_id"] == 1
            assert result[1]["user_id"] == 2

    def test_get_all_logs_empty(self, mock_db):
        """Test retrieving all logs from empty collection"""
        # Arrange
        with patch('app.repositories.attendanceRepo.utils.get_db', return_value=mock_db):
            repo = AttendanceRepository(MagicMock())

            # Act
            result = repo.get_all_logs()

            # Assert
            assert result == []
            assert isinstance(result, list)

    def test_insert_log_timestamp_precision(self, mock_db):
        """Test that timestamp is stored (MongoDB stores with millisecond precision)"""
        # Arrange
        with patch('app.repositories.attendanceRepo.utils.get_db', return_value=mock_db):
            repo = AttendanceRepository(MagicMock())
            precise_timestamp = datetime(2024, 1, 15, 14, 30, 45, 123000)  # Millisecond precision
            log = AttendanceLog(
                user_id=1,
                timestamp=precise_timestamp
            )

            # Act
            repo.insert_log(log)

            # Assert
            result = mock_db["attendance_logs"].find_one({"user_id": 1})
            assert result["timestamp"] == precise_timestamp

    def test_get_all_logs_maintains_order(self, mock_db):
        """Test that get_all_logs returns logs in insertion order"""
        # Arrange
        with patch('app.repositories.attendanceRepo.utils.get_db', return_value=mock_db):
            repo = AttendanceRepository(MagicMock())
            logs = [
                AttendanceLog(user_id=1, timestamp=datetime(2024, 1, 15, 8, 30, 0)),
                AttendanceLog(user_id=2, timestamp=datetime(2024, 1, 15, 8, 45, 0)),
                AttendanceLog(user_id=3, timestamp=datetime(2024, 1, 15, 9, 0, 0)),
            ]
            repo.insert_many(logs)

            # Act
            result = repo.get_all_logs()

            # Assert
            user_ids = [log["user_id"] for log in result]
            assert user_ids == [1, 2, 3]

    def test_insert_many_large_batch(self, mock_db):
        """Test inserting a large batch of logs"""
        # Arrange
        with patch('app.repositories.attendanceRepo.utils.get_db', return_value=mock_db):
            repo = AttendanceRepository(MagicMock())
            logs = [
                AttendanceLog(
                    user_id=i,
                    timestamp=datetime(2024, 1, 15, 8, 0, 0)
                )
                for i in range(100)
            ]

            # Act
            repo.insert_many(logs)

            # Assert
            count = mock_db["attendance_logs"].count_documents({})
            assert count == 100

    def test_insert_many_mixed_user_timestamps(self, mock_db):
        """Test inserting logs with mixed users and timestamps"""
        # Arrange
        with patch('app.repositories.attendanceRepo.utils.get_db', return_value=mock_db):
            repo = AttendanceRepository(MagicMock())
            logs = [
                AttendanceLog(user_id=1, timestamp=datetime(2024, 1, 15, 8, 30, 0)),
                AttendanceLog(user_id=2, timestamp=datetime(2024, 1, 15, 8, 45, 0)),
                AttendanceLog(user_id=1, timestamp=datetime(2024, 1, 15, 17, 0, 0)),
                AttendanceLog(user_id=3, timestamp=datetime(2024, 1, 15, 9, 0, 0)),
                AttendanceLog(user_id=2, timestamp=datetime(2024, 1, 15, 17, 15, 0)),
            ]

            # Act
            repo.insert_many(logs)

            # Assert
            user_1_logs = list(mock_db["attendance_logs"].find({"user_id": 1}))
            user_2_logs = list(mock_db["attendance_logs"].find({"user_id": 2}))
            user_3_logs = list(mock_db["attendance_logs"].find({"user_id": 3}))

            assert len(user_1_logs) == 2
            assert len(user_2_logs) == 2
            assert len(user_3_logs) == 1
