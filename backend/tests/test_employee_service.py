import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add project root to Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.services.employee_service import EmployeeService
from app.schemas.employee import Employee


class TestEmployeeService:
    """Test cases for EmployeeService"""

    def test_fetch_from_zk_success(self, sample_employees):
        """Test successfully fetching employees from ZK device"""
        # Arrange
        mock_repo = MagicMock()
        service = EmployeeService(mock_repo)

        mock_zk_instance = MagicMock()
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

        mock_zk_instance.get_users.return_value = [mock_user_1, mock_user_2]
        mock_conn = MagicMock()
        mock_conn.get_users.return_value = [mock_user_1, mock_user_2]

        # Act
        with patch('app.services.employee_service.ZK') as mock_zk_class:
            mock_zk_class.return_value = mock_zk_instance
            mock_zk_instance.connect.return_value = mock_conn

            employees = service.fetch_from_zk()

        # Assert
        assert len(employees) == 2
        assert employees[0].employee_code == "001"
        assert employees[0].name == "John Doe"
        assert employees[1].employee_code == "002"
        assert employees[1].name == "Jane Smith"
        mock_conn.disconnect.assert_called_once()

    def test_sync_employees_when_empty(self, sample_employees):
        """Test sync_employees inserts employees when collection is empty"""
        # Arrange
        mock_repo = MagicMock()
        mock_repo.count.return_value = 0  # Empty collection
        service = EmployeeService(mock_repo)

        mock_zk_instance = MagicMock()
        mock_user_1 = MagicMock()
        mock_user_1.user_id = "001"
        mock_user_1.name = "John Doe"
        mock_user_1.privilege = 0
        mock_user_1.group_id = "G1"
        mock_user_1.card = 12345

        mock_conn = MagicMock()
        mock_conn.get_users.return_value = [mock_user_1]

        # Act
        with patch('app.services.employee_service.ZK') as mock_zk_class:
            mock_zk_class.return_value = mock_zk_instance
            mock_zk_instance.connect.return_value = mock_conn

            service.sync_employees()

        # Assert
        mock_repo.count.assert_called_once()
        mock_repo.insert_many.assert_called_once()
        call_args = mock_repo.insert_many.call_args[0][0]
        assert len(call_args) == 1
        assert call_args[0].employee_code == "001"

    def test_sync_employees_when_not_empty(self):
        """Test sync_employees skips insert when collection has data"""
        # Arrange
        mock_repo = MagicMock()
        mock_repo.count.return_value = 5  # Non-empty collection
        service = EmployeeService(mock_repo)

        # Act
        with patch('app.services.employee_service.ZK') as mock_zk_class:
            service.sync_employees()

        # Assert
        mock_repo.count.assert_called_once()
        mock_repo.insert_many.assert_not_called()
        mock_zk_class.assert_not_called()

    def test_get_all(self, sample_employees):
        """Test get_all retrieves all employees from repository"""
        # Arrange
        mock_repo = MagicMock()
        mock_repo.get_all_employees.return_value = sample_employees
        service = EmployeeService(mock_repo)

        # Act
        result = service.get_all()

        # Assert
        assert len(result) == 2
        assert result == sample_employees
        mock_repo.get_all_employees.assert_called_once()

    def test_fetch_from_zk_connection_error(self):
        """Test fetch_from_zk handles connection errors gracefully"""
        # Arrange
        mock_repo = MagicMock()
        service = EmployeeService(mock_repo)

        # Act & Assert
        with patch('app.services.employee_service.ZK') as mock_zk_class:
            mock_zk_class.side_effect = Exception("Connection failed")

            with pytest.raises(Exception, match="Connection failed"):
                service.fetch_from_zk()
