from app.schemas.attendanceLog import AttendanceLog
from pymongo.errors import BulkWriteError
from app import utils

class AttendanceRepository:

    def __init__(self, collection):
        db = utils.get_db()
        self.collection = db["attendance_logs"]
        self.collection.create_index([("user_id", 1), ("timestamp", 1)], unique=True)


    def insert_log(self, log: AttendanceLog):
        self.collection.insert_one(log.model_dump())

    def insert_many(self, logs: list[AttendanceLog]):
        try:
            self.collection.insert_many([log.model_dump() for log in logs], ordered=False)
        except BulkWriteError:
            pass

    def get_all_logs(self):
        return list(self.collection.find())
