from pymongo import MongoClient
from datetime import datetime

def get_db():
    client = MongoClient("mongodb://localhost:27017")
    db = client["gestionDePointage"]
    return db

# def to_datetime(ts):
#     if isinstance(ts, str):
#         return datetime.fromisoformat(ts)
#     return ts


def to_datetime(value):
    """
    Convert value to naive datetime (timezone removed).
    Accepts string or datetime.
    """
    if value is None:
        return None

    if isinstance(value, str):
        dt = datetime.fromisoformat(value)
    elif isinstance(value, datetime):
        dt = value
    else:
        raise ValueError(f"Unsupported type for datetime conversion: {type(value)}")

 # remove timezone if exists
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)

    return dt

