# Attendance Processing System Documentation

## Overview

The Attendance Processing System is a comprehensive solution for managing employee attendance records, calculating working hours, and detecting anomalies based on configurable business rules.

### Key Features

- **Raw Log Ingestion**: Accept attendance logs from ZKTeco devices or mock data
- **Smart Processing**: Group logs by user and date, deduplicate records
- **In/Out Detection**: Automatically determine check-in/out events using alternating pattern
- **Hours Calculation**: Calculate total working hours minus configured pause time
- **Anomaly Detection**: Identify late arrivals, incomplete days, unpaired events, etc.
- **Flexible Configuration**: All business rules are configurable
- **Multiple Report Views**: Detailed processing, daily summaries, anomalies only, comprehensive reports

---

## Configuration

### Business Rules (`app/config/attendance_config.py`)

All rules are configurable and can be modified:

```python
START_TIME = time(8, 0)              # Expected start time (8:00 AM)
END_TIME = time(17, 0)               # Expected end time (5:00 PM)
PAUSE_DURATION = 60                  # Lunch break duration in minutes
LATE_TOLERANCE = 15                  # Grace period for late arrival in minutes
EARLY_DEPARTURE_THRESHOLD = 30       # Minimum early departure time to flag as anomaly
```

**Expected Working Hours Calculation:**
- Formula: (END_TIME - START_TIME) - (PAUSE_DURATION / 60)
- Example: (17:00 - 08:00) - 1 hour = 8 hours/day

---

## API Endpoints

### 1. Insert Mock Attendance Logs

**Endpoint:** `GET/POST /api/v1/attendance/ingest-logs-mock`

Generates and inserts mock attendance logs into `attendances_mock` collection.

**Response:**
```json
{
  "status": "success",
  "inserted": 20,
  "collection": "attendances_mock"
}
```

**Log Format:**
```json
{
  "user_id": 1,
  "timestamp": "2026-01-29T08:15:00+00:00"
}
```

---

### 2. Insert Mock Employees

**Endpoint:** `GET/POST /api/v1/employee/ingest-mock`

Generates and inserts mock employee records into `employees_mock` collection.

**Response:**
```json
{
  "status": "success",
  "inserted": 5,
  "collection": "employees_mock"
}
```

**Employee Format:**
```json
{
  "user_id": 1,
  "employee_code": "1",
  "name": "Ahmed Ben Ali",
  "privilege": 0,
  "group_id": "",
  "card": 13605475
}
```

---

### 3. Process Logs and Calculate Hours

**Endpoint:** `GET/POST /api/v1/attendance/process-logs-mock`

Processes raw logs and performs:
- Deduplication
- In/out event detection
- Hours calculation
- Anomaly detection

**Response:**
```json
{
  "status": "success",
  "total_records": 5,
  "data": [
    {
      "user_id": 1,
      "date": "2026-01-29",
      "check_in_time": "2026-01-29T08:15:00+00:00",
      "check_out_time": "2026-01-29T17:20:00+00:00",
      "total_hours_worked": 8.5,
      "expected_hours": 8.0,
      "has_anomaly": false,
      "anomalies": [],
      "is_late": false,
      "late_minutes": 0,
      "is_complete_day": true,
      "status": "normal",
      "events": [
        {
          "timestamp": "2026-01-29T08:15:00+00:00",
          "event_type": "in",
          "event_order": 1
        },
        {
          "timestamp": "2026-01-29T12:10:00+00:00",
          "event_type": "out",
          "event_order": 2
        },
        {
          "timestamp": "2026-01-29T13:05:00+00:00",
          "event_type": "in",
          "event_order": 3
        },
        {
          "timestamp": "2026-01-29T17:20:00+00:00",
          "event_type": "out",
          "event_order": 4
        }
      ]
    }
  ]
}
```

---

### 4. Daily Attendance Summary

**Endpoint:** `GET/POST /api/v1/attendance/daily-summary-mock`

