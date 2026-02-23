import sys
import os
from datetime import datetime

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils import get_db
from app.security import get_password_hash

def create_admin():
    db = get_db()
    users_collection = db["platform_users"]
    roles_collection = db["roles"]

    # 1. Ensure roles exist
    admin_role = roles_collection.find_one({"name": "admin"})
    if not admin_role:
        print("Creating 'admin' role...")
        roles_collection.insert_one({
            "name": "admin",
            "description": "Administrator with full access",
            "permissions": ["all"]
        })

    simple_user_role = roles_collection.find_one({"name": "simple_user"})
    if not simple_user_role:
        print("Creating 'simple_user' role...")
        roles_collection.insert_one({
            "name": "simple_user",
            "description": "Standard user with limited access",
            "permissions": ["read"]
        })

    # 2. Check if admin user already exists
    admin_user = users_collection.find_one({"username": "admin"})
    if admin_user:
        print("Admin user already exists.")
        return

    # 3. Create admin user
    print("Creating default admin user...")
    admin_data = {
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "System Administrator",
        "role": "admin",
        "is_active": True,
        "hashed_password": get_password_hash("admin123"),
        "created_at": datetime.utcnow()
    }
    
    users_collection.insert_one(admin_data)
    print("Admin user created successfully!")
    print("Username: admin")
    print("Password: admin123")

if __name__ == "__main__":
    create_admin()
