import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from mongomock import MongoClient

# Add project root to Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.repositories.employeeRepo import EmployeeRepository
from app.schemas.employee import Employee


class TestEmployeeRepository:
    """Test cases for EmployeeRepository"""

    @pytest.fixture
    def mock_db(self):
        """Create an in-memory MongoDB instance for testing"""
        client = MongoClient()
        db = client["gestionDePointage_test"]
        yield db
        # Cleanup
        client.drop_database("gestionDePointage_test")

    def test_insert_employee_success(self, mock_db):
        """Test successfully inserting a single employee"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()
            employee = Employee(
                employee_code="001",
                name="John Doe",
                privilege=0,
                group_id="G1",
                card=12345
            )

            # Act
            repo.insert_employee(employee)

            # Assert
            result = mock_db["employees"].find_one({"employee_code": "001"})
            assert result is not None
            assert result["name"] == "John Doe"
            assert result["employee_code"] == "001"

    def test_insert_employee_duplicate(self, mock_db):
        """Test inserting duplicate employee (should be ignored)"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()
            employee = Employee(
                employee_code="001",
                name="John Doe",
                privilege=0,
                group_id="G1",
                card=12345
            )

            # Act - Insert same employee twice
            repo.insert_employee(employee)
            result = repo.insert_employee(employee)

            # Assert
            assert result is None  # Second insert returns None due to duplicate
            count = mock_db["employees"].count_documents({})
            assert count == 1  # Only one document in collection

    def test_insert_many_employees(self, mock_db):
        """Test inserting multiple employees"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()
            employees = [
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
                Employee(
                    employee_code="003",
                    name="Bob Johnson",
                    privilege=1,
                    group_id="G2",
                    card=12347
                ),
            ]

            # Act
            repo.insert_many(employees)

            # Assert
            count = mock_db["employees"].count_documents({})
            assert count == 3

    def test_insert_many_with_duplicates(self, mock_db):
        """Test inserting multiple employees with some duplicates"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()
            employees_batch_1 = [
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

            # Act
            repo.insert_many(employees_batch_1)
            # Try to insert again with one duplicate
            employees_batch_2 = [
                Employee(
                    employee_code="001",  # Duplicate
                    name="John Doe",
                    privilege=0,
                    group_id="G1",
                    card=12345
                ),
                Employee(
                    employee_code="003",
                    name="Bob Johnson",
                    privilege=1,
                    group_id="G2",
                    card=12347
                ),
            ]
            repo.insert_many(employees_batch_2)

            # Assert
            count = mock_db["employees"].count_documents({})
            assert count == 3  # Only 3 unique employees

    def test_get_all_employees(self, mock_db):
        """Test retrieving all employees"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()
            employees = [
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
            repo.insert_many(employees)

            # Act
            result = repo.get_all_employees()

            # Assert
            assert len(result) == 2
            assert result[0]["name"] == "John Doe"
            assert result[1]["name"] == "Jane Smith"
            assert "_id" not in result[0]  # _id should be excluded

    def test_get_all_employees_empty(self, mock_db):
        """Test retrieving all employees from empty collection"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()

            # Act
            result = repo.get_all_employees()

            # Assert
            assert result == []
            assert isinstance(result, list)

    def test_find_by_name(self, mock_db):
        """Test finding employees by name"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()
            employees = [
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
                Employee(
                    employee_code="003",
                    name="John Smith",
                    privilege=1,
                    group_id="G2",
                    card=12347
                ),
            ]
            repo.insert_many(employees)

            # Act
            result = repo.find_by_name("John Doe")

            # Assert
            assert len(result) == 1
            assert result[0]["name"] == "John Doe"
            assert result[0]["employee_code"] == "001"

    def test_find_by_name_multiple_results(self, mock_db):
        """Test finding multiple employees with similar names"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()
            employees = [
                Employee(
                    employee_code="001",
                    name="John",
                    privilege=0,
                    group_id="G1",
                    card=12345
                ),
                Employee(
                    employee_code="002",
                    name="John",
                    privilege=0,
                    group_id="G1",
                    card=12346
                ),
            ]
            repo.insert_many(employees)

            # Act
            result = repo.find_by_name("John")

            # Assert
            assert len(result) == 2

    def test_find_by_name_not_found(self, mock_db):
        """Test finding employee that doesn't exist"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()
            employee = Employee(
                employee_code="001",
                name="John Doe",
                privilege=0,
                group_id="G1",
                card=12345
            )
            repo.insert_employee(employee)

            # Act
            result = repo.find_by_name("Jane Doe")

            # Assert
            assert result == []

    def test_count_employees(self, mock_db):
        """Test counting employees in collection"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()

            # Act & Assert - Empty collection
            assert repo.count() == 0

            # Add employees
            employees = [
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
            repo.insert_many(employees)

            # Assert - Non-empty collection
            assert repo.count() == 2

    def test_unique_index_on_employee_code(self, mock_db):
        """Test that unique index is created on employee_code"""
        # Arrange
        with patch('app.utils.get_db', return_value=mock_db):
            repo = EmployeeRepository()

            # Assert
            indexes = mock_db["employees"].list_indexes()
            index_names = [index["name"] for index in indexes]
            assert "employee_code_1" in index_names
