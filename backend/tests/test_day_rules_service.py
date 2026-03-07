import sys
from pathlib import Path
from unittest.mock import patch

import pytest

# Add project root to Python path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.services.day_rules_service import DayRulesService


def _create_service(mock_mongodb):
    with patch("app.services.day_rules_service.utils.get_db", return_value=mock_mongodb):
        return DayRulesService()


def test_delete_department_reassigns_employees_to_default(mock_mongodb):
    service = _create_service(mock_mongodb)
    service.upsert_department_hours("logistique", "09:00", "18:00")

    employees = mock_mongodb["employees"]
    employees.insert_many(
        [
            {"employee_code": "101", "name": "A", "department": "logistique"},
            {"employee_code": "102", "name": "B", "department": "logistique"},
            {"employee_code": "103", "name": "C", "department": "employee"},
        ]
    )

    result = service.delete_department("logistique", "reassign_default")

    assert result["deleted"] is True
    assert result["employee_strategy"] == "reassign_default"
    assert result["employees_affected"] == 2

    logistique_count = employees.count_documents({"department": "logistique"})
    default_count = employees.count_documents({"department": "employee"})
    assert logistique_count == 0
    assert default_count == 3

    cfg = service.get_config()
    assert "logistique" not in cfg["normal_config"]["departments"]
    assert "logistique" not in cfg["ramadan_config"]["departments"]


def test_delete_department_removes_employees_when_strategy_delete(mock_mongodb):
    service = _create_service(mock_mongodb)
    service.upsert_department_hours("qa", "08:00", "17:00")

    employees = mock_mongodb["employees"]
    employees.insert_many(
        [
            {"employee_code": "201", "name": "A", "department": "qa"},
            {"employee_code": "202", "name": "B", "department": "qa"},
            {"employee_code": "203", "name": "C", "department": "employee"},
        ]
    )

    with patch("app.services.day_rules_service.ZKService") as mock_zk_service_class:
        mock_zk_service = mock_zk_service_class.return_value
        mock_zk_service.delete_users_bulk.return_value = {
            "deleted_codes": ["201", "202"],
            "not_found_codes": [],
            "failed_codes": [],
        }
        result = service.delete_department("qa", "delete")

    assert result["deleted"] is True
    assert result["employee_strategy"] == "delete"
    assert result["employees_affected"] == 2
    assert result["device_deleted"] == 2
    assert employees.count_documents({"department": "qa"}) == 0
    assert employees.count_documents({}) == 1


def test_delete_department_rejects_system_departments(mock_mongodb):
    service = _create_service(mock_mongodb)

    with pytest.raises(ValueError):
        service.delete_department("employee", "reassign_default")

    with pytest.raises(ValueError):
        service.delete_department("administration", "delete")
