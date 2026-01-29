import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any


class ZKMockConnection:
    """Mock connection object that behaves like the real ZK device connection"""

    def __init__(self, device_ip: str = "192.168.100.5"):
        self.device_ip = device_ip
        self.is_connected = True

    def get_attendance(self) -> List[Dict[str, Any]]:
        """
        Simulate getting attendance logs from the real ZK device.
        Returns raw logs with only user_id and timestamp (ISO format with timezone).
        Business logic (in/out detection) will be handled by the service layer.
        """
        logs = []
        now = datetime.now(timezone.utc)

        # Mock employee IDs
        employee_ids = [1, 2, 3, 4, 5]

        # Generate attendance logs for each employee with realistic timing
        for user_id in employee_ids:
            # Morning check-in (8:00 AM - 8:30 AM)
            check_in = now.replace(hour=8, minute=random.randint(0, 30), second=random.randint(0, 59))
            logs.append({
                "user_id": user_id,
                "timestamp": check_in.isoformat(),
            })

            # Lunch break out (12:00 PM - 12:15 PM)
            lunch_out = now.replace(hour=12, minute=random.randint(0, 15), second=random.randint(0, 59))
            logs.append({
                "user_id": user_id,
                "timestamp": lunch_out.isoformat(),
            })

            # Lunch break in (1:00 PM - 1:15 PM)
            lunch_in = now.replace(hour=13, minute=random.randint(0, 15), second=random.randint(0, 59))
            logs.append({
                "user_id": user_id,
                "timestamp": lunch_in.isoformat(),
            })

            # End of day check-out (5:00 PM - 5:30 PM)
            check_out = now.replace(hour=17, minute=random.randint(0, 30), second=random.randint(0, 59))
            logs.append({
                "user_id": user_id,
                "timestamp": check_out.isoformat(),
            })

        # Simulate occasional duplicates (20% chance) - simulates sensor errors
        if random.random() < 0.2 and logs:
            logs.append(random.choice(logs))

        # Sort by timestamp (as device would return them)
        logs.sort(key=lambda x: x["timestamp"])

        return logs

    def get_employees(self) -> List[Dict[str, Any]]:
        """
        Simulate getting employee list from the real ZK device.
        Returns employee records with standard ZK device format.
        """
        employees = [
            {
                "employee_code": "1",
                "name": "Ahmed Ben Ali",
                "privilege": 0,
                "group_id": "",
                "card": 13605475,
                "user_id": 1,
            },
            {
                "employee_code": "2",
                "name": "Sara Trabelsi",
                "privilege": 0,
                "group_id": "",
                "card": 13605476,
                "user_id": 2,
            },
            {
                "employee_code": "3",
                "name": "Masri.Mohamed",
                "privilege": 0,
                "group_id": "",
                "card": 13605477,
                "user_id": 3,
            },
            {
                "employee_code": "4",
                "name": "Leila Mansouri",
                "privilege": 0,
                "group_id": "",
                "card": 13605478,
                "user_id": 4,
            },
            {
                "employee_code": "5",
                "name": "Mohamed Aziz Arfaoui",
                "privilege": 1,
                "group_id": "admin",
                "card": 13605479,
                "user_id": 5,
            },
        ]
        return employees

    def disconnect(self):
        """Mock disconnect"""
        self.is_connected = False
        return True


class ZKMock:
    """Mock ZK device that behaves like the real library"""

    def __init__(self, ip: str = "192.168.100.5", port: int = 4370, timeout: int = 5):
        self.ip = ip
        self.port = port
        self.timeout = timeout
        self.connection = None

    def connect(self) -> ZKMockConnection:
        """
        Connect to the mock device.
        Returns a mock connection object with the same interface as real ZK SDK.
        """
        self.connection = ZKMockConnection(device_ip=self.ip)
        return self.connection

    def disconnect(self):
        """Disconnect from mock device"""
        if self.connection:
            self.connection.disconnect()
