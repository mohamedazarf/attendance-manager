import pytest
from datetime import datetime, date
from app.services.attendance_metrics_service import AttendanceMetricsService
from app import utils


@pytest.fixture
def metrics_service():
    """Fixture to create AttendanceMetricsService instance"""
    return AttendanceMetricsService()


class TestAttendanceMetricsService:
    """Test suite for AttendanceMetricsService"""

    def test_working_days_in_month(self, metrics_service):
        """Test calculation of working days (Mon-Fri) in a month"""
        # February 2024 has 29 days (leap year)
        # Mondays: 5, 12, 19, 26 = 4
        # Tuesdays: 6, 13, 20, 27 = 4
        # Wednesdays: 7, 14, 21, 28 = 4
        # Thursdays: 1, 8, 15, 22, 29 = 5
        # Fridays: 2, 9, 16, 23 = 4
        # Total: 21 working days
        working_days = metrics_service.get_working_days_in_month(2024, 2)
        assert working_days == 21

    def test_working_days_in_january(self, metrics_service):
        """Test January 2024 (31 days)"""
        # January 2024: 23 working days
        working_days = metrics_service.get_working_days_in_month(2024, 1)
        assert working_days == 23

    def test_employee_attendance_status_structure(self, metrics_service):
        """Test that employee metrics returns correct structure"""
        # Using employee_id 1 (adjust as per your test data)
        metrics = metrics_service.get_employee_attendance_status(1, 2024, 1)
        
        # Check required fields exist
        assert "employee_id" in metrics
        assert "year" in metrics
        assert "month" in metrics
        assert "period" in metrics
        assert "total_working_days" in metrics
        assert "days_present" in metrics
        assert "days_absent" in metrics
        assert "presence_rate" in metrics
        assert "absence_rate" in metrics
        assert "attendance_count" in metrics

    def test_presence_rate_calculation(self, metrics_service):
        """Test that presence rate is calculated correctly"""
        metrics = metrics_service.get_employee_attendance_status(1, 2024, 1)
        
        # Verify calculations
        total_days = metrics["total_working_days"]
        days_present = metrics["days_present"]
        
        if total_days > 0:
            expected_presence_rate = round((days_present / total_days) * 100, 2)
            assert metrics["presence_rate"] == expected_presence_rate

    def test_absence_rate_sum_to_100(self, metrics_service):
        """Test that presence_rate + absence_rate = 100"""
        metrics = metrics_service.get_employee_attendance_status(1, 2024, 1)
        
        total_rate = metrics["presence_rate"] + metrics["absence_rate"]
        assert total_rate == 100.0

    def test_all_employees_metrics_returns_list(self, metrics_service):
        """Test that all employees metrics returns a list"""
        metrics_list = metrics_service.get_all_employees_metrics(2024, 1)
        
        assert isinstance(metrics_list, list)
        if len(metrics_list) > 0:
            # Check first employee has required fields
            first_employee = metrics_list[0]
            assert "employee_id" in first_employee
            assert "presence_rate" in first_employee
            assert "absence_rate" in first_employee

    def test_date_range_metrics(self, metrics_service):
        """Test metrics calculation over custom date range"""
        start = date(2024, 1, 1)
        end = date(2024, 1, 31)
        
        metrics = metrics_service.get_employee_metrics_date_range(1, start, end)
        
        assert metrics["employee_id"] == 1
        assert metrics["start_date"] == "2024-01-01"
        assert metrics["end_date"] == "2024-01-31"
        assert "presence_rate" in metrics
        assert "absence_rate" in metrics
        assert metrics["presence_rate"] + metrics["absence_rate"] == 100.0

    def test_date_range_fewer_working_days(self, metrics_service):
        """Test date range with fewer working days"""
        start = date(2024, 1, 1)
        end = date(2024, 1, 7)  # One week
        
        metrics = metrics_service.get_employee_metrics_date_range(1, start, end)
        
        # Jan 1-7, 2024: Mon(1), Tue(2), Wed(3), Thu(4), Fri(5) = 5 working days
        # (Sat(6) and Sun(7) are weekend)
        assert metrics["total_working_days"] == 5

    def test_is_weekend(self, metrics_service):
        """Test weekend detection"""
        assert metrics_service._is_weekend(date(2022, 3, 12)) == True   # Saturday
        assert metrics_service._is_weekend(date(2022, 3, 13)) == True   # Sunday
        assert metrics_service._is_weekend(date(2022, 3, 14)) == False  # Monday

    def test_calculate_weekend_hours_empty(self, metrics_service):
        """Test with no logs"""
        days, hours = metrics_service._calculate_weekend_hours([])
        assert days == 0
        assert hours == 0.0

    def test_weekend_hours_worked_field(self, metrics_service):
        """Test weekend hours in response"""
        metrics = metrics_service.get_employee_attendance_status(1, 2022, 3)
        assert "weekend_days_worked" in metrics
        assert "weekend_hours_worked" in metrics
        assert isinstance(metrics["weekend_hours_worked"], float)