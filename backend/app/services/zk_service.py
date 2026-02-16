from zk import ZK

class ZKService:
    def __init__(self, ip="192.168.100.5", port=4370):
        self.ip = ip
        self.port = port

    def _connect(self):
        zk = ZK(self.ip, port=self.port, timeout=5)
        return zk.connect()

    def list_users(self):
        conn = self._connect()
        users = conn.get_users()
        conn.disconnect()
        return users

    def create_user(self, uid, name, user_id=None, privilege=0, password=''):
        if user_id is None:
            user_id = str(uid)

        conn = self._connect()
        conn.set_user(uid=uid, name=name, privilege=privilege,
                      password=password, user_id=user_id)
        conn.disconnect()
        return {"message": "User created"}

    def delete_user(self, uid):
        conn = self._connect()
        conn.delete_user(uid=uid)
        conn.disconnect()
        return {"message": "User deleted"}

    def enroll_fingerprint(self, uid):
        conn = self._connect()
        conn.enroll_user(uid=uid)
        conn.disconnect()
        return {"message": "Fingerprint enrolled"}

    def get_attendances(self):
        conn = self._connect()
        attendances = conn.get_attendance()
        conn.disconnect()
        return attendances
