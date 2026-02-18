import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1/attendance"
EMP_ID = "2"  # Using an employee ID from the dashboard
DATE = "2026-01-26"

def test_manual_punch():
    print("\n--- Testing Manual Punch ---")
    payload = {
        "employee_id": EMP_ID,
        "event_type": "check_in",
        "timestamp": f"{DATE}T08:30:00",
        "notes": "Testing manual punch from script"
    }
    response = requests.post(f"{BASE_URL}/manual", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_confirm_absence():
    print("\n--- Testing Confirm Absence ---")
    payload = {
        "employee_id": EMP_ID,
        "date": DATE,
        "reason": "Maladie",
        "notes": "Testing absence confirmation from script"
    }
    response = requests.post(f"{BASE_URL}/confirm-absence", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_dashboard_update():
    print("\n--- Testing Dashboard Update ---")
    response = requests.get(f"{BASE_URL}/dashboard/day?day={DATE}")
    data = response.json()
    
    emp = next((e for e in data['employees'] if str(e['employee_id']) == EMP_ID), None)
    if emp:
        print(f"Employee {EMP_ID} found.")
        print(f"Status: {emp['status']}")
        print(f"Justification: {emp.get('justification')}")
    else:
        print(f"Employee {EMP_ID} NOT found in dashboard.")

if __name__ == "__main__":
    test_manual_punch()
    test_confirm_absence()
    test_dashboard_update()
