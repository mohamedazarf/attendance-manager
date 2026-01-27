from app.schemas.attendanceLog import AttendanceLog
from app.utils import get_db
db = get_db()
class AttendanceRepository:

    def __init__(self, collection):
        self.collection = db["attendance_logs"]


    def insert_log(self, log: AttendanceLog):
        self.collection.insert_one(log.dict())

    def insert_many(self, logs: list[AttendanceLog]):
        try:
            self.collection.insert_many([log.dict() for log in logs], ordered=False)
        except BulkWriteError:
            pass

    def get_all_logs(self):
        return list(self.collection.find())
