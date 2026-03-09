# # app/api/v1/zk_test.py
# from fastapi import APIRouter, HTTPException
# from zk import ZK

# router = APIRouter(tags=["ZK Test"])

# @router.get("/zk-users")
# def get_zk_users(ip: str = "192.168.100.5", port: int = 4370, timeout: int = 5):
#     """
#     Test connection to ZKTeco device and return the list of users.
#     IP, port, and timeout are configurable via query params.
#     """
#     zk = ZK(ip, port=port, timeout=timeout)
#     try:
#         conn = zk.connect()
#         users = conn.get_users()
#         conn.disconnect()
#         # Return simple dict of users
#         return [
#             {
#                 "user_id": user.user_id,
#                 "name": user.name,
#                 "privilege": user.privilege,
#                 "card": user.card,
#             } for user in users
#         ]
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"ZKTeco error: {str(e)}")


# app/api/v1/zk_test.py
# from fastapi import APIRouter, HTTPException
# from zk import ZK  # Don't import ZKNetworkError
# from datetime import datetime

# router = APIRouter(tags=["ZK Test"])

# @router.get("/read-logs")
# def read_zk_logs(ip: str = "192.168.100.5", port: int = 4370, timeout: int = 5):
#     """
#     Read attendance logs directly from ZK device and return them
#     """
#     try:
#         # Connect to ZK device
#         zk = ZK(ip, port=port, timeout=timeout)
#         conn = zk.connect()
        
#         # Get logs from device
#         logs = conn.get_attendance()
        
#         # Format the logs for display
#         formatted_logs = []
#         for log in logs:
#             # Format each log entry
#             formatted_log = {
#                 "user_id": log.user_id,
#                 "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else None,
#                 "status": log.status,
#                 "punch": log.punch,
#                 "uid": log.uid,
#                 "device_id": f"ZK_{ip}"
#             }
#             formatted_logs.append(formatted_log)
        
#         conn.disconnect()
        
#         return {
#             "status": "success",
#             "source": f"zk_device_{ip}:{port}",
#             "logs": formatted_logs,
#             "count": len(logs),
#             "read_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#         }
        
#     except Exception as e:
#         # Catch all exceptions
#         raise HTTPException(status_code=500, detail=f"ZK device error: {str(e)}")

# @router.get("/zk-users")
# def get_zk_users(ip: str = "192.168.100.5", port: int = 4370, timeout: int = 5):
#     """
#     Test connection to ZKTeco device and return the list of users.
#     IP, port, and timeout are configurable via query params.
#     """
#     zk = ZK(ip, port=port, timeout=timeout)
#     try:
#         conn = zk.connect()
#         users = conn.get_users()
#         conn.disconnect()
#         # Return simple dict of users
#         return [
#             {
#                 "user_id": user.user_id,
#                 "name": user.name,
#                 "privilege": user.privilege,
#                 "card": user.card,
#             } for user in users
#         ]
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"ZKTeco error: {str(e)}")



# from fastapi import APIRouter, HTTPException
# from zk import ZK
# from datetime import datetime
# from collections import defaultdict

# router = APIRouter(tags=["ZK Test"])

# @router.get("/read-logs")
# def read_zk_logs(ip: str = "192.168.100.5", port: int = 4370, timeout: int = 5):
#     try:
#         zk = ZK(ip, port=port, timeout=timeout)
#         conn = zk.connect()
#         logs = conn.get_attendance()
        
#         formatted_logs = []
#         # Group logs by user and date
#         user_logs = defaultdict(lambda: defaultdict(list))  # user_id -> date -> list of timestamps
        
#         for log in logs:
#             ts_str = log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else None
#             formatted_logs.append({
#                 "user_id": log.user_id,
#                 "timestamp": ts_str,
#                 "uid": log.uid,
#                 "device_id": f"ZK_{ip}",
#             })
#             if log.timestamp:
#                 date_str = log.timestamp.strftime("%Y-%m-%d")
#                 user_logs[log.user_id][date_str].append(log.timestamp)
        
#         # Build summary: first check-in and last check-out
#         summary_output = []
#         for user_id, dates in user_logs.items():
#             for date, times in dates.items():
#                 times_sorted = sorted(times)
#                 summary_output.append({
#                     "user_id": user_id,
#                     "date": date,
#                     "first_check_in": times_sorted[0].strftime("%Y-%m-%d %H:%M:%S"),
#                     "last_check_out": times_sorted[-1].strftime("%Y-%m-%d %H:%M:%S")
#                 })
        
#         conn.disconnect()
        
#         return {
#             "status": "success",
#             "source": f"zk_device_{ip}:{port}",
#             "logs": formatted_logs,
#             "summary": summary_output,
#             "total_logs": len(logs),
#             "read_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#         }
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"ZK device error: {str(e)}")


# app/api/v1/zk_test.py
# from fastapi import APIRouter, HTTPException,Query
# from zk import ZK
# from datetime import datetime
# from collections import defaultdict

# router = APIRouter(tags=["ZK Test"])

# @router.get("/read-logs")
# def read_zk_logs(ip: str = "192.168.100.5", port: int = 4370, timeout: int = 5):
#     """
#     Read ZK attendance logs and label each as Check-in or Check-out
#     by alternating punches per employee per day (supports breaks).
#     """
#     try:
#         zk = ZK(ip, port=port, timeout=timeout)
#         conn = zk.connect()
#         logs = conn.get_attendance()
        
