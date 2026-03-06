from datetime import date, time as dtime
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
            "ramadan_config": {
                "start_date": None,
                "end_date": None,
                "departments": {},
            },
        }

    @staticmethod
    def normalize_department_name(name: str) -> str:
        return (name or "").strip().lower()

    def list_departments(self) -> List[str]:
        config = self.get_config()
        ramadan = config.get("ramadan_config") or {}
        departments = ramadan.get("departments", {}) or {}
        names = set(["employee", "administration"])
        for key in departments.keys():
            normalized = self.normalize_department_name(key)
            if normalized:
                names.add(normalized)
        return sorted(names)

    def upsert_department_hours(
        self,
        department: str,
        start_time: str,
        end_time: str,
    ) -> Dict[str, Any]:
        dept_key = self.normalize_department_name(department)
        if not dept_key:
            raise ValueError("department name is required")

        config = self.get_config()
        ramadan = config.get("ramadan_config") or {}
        departments = ramadan.get("departments", {}) or {}
        departments[dept_key] = {
            "start_time": start_time,
            "end_time": end_time,
        }

        payload = {
            "start_date": ramadan.get("start_date"),
            "end_date": ramadan.get("end_date"),
            "departments": departments,
        }
        self.collection.update_one(
            {"key": self.config_key},
            {"$set": {"ramadan_config": payload}},
            upsert=True,
        )

        return {"name": dept_key, **departments[dept_key]}

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

    # ── Ramadan configuration helpers ──────────────────────────────────────────

    def get_ramadan_config(self) -> Dict[str, Any]:
        """
        Return raw ramadan configuration as stored in DB.
        Dates are ISO strings, times are HH:MM strings.
        """
        config = self.get_config()
        ramadan = config.get("ramadan_config") or {}
        # Ensure default structure
        return {
            "start_date": ramadan.get("start_date"),
            "end_date": ramadan.get("end_date"),
            "departments": ramadan.get("departments", {}),
        }

    def update_ramadan_config(
        self,
        start_date: Optional[date],
        end_date: Optional[date],
        departments: Dict[str, Dict[str, str]],
    ) -> Dict[str, Any]:
        """
        Persist ramadan configuration.
        - start_date / end_date: python date objects (or None)
        - departments: {"administration": {"start_time": "HH:MM", "end_time": "HH:MM"}, ...}
        """
        payload = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "departments": departments or {},
        }

        self.collection.update_one(
            {"key": self.config_key},
            {"$set": {"ramadan_config": payload}},
            upsert=True,
        )
        return self.get_ramadan_config()

    def get_department_hours_for_date(
        self,
        target_date: date,
        department: str,
    ) -> Optional[Dict[str, dtime]]:
        """
        If target_date is within the configured ramadan period and the given
        department has overrides, return concrete time objects for start/end.
        Otherwise return None.
        """
        config = self.get_config()
        ramadan = config.get("ramadan_config") or {}
        start_date_iso = ramadan.get("start_date")
        end_date_iso = ramadan.get("end_date")
        if not start_date_iso or not end_date_iso:
            return None

        try:
            start_date_cfg = date.fromisoformat(start_date_iso)
            end_date_cfg = date.fromisoformat(end_date_iso)
        except ValueError:
            return None

        if not (start_date_cfg <= target_date <= end_date_cfg):
            return None

        departments = ramadan.get("departments", {}) or {}
        dept_key = (department or "").lower()
        dept_cfg = departments.get(dept_key)
        if not dept_cfg:
            return None

        start_str = dept_cfg.get("start_time")
        end_str = dept_cfg.get("end_time")
        if not start_str or not end_str:
            return None

        try:
            start_h, start_m = [int(x) for x in start_str.split(":")]
            end_h, end_m = [int(x) for x in end_str.split(":")]
            start_t = dtime(start_h, start_m)
            end_t = dtime(end_h, end_m)
        except Exception:
            return None

        return {"start_time": start_t, "end_time": end_t}
