from app.repositories.attendanceRepo import AttendanceRepository
from app.schemas.attendanceLog import AttendanceLog

class IngestionService:

    def __init__(self, repo: AttendanceRepository):
        self.repo = repo

    def ingest_logs(self, logs):

        schemas = []
        for log in logs:
            schemas.append(AttendanceLog(
                user_id=log.user_id,
                timestamp=log.timestamp
            ))

        self.repo.insert_many(schemas)