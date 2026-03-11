from datetime import date, time as dtime
from typing import Any, Dict, List, Optional

from app import utils
from app.config.attendance_config import AttendanceConfig
from app.services.zk_service import ZKService


class DayRulesService:
    """Manage configurable day rules (holidays, remote days, Sunday handling)."""

    def __init__(self):
        self.db = utils.get_db()
        self.collection = self.db["attendance_day_rules"]
        self.config_key = "default"

    @staticmethod
    def _default_departments_config(pause_minutes: int) -> Dict[str, Dict[str, Any]]:
        return {
            "administration": {
                "start_time": "08:30",
                "end_time": "17:30",
                "pause_minutes": pause_minutes,
            },
            "usine": {
                "start_time": "07:00",
                "end_time": "14:00",
                "pause_minutes": pause_minutes,
            },
        }

    def _default_config(self) -> Dict[str, Any]:
        return {
            "key": self.config_key,
            "include_sunday": True,
            "special_days": [],
            "normal_config": {
                "start_date": None,
                "end_date": None,
                "departments": self._default_departments_config(
                    AttendanceConfig.PAUSE_DURATION
                ),
            },
            "ramadan_config": {
                "start_date": None,
                "end_date": None,
                "departments": self._default_departments_config(0),
            },
        }

    @staticmethod
    def normalize_department_name(name: str) -> str:
        return (name or "").strip().lower()

    @staticmethod
    def default_department_name() -> str:
        return "usine"

    def list_departments(self) -> List[str]:
        config = self.get_config()
        normal = config.get("normal_config") or {}
        ramadan = config.get("ramadan_config") or {}
        normal_departments = normal.get("departments", {}) or {}
        departments = ramadan.get("departments", {}) or {}
        names = set(["usine", "administration"])
        for key in normal_departments.keys():
            normalized = self.normalize_department_name(key)
            if normalized:
                names.add(normalized)
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
        normal = config.get("normal_config") or {}
        normal_departments = normal.get("departments", {}) or {}
        ramadan = config.get("ramadan_config") or {}
        departments = ramadan.get("departments", {}) or {}
        normal_departments[dept_key] = {
            "start_time": start_time,
            "end_time": end_time,
            "pause_minutes": AttendanceConfig.PAUSE_DURATION,
        }
        departments[dept_key] = {
            "start_time": start_time,
            "end_time": end_time,
            "pause_minutes": 0,
        }

        normal_payload = {
            "start_date": normal.get("start_date"),
            "end_date": normal.get("end_date"),
            "departments": normal_departments,
        }
        payload = {
            "start_date": ramadan.get("start_date"),
            "end_date": ramadan.get("end_date"),
            "departments": departments,
        }
        self.collection.update_one(
            {"key": self.config_key},
            {"$set": {"normal_config": normal_payload, "ramadan_config": payload}},
            upsert=True,
        )

        return {
            "name": dept_key,
            "normal": normal_departments[dept_key],
            "ramadan": departments[dept_key],
        }

    def delete_department(
        self,
        department: str,
        employee_strategy: str = "reassign_default",
    ) -> Dict[str, Any]:
        dept_key = self.normalize_department_name(department)
        default_department = self.default_department_name()

        if not dept_key:
            raise ValueError("department name is required")
        if dept_key in {default_department, "administration"}:
            raise ValueError(
                f"Le departement systeme '{dept_key}' ne peut pas etre supprime"
            )
        if employee_strategy not in {"delete", "reassign_default"}:
            raise ValueError("employee_strategy must be 'delete' or 'reassign_default'")

        employees_collection = self.db["employees"]
        target_employees = list(
            employees_collection.find({"department": dept_key}, {"_id": 0, "employee_code": 1})
        )
        target_codes = [str(item.get("employee_code")) for item in target_employees if item.get("employee_code")]

        device_deleted = 0
        device_not_found = 0
        if employee_strategy == "delete" and target_codes:
            device_result = ZKService().delete_users_bulk(target_codes)
            failed_codes = [item.get("employee_code") for item in (device_result.get("failed_codes") or [])]
            if failed_codes:
                raise ValueError(
                    "Suppression employee sur device echouee pour: "
                    + ", ".join([code for code in failed_codes if code])
                )
            device_deleted = len(device_result.get("deleted_codes") or [])
            device_not_found = len(device_result.get("not_found_codes") or [])

        config = self.get_config()
        normal_cfg = config.get("normal_config") or {}
        ramadan_cfg = config.get("ramadan_config") or {}
        normal_departments = dict(normal_cfg.get("departments") or {})
        ramadan_departments = dict(ramadan_cfg.get("departments") or {})

        existed = (dept_key in normal_departments) or (dept_key in ramadan_departments)
        if not existed:
            return {
                "deleted": False,
                "department": dept_key,
                "employee_strategy": employee_strategy,
                "employees_affected": 0,
                "reason": "department_not_found",
            }

        normal_departments.pop(dept_key, None)
        ramadan_departments.pop(dept_key, None)

        self.collection.update_one(
            {"key": self.config_key},
            {
                "$set": {
                    "normal_config": {
                        "start_date": normal_cfg.get("start_date"),
                        "end_date": normal_cfg.get("end_date"),
                        "departments": normal_departments,
                    },
                    "ramadan_config": {
                        "start_date": ramadan_cfg.get("start_date"),
                        "end_date": ramadan_cfg.get("end_date"),
                        "departments": ramadan_departments,
                    },
                }
            },
            upsert=True,
        )

        if employee_strategy == "delete":
            employee_result = employees_collection.delete_many({"department": dept_key})
            affected = int(employee_result.deleted_count or 0)
        else:
            employee_result = employees_collection.update_many(
                {"department": dept_key},
                {"$set": {"department": default_department}},
            )
            affected = int(employee_result.modified_count or 0)

        return {
            "deleted": True,
            "department": dept_key,
            "employee_strategy": employee_strategy,
            "employees_affected": affected,
            "default_department": default_department,
            "device_deleted": device_deleted,
            "device_not_found": device_not_found,
        }

    def get_config(self) -> Dict[str, Any]:
        config = self.collection.find_one({"key": self.config_key}, {"_id": 0})
        if config:
            # Lightweight migration for old docs missing normal_config or pause_minutes.
            changed = False
            defaults = self._default_config()

            if "normal_config" not in config:
                config["normal_config"] = defaults["normal_config"]
                changed = True

            if "ramadan_config" not in config:
                config["ramadan_config"] = defaults["ramadan_config"]
                changed = True

            for cfg_name, fallback_pause in [
                ("normal_config", AttendanceConfig.PAUSE_DURATION),
                ("ramadan_config", 0),
            ]:
                cfg = config.get(cfg_name) or {}
                departments = cfg.get("departments") or {}
                updated_departments: Dict[str, Dict[str, Any]] = {}
                for dept_name, dept_cfg in departments.items():
                    if not isinstance(dept_cfg, dict):
                        continue
                    start_time = dept_cfg.get("start_time", "")
                    end_time = dept_cfg.get("end_time", "")
                    pause_minutes = dept_cfg.get("pause_minutes", fallback_pause)
                    updated_departments[dept_name] = {
                        "start_time": start_time,
                        "end_time": end_time,
                        "pause_minutes": int(pause_minutes),
                    }
                for default_name, default_cfg in self._default_departments_config(
                    fallback_pause
                ).items():
                    if default_name not in updated_departments:
                        updated_departments[default_name] = default_cfg
                cfg["departments"] = updated_departments
                config[cfg_name] = cfg
                if departments != updated_departments:
                    changed = True

            if changed:
                self.collection.update_one(
                    {"key": self.config_key},
                    {
                        "$set": {
                            "normal_config": config.get("normal_config"),
                            "ramadan_config": config.get("ramadan_config"),
                        }
                    },
                    upsert=True,
                )
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

    def get_normal_config(self) -> Dict[str, Any]:
        config = self.get_config()
        normal = config.get("normal_config") or {}
        return {
            "start_date": normal.get("start_date"),
            "end_date": normal.get("end_date"),
            "departments": normal.get("departments", {}),
        }

    def update_normal_config(
        self,
        start_date: Optional[date],
        end_date: Optional[date],
        departments: Dict[str, Dict[str, Any]],
    ) -> Dict[str, Any]:
        normalized_departments: Dict[str, Dict[str, Any]] = {}
        for dept_name, cfg in (departments or {}).items():
            dept_key = self.normalize_department_name(dept_name)
            if not dept_key:
                continue
            pause_raw = cfg.get("pause_minutes", AttendanceConfig.PAUSE_DURATION)
            try:
                pause_minutes = max(0, int(pause_raw))
            except (TypeError, ValueError):
                pause_minutes = AttendanceConfig.PAUSE_DURATION
            normalized_departments[dept_key] = {
                "start_time": cfg.get("start_time"),
                "end_time": cfg.get("end_time"),
                "pause_minutes": pause_minutes,
            }

        payload = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "departments": normalized_departments,
        }
        self.collection.update_one(
            {"key": self.config_key},
            {"$set": {"normal_config": payload}},
            upsert=True,
        )
        return self.get_normal_config()

    def update_ramadan_config(
        self,
        start_date: Optional[date],
        end_date: Optional[date],
        departments: Dict[str, Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Persist ramadan configuration.
        - start_date / end_date: python date objects (or None)
        - departments: {"administration": {"start_time": "HH:MM", "end_time": "HH:MM"}, ...}
        """
        payload = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "departments": {
                self.normalize_department_name(k): {
                    "start_time": v.get("start_time"),
                    "end_time": v.get("end_time"),
                    "pause_minutes": 0,
                }
                for k, v in (departments or {}).items()
                if self.normalize_department_name(k)
            },
        }

        self.collection.update_one(
            {"key": self.config_key},
            {"$set": {"ramadan_config": payload}},
            upsert=True,
        )
        return self.get_ramadan_config()

    def _get_config_for_date(
        self,
        target_date: date,
        config_name: str,
        active_when_no_period: bool = True,
    ) -> Optional[Dict[str, Any]]:
        config = self.get_config()
        cfg = config.get(config_name) or {}
        start_date_iso = cfg.get("start_date")
        end_date_iso = cfg.get("end_date")

        if not start_date_iso or not end_date_iso:
            return cfg if active_when_no_period else None

        try:
            start_date_cfg = date.fromisoformat(start_date_iso)
            end_date_cfg = date.fromisoformat(end_date_iso)
        except ValueError:
            return None

        if start_date_cfg <= target_date <= end_date_cfg:
            return cfg
        return None

    def get_department_schedule_for_date(
        self,
        target_date: date,
        department: str,
    ) -> Dict[str, Any]:
        dept_key = self.normalize_department_name(department) or "usine"

        # Ramadan config takes priority if active for target date.
        ramadan_cfg = self._get_config_for_date(
            target_date, "ramadan_config", active_when_no_period=False
        )
        if ramadan_cfg:
            ramadan_departments = ramadan_cfg.get("departments") or {}
            dept_cfg = ramadan_departments.get(dept_key)
            if isinstance(dept_cfg, dict):
                parsed = self._parse_department_schedule(dept_cfg, fallback_pause=0)
                if parsed:
                    return {**parsed, "source": "ramadan"}

        # Otherwise use normal config if available for date.
        normal_cfg = self._get_config_for_date(target_date, "normal_config")
        if normal_cfg:
            normal_departments = normal_cfg.get("departments") or {}
            dept_cfg = normal_departments.get(dept_key)
            if isinstance(dept_cfg, dict):
                parsed = self._parse_department_schedule(
                    dept_cfg, fallback_pause=AttendanceConfig.PAUSE_DURATION
                )
                if parsed:
                    return {**parsed, "source": "normal"}

        # Final fallback from static attendance config.
        default_cfg = AttendanceConfig.get_department_config(dept_key)
        return {
            "start_time": default_cfg["start_time"],
            "end_time": default_cfg["end_time"],
            "pause_minutes": AttendanceConfig.PAUSE_DURATION,
            "source": "default",
        }

    @staticmethod
    def _parse_department_schedule(
        dept_cfg: Dict[str, Any], fallback_pause: int
    ) -> Optional[Dict[str, Any]]:
        start_str = dept_cfg.get("start_time")
        end_str = dept_cfg.get("end_time")
        if not start_str or not end_str:
            return None

        try:
            start_h, start_m = [int(x) for x in str(start_str).split(":")]
            end_h, end_m = [int(x) for x in str(end_str).split(":")]
            pause_raw = dept_cfg.get("pause_minutes", fallback_pause)
            pause_minutes = max(0, int(pause_raw))
        except Exception:
            return None

        return {
            "start_time": dtime(start_h, start_m),
            "end_time": dtime(end_h, end_m),
            "pause_minutes": pause_minutes,
        }