#         # Group logs by user -> date
#         user_logs = defaultdict(lambda: defaultdict(list))
#         for log in logs:
#             if not log.timestamp:
#                 continue
#             date_str = log.timestamp.strftime("%Y-%m-%d")
#             user_logs[log.user_id][date_str].append(log)
        
#         formatted_logs = []
#         summary_output = []
        
#         for user_id, dates in user_logs.items():
#             for date, day_logs in dates.items():
#                 # Sort logs by timestamp
#                 day_logs_sorted = sorted(day_logs, key=lambda x: x.timestamp)
                
#                 # Alternate Check-in / Check-out
#                 for i, log in enumerate(day_logs_sorted):
#                     check_label = "Check-in" if i % 2 == 0 else "Check-out"
#                     formatted_logs.append({
#                         "user_id": log.user_id,
#                         "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
#                         "uid": log.uid,
#                         "check": check_label,
#                         "device_id": f"ZK_{ip}"
#                     })
                
#                 # Daily summary: first check-in & last check-out
#                 summary_output.append({
#                     "user_id": user_id,
#                     "date": date,
#                     "first_check_in": day_logs_sorted[0].timestamp.strftime("%Y-%m-%d %H:%M:%S"),
#                     "last_check_out": day_logs_sorted[-1].timestamp.strftime("%Y-%m-%d %H:%M:%S")
#                 })
        
#         conn.disconnect()
        
#         return {
#             "status": "success",
#             "source": f"zk_device_{ip}:{port}",
#             "logs": formatted_logs,
#             "summary": summary_output,
#             "total_logs": len(formatted_logs),
#             "read_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#         }
    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"ZK device error: {str(e)}")


# @router.get("/user-logs")
# def get_user_logs(
#     user_id: str = Query(..., description="User ID to fetch logs for"),
#     date: str = Query(..., description="Date in YYYY-MM-DD format"),
#     ip: str = "192.168.100.5",
#     port: int = 4370,
#     timeout: int = 5
# ):
#     """
#     Get all logs for a single user on a specific day,
#     labeled Check-in / Check-out alternately.
#     """
#     try:
#         # Parse the date
#         day = datetime.strptime(date, "%Y-%m-%d").date()
        
#         zk = ZK(ip, port=port, timeout=timeout)
#         conn = zk.connect()
#         logs = conn.get_attendance()
        
#         # Filter logs for the specific user and day
#         user_day_logs = [
#             log for log in logs
#             if log.user_id == user_id and log.timestamp and log.timestamp.date() == day
#         ]
        
#         if not user_day_logs:
#             conn.disconnect()
#             return {"status": "success", "message": f"No logs found for user {user_id} on {date}", "logs": []}
        
#         # Sort logs by timestamp
#         user_day_logs.sort(key=lambda x: x.timestamp)
        
#         # Label Check-in / Check-out alternately
#         formatted_logs = []
#         for i, log in enumerate(user_day_logs):
#             check_label = "Check-in" if i % 2 == 0 else "Check-out"
#             formatted_logs.append({
#                 "user_id": log.user_id,
#                 "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
#                 "uid": log.uid,
#                 "check": check_label,
#                 "device_id": f"ZK_{ip}"
#             })
        
#         conn.disconnect()
        
#         return {
#             "status": "success",
#             "user_id": user_id,
#             "date": date,
#             "logs": formatted_logs,
#             "total_logs": len(formatted_logs)
#         }
    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"ZK device error: {str(e)}")


# app/api/v1/zk_test.py
from app.config.attendance_config import AttendanceConfig

router = APIRouter(tags=["ZK Test"])

@router.get("/user-logs")
def get_user_logs(
    user_id: str = Query(..., description="User ID to fetch logs for"),
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    ip: str = AttendanceConfig.DEVICE_IP,
    port: int = AttendanceConfig.DEVICE_PORT,
    timeout: int = 5
):
    """
    Get all logs for a single user on a specific day,
    labeled Check-in / Check-out alternately.
    """
    try:
        # Parse the date string to a date object
        day = datetime.strptime(date, "%Y-%m-%d").date()
        
        # Connect to ZKTeco device
        zk = ZK(ip, port=port, timeout=timeout)
        conn = zk.connect()
        logs = conn.get_attendance()
        
        # Filter logs for the specific user and day
        user_day_logs = [
            log for log in logs
            if log.user_id == user_id and log.timestamp and log.timestamp.date() == day
        ]
        
        if not user_day_logs:
            conn.disconnect()
            return {
                "status": "success",
                "message": f"No logs found for user {user_id} on {date}",
                "logs": []
            }
        
        # Sort logs by timestamp
        user_day_logs.sort(key=lambda x: x.timestamp)
        
        # Label Check-in / Check-out alternately
        formatted_logs = []
        for i, log in enumerate(user_day_logs):
            check_label = "Check-in" if i % 2 == 0 else "Check-out"
            formatted_logs.append({
                "user_id": log.user_id,
                "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "uid": log.uid,
                "check": check_label,
                "device_id": f"ZK_{ip}"
            })
        
        # Disconnect device
        conn.disconnect()
        
        return {
            "status": "success",
            "user_id": user_id,
            "date": date,
            "logs": formatted_logs,
            "total_logs": len(formatted_logs)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ZK device error: {str(e)}")