Returns processed attendance with employee information for reporting.

**Response:**
```json
{
  "status": "success",
  "total_records": 5,
  "data": [
    {
      "user_id": 1,
      "employee_code": "1",
      "employee_name": "Ahmed Ben Ali",
      "date": "2026-01-29",
      "first_event": "2026-01-29T08:15:00+00:00",
      "last_event": "2026-01-29T17:20:00+00:00",
      "total_hours_worked": 8.5,
      "expected_hours": 8.0,
      "hours_difference": 0.5,
      "status": "normal",
      "anomalies": []
    }
  ]
}
```

---

### 5. Anomalies Only

**Endpoint:** `GET/POST /api/v1/attendance/anomalies-mock`

Returns only records with detected anomalies.

**Response:**
```json
{
  "status": "success",
  "total_anomalies": 2,
  "data": [
    {
      "user_id": 2,
      "employee_code": "2",
      "employee_name": "Sara Trabelsi",
      "date": "2026-01-29",
      "anomalies": ["retard", "incomplete_day"],
      "total_hours_worked": 6.5,
      "expected_hours": 8.0,
      "hours_difference": -1.5,
      "status": "anomaly"
    }
  ]
}
```

---

### 6. Comprehensive Report

**Endpoint:** `GET/POST /api/v1/attendance/report-mock`

Summary grouped by employee with daily breakdown.

**Response:**
```json
{
  "status": "success",
  "total_employees": 5,
  "data": [
    {
      "user_id": 1,
      "employee_code": "1",
      "employee_name": "Ahmed Ben Ali",
      "daily_records": [
        {
          "date": "2026-01-29",
          "hours_worked": 8.5,
          "expected_hours": 8.0,
          "status": "normal",
          "anomalies": []
        }
      ],
      "total_hours": 8.5,
      "expected_hours": 8.0,
      "anomaly_count": 0
    }
  ]
}
```

---

## Anomaly Types

The system detects the following anomalies:

| Anomaly | Code | Description |
|---------|------|-------------|
| **Absence** | `absence` | No check-in for the entire day |
| **Late Arrival** | `retard` | Arrival after START_TIME + LATE_TOLERANCE |
| **Check-in Without Check-out** | `entree_sans_sortie` | Unpaired check-in (odd number of events, last is "in") |
| **Check-out Without Check-in** | `sortie_sans_entree` | Unpaired check-out (odd number of events, last is "out") |
| **Early Departure** | `early_departure` | Left more than EARLY_DEPARTURE_THRESHOLD minutes early |
| **Incomplete Day** | `incomplete_day` | Missing check-in or check-out, or worked < 90% of expected hours |

---

## Data Models

### AttendanceCheckPoint

Single in/out event for a user on a day.

```python
class AttendanceCheckPoint(BaseModel):
    timestamp: datetime          # ISO format with timezone
    event_type: str              # "in" or "out"
    event_order: int             # Sequential order (1st, 2nd, 3rd event, etc.)
```

### ProcessedAttendance

Complete processed record for a user on a given day.

```python
class ProcessedAttendance(BaseModel):
    user_id: int
    date: date
    
    # Time records
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    events: List[AttendanceCheckPoint]
    
    # Calculated fields
    total_hours_worked: float              # Hours - pause time
    pause_hours: float                     # Configured pause duration
    expected_hours: float                  # Expected working hours per day
    
    # Anomalies
    has_anomaly: bool
    anomalies: List[str]                   # List of anomaly types
    status: str                            # "normal", "anomaly", "absence"
    
    # Details
    is_complete_day: bool                  # Has both check-in and check-out
    is_late: bool
    late_minutes: int
```

### DailyAttendanceSummary

Summary for reporting/display.

