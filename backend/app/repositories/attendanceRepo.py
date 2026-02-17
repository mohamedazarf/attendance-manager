from app.schemas.attendanceLog import AttendanceLog
from pymongo.errors import BulkWriteError, DuplicateKeyError, OperationFailure
from app import utils

class AttendanceRepository:

    def __init__(self, collection):
        db = utils.get_db()
        self.collection = db["attendance_logs"]
        try:
            self.collection.create_index([("user_id", 1), ("timestamp", 1)], unique=True)
        except (DuplicateKeyError, OperationFailure):
            pass


    def insert_log(self, log: AttendanceLog):
        try:
            self.collection.insert_one(log.model_dump())
            return True
        except DuplicateKeyError:
            # log already exists → ignore
            return False

    def insert_many(self, logs: list[AttendanceLog]):
        try:
            self.collection.insert_many([log.model_dump() for log in logs], ordered=False)
        except BulkWriteError:
            pass

    def get_all_logs(self):
        return list(self.collection.find())

    def get_latest_timestamp(self):
        """
        Returns the timestamp of the most recent attendance log entry.
        """
        latest_log = self.collection.find_one(sort=[("timestamp", -1)])
        if latest_log:
            return latest_log["timestamp"]
        return None
