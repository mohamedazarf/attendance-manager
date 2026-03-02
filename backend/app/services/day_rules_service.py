from datetime import date
from typing import Any, Dict, List, Optional

from app import utils


class DayRulesService:
    """Manage configurable day rules (holidays, remote days, Sunday handling)."""

    def __init__(self):
        self.db = utils.get_db()
        self.collection = self.db["attendance_day_rules"]
        self.config_key = "default"

    def _default_config(self) -> Dict[str, Any]:
        return {
            "key": self.config_key,
            "include_sunday": True,
            "special_days": [],
        }

    def get_config(self) -> Dict[str, Any]:
        config = self.collection.find_one({"key": self.config_key}, {"_id": 0})
        if config:
            return config

        config = self._default_config()
        self.collection.insert_one(config)
        return config

    def set_include_sunday(self, include_sunday: bool) -> Dict[str, Any]:
        self.collection.update_one(
            {"key": self.config_key},
            {"$set": {"include_sunday": include_sunday}},
            upsert=True,
        )
        return self.get_config()

    def list_special_days(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        config = self.get_config()
        days = config.get("special_days", [])

        if not start_date and not end_date:
            return days

        filtered = []
        for item in days:
            try:
                item_date = date.fromisoformat(item.get("date", ""))
            except ValueError:
                continue

            if start_date and item_date < start_date:
                continue
            if end_date and item_date > end_date:
                continue
            filtered.append(item)

        return filtered

    def upsert_special_day(
        self,
        day: date,
        day_type: str,
        label: Optional[str] = None,
    ) -> Dict[str, Any]:
        config = self.get_config()
        special_days = config.get("special_days", [])
        day_iso = day.isoformat()

        updated = False
        for item in special_days:
            if item.get("date") == day_iso:
                item["type"] = day_type
                item["label"] = label or ""
                updated = True
                break

        if not updated:
            special_days.append(
                {
                    "date": day_iso,
                    "type": day_type,
                    "label": label or "",
                }
            )

        self.collection.update_one(
            {"key": self.config_key},
            {"$set": {"special_days": special_days}},
            upsert=True,
        )
        return {"date": day_iso, "type": day_type, "label": label or ""}

    def delete_special_day(self, day: date) -> Dict[str, Any]:
        day_iso = day.isoformat()
        config = self.get_config()
        current = config.get("special_days", [])
        special_days = [item for item in current if item.get("date") != day_iso]

        self.collection.update_one(
            {"key": self.config_key},
            {"$set": {"special_days": special_days}},
            upsert=True,
        )
        return {"deleted": len(current) != len(special_days), "date": day_iso}

    def get_day_context(self, target_date: date) -> Dict[str, Any]:
        config = self.get_config()
        special_days = config.get("special_days", [])

        for item in special_days:
            if item.get("date") == target_date.isoformat():
                day_type = item.get("type")
                label = item.get("label") or (
                    "Jour ferie" if day_type == "holiday" else "Jour a distance"
                )
                return {
                    "is_special_day": True,
                    "type": day_type,
                    "label": label,
                    "suppress_absence": True,
                }

        if config.get("include_sunday", True) and target_date.weekday() == 6:
            return {
                "is_special_day": True,
                "type": "sunday",
                "label": "Dimanche (non ouvrable)",
                "suppress_absence": True,
            }

        return {
            "is_special_day": False,
            "type": "working_day",
            "label": "",
            "suppress_absence": False,
        }