```python
class DailyAttendanceSummary(BaseModel):
    user_id: int
    employee_code: Optional[str]
    employee_name: Optional[str]
    date: date
    
    first_event: Optional[datetime]
    last_event: Optional[datetime]
    
    total_hours_worked: float
    expected_hours: float
    hours_difference: float                # Positive = overwork, Negative = underwork
    
    anomalies: List[str]
    status: str                            # "normal", "anomaly", "absence"
```

---

## Usage Workflow

### Step 1: Insert Mock Data (Testing)

```bash
# Insert 20 mock attendance logs
curl http://127.0.0.1:8000/api/v1/attendance/ingest-logs-mock

# Insert 5 mock employees
curl http://127.0.0.1:8000/api/v1/employee/ingest-mock
```

### Step 2: Process Logs

```bash
# Process logs and calculate hours
curl http://127.0.0.1:8000/api/v1/attendance/process-logs-mock
```

### Step 3: View Results

```bash
# View daily summaries
curl http://127.0.0.1:8000/api/v1/attendance/daily-summary-mock

# View only anomalies
curl http://127.0.0.1:8000/api/v1/attendance/anomalies-mock

# View comprehensive report
curl http://127.0.0.1:8000/api/v1/attendance/report-mock
```

---

## Hours Calculation Logic

### Basic Formula

```
Total Hours Worked = Sum of (out_time - in_time) - pause_time
```

### Example

Employee check-in/out pattern:
- 08:15 → Check-in (event 1)
- 12:10 → Check-out (event 2)
- 13:05 → Check-in (event 3)
- 17:20 → Check-out (event 4)

Calculation:
```
Period 1: 12:10 - 08:15 = 3 hours 55 minutes
Period 2: 17:20 - 13:05 = 4 hours 15 minutes
Total: 3h 55m + 4h 15m = 8 hours 10 minutes
Minus Pause: 8h 10m - 1h = 7 hours 10 minutes

Total Hours Worked = 7.17 hours
Expected Hours = 8.0 hours
Hours Difference = -0.83 hours (underwork)
```

---

## Deduplication Logic

Records are deduplicated if they occur within **5 seconds** of each other (simulates sensor errors).

---

## Event Determination Logic

The system uses an **alternating pattern** to determine in/out events:

- **1st event** → Check-in (in)
- **2nd event** → Check-out (out)
- **3rd event** → Check-in (in)
- **4th event** → Check-out (out)
- And so on...

This handles multiple check-in/out cycles per day (e.g., lunch breaks).

---

## Error Handling

All endpoints return structured error responses:

```json
{
  "status": "error",
  "message": "No mock logs found. Call /ingest-logs-mock first"
}
```

---

## Customization

### Modify Business Rules

Edit `app/config/attendance_config.py`:

```python
class AttendanceConfig:
    START_TIME = time(8, 30)           # Change start time
    END_TIME = time(18, 0)             # Change end time
    PAUSE_DURATION = 90                # Change pause duration
    LATE_TOLERANCE = 10                # Change late tolerance
    EARLY_DEPARTURE_THRESHOLD = 45     # Change early departure threshold
```

Changes apply immediately to all processing operations.

---

## Database Collections

The system uses these MongoDB collections:

- **attendances_mock**: Raw mock attendance logs
- **employees_mock**: Mock employee records
- **attendance_logs**: Real attendance logs (from actual ZKTeco device)

---

## Technical Stack

- **Framework**: FastAPI
- **Database**: MongoDB
- **Data Validation**: Pydantic
- **Date/Time**: Python datetime with UTC timezone

---

## Support & Troubleshooting

### No logs found error
- Ensure you called `/ingest-logs-mock` first
- Check MongoDB that `attendances_mock` collection exists and has data

### Timezone issues
- All timestamps are stored and compared in UTC
- Mock data uses `timezone.utc` for consistency

### Hours not calculating correctly
- Check `AttendanceConfig` for correct START_TIME, END_TIME, PAUSE_DURATION
- Verify logs are in correct format with `user_id` and `timestamp` fields
