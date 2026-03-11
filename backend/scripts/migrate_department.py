import os
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))

from app import utils

def migrate_departments():
    db = utils.get_db()
    employees_collection = db["employees"]
    
    # Update all employees with department "employee" to "usine"
    result = employees_collection.update_many(
        {"department": "employee"},
        {"$set": {"department": "usine"}}
    )
    
    print(f"Migration complete!")
    print(f"Matched: {result.matched_count}")
    print(f"Modified: {result.modified_count}")

    # Also update any attendance_day_rules if they have "employee" department
    rules_collection = db["attendance_day_rules"]
    rules = rules_collection.find_one({"key": "default"})
    if rules:
        changed = False
        for cfg_type in ["normal_config", "ramadan_config"]:
            if cfg_type in rules and "departments" in rules[cfg_type]:
                depts = rules[cfg_type]["departments"]
                if "employee" in depts:
                    depts["usine"] = depts.pop("employee")
                    changed = True
        
        if changed:
            rules_collection.update_one(
                {"key": "default"},
                {"$set": {
                    "normal_config": rules["normal_config"],
                    "ramadan_config": rules["ramadan_config"]
                }}
            )
            print("Updated attendance_day_rules department keys.")

if __name__ == "__main__":
    migrate_departments()
