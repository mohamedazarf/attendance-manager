# app/api/v1/zk_test.py
from fastapi import APIRouter, HTTPException
from zk import ZK

router = APIRouter(tags=["ZK Test"])

@router.get("/zk-users")
def get_zk_users(ip: str = "192.168.100.5", port: int = 4370, timeout: int = 5):
    """
    Test connection to ZKTeco device and return the list of users.
    IP, port, and timeout are configurable via query params.
    """
    zk = ZK(ip, port=port, timeout=timeout)
    try:
        conn = zk.connect()
        users = conn.get_users()
        conn.disconnect()
        # Return simple dict of users
        return [
            {
                "user_id": user.user_id,
                "name": user.name,
                "privilege": user.privilege,
                "card": user.card,
            } for user in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ZKTeco error: {str(e)}")
