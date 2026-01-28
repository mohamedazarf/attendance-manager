import sys
from pathlib import Path
from unittest.mock import MagicMock
from datetime import datetime

import pytest

# Add project root to Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.services.ingestion_service import IngestionService
from app.schemas.attendanceLog import AttendanceLog


class TestIngestionService:
    """Test cases for IngestionService"""

    def test_ingest_logs_success(self, sample_attendance_logs):
        """Test successfully ingesting attendance logs"""
        # Arrange
        mock_repo = MagicMock()
        service = IngestionService(mock_repo)

        # Create mock logs similar to ZK device logs
        mock_log_1 = MagicMock()
        mock_log_1.user_id = 1
        mock_log_1.timestamp = datetime(2024, 1, 15, 8, 30, 0)

        mock_log_2 = MagicMock()
        mock_log_2.user_id = 2
        mock_log_2.timestamp = datetime(2024, 1, 15, 8, 45, 0)

        logs = [mock_log_1, mock_log_2]

        # Act
        service.ingest_logs(logs)

        # Assert
        mock_repo.insert_many.assert_called_once()
        inserted_logs = mock_repo.insert_many.call_args[0][0]
        assert len(inserted_logs) == 2
        assert all(isinstance(log, AttendanceLog) for log in inserted_logs)
        assert inserted_logs[0].user_id == 1
        assert inserted_logs[1].user_id == 2

    def test_ingest_logs_empty(self):
        """Test ingesting empty logs list"""
        # Arrange
        mock_repo = MagicMock()
        service = IngestionService(mock_repo)
        logs = []

        # Act
        service.ingest_logs(logs)

        # Assert
        mock_repo.insert_many.assert_called_once_with([])

    def test_ingest_logs_single_log(self):
        """Test ingesting a single attendance log"""
        # Arrange
        mock_repo = MagicMock()
        service = IngestionService(mock_repo)

        mock_log = MagicMock()
        mock_log.user_id = 5
        mock_log.timestamp = datetime(2024, 1, 20, 10, 0, 0)

        # Act
        service.ingest_logs([mock_log])

        # Assert
        mock_repo.insert_many.assert_called_once()
        inserted_logs = mock_repo.insert_many.call_args[0][0]
        assert len(inserted_logs) == 1
        assert inserted_logs[0].user_id == 5
        assert inserted_logs[0].timestamp == datetime(2024, 1, 20, 10, 0, 0)

    def test_ingest_logs_multiple_times(self):
        """Test ingesting logs multiple times"""
        # Arrange
        mock_repo = MagicMock()
        service = IngestionService(mock_repo)

        mock_log_1 = MagicMock()
        mock_log_1.user_id = 1
        mock_log_1.timestamp = datetime(2024, 1, 15, 8, 30, 0)

        mock_log_2 = MagicMock()
        mock_log_2.user_id = 2
        mock_log_2.timestamp = datetime(2024, 1, 15, 9, 0, 0)

        # Act - Ingest logs twice
        service.ingest_logs([mock_log_1])
        service.ingest_logs([mock_log_2])

        # Assert
        assert mock_repo.insert_many.call_count == 2

    def test_ingest_logs_preserves_timestamp(self):
        """Test that ingest_logs preserves exact timestamp"""
        # Arrange
        mock_repo = MagicMock()
        service = IngestionService(mock_repo)

        test_timestamp = datetime(2024, 1, 15, 14, 30, 45, 123456)
        mock_log = MagicMock()
        mock_log.user_id = 1
        mock_log.timestamp = test_timestamp

        # Act
        service.ingest_logs([mock_log])

        # Assert
        inserted_logs = mock_repo.insert_many.call_args[0][0]
        assert inserted_logs[0].timestamp == test_timestamp
