import sys
import os
from datetime import datetime

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils import get_db
from app.security import get_password_hash


def create_simple_user():
    db = get_db()
    users_collection = db["platform_users"]
    roles_collection = db["roles"]

    # 1. Ensure simple_user role exists
    simple_user_role = roles_collection.find_one({"name": "simple_user"})
    if not simple_user_role:
        print("Creating 'simple_user' role...")
        roles_collection.insert_one({
            "name": "simple_user",
            "description": "Standard user with limited access",
            "permissions": ["read"]
        })

    # 2. Check if simple user already exists
    simple_user = users_collection.find_one({"username": "user"})
    if simple_user:
        print("Simple user already exists.")
        return

    # 3. Create simple user
    print("Creating default simple user...")
    user_data = {
        "username": "user",
        "email": "user@example.com",
        "full_name": "Simple User",
        "role": "simple_user",
        "is_active": True,
        "hashed_password": get_password_hash("user123"),
        "created_at": datetime.utcnow()
    }

    users_collection.insert_one(user_data)

    print("Simple user created successfully!")
    print("Username: user")
    print("Password: user123")


if __name__ == "__main__":
    create_simple_user()