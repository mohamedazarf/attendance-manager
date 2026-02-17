from zk import ZK

DEVICE_IP = '192.168.100.5'
DEVICE_PORT = 4370

def connect():
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=5)
    conn = zk.connect()
    return conn

def list_users():
    """List all users on the device"""
    conn = connect()
    users = conn.get_users()
    print(f"\n👥 Found {len(users)} users on device:\n")
    print(f"{'UID':<8} {'User ID':<12} {'Name':<30} {'Privilege':<12}")
    print("=" * 65)
    for user in sorted(users, key=lambda u: u.uid):
        priv = {0: "User", 14: "Admin"}.get(user.privilege, f"Level {user.privilege}")
        print(f"{user.uid:<8} {user.user_id:<12} {user.name:<30} {priv:<12}")
    conn.disconnect()
    return users

def create_user(uid, name, user_id=None, privilege=0, password=''):
    """
    Create a new user on the device.
    uid: unique integer ID on the device (e.g., 99)
    name: display name (e.g., "Test User")
    user_id: string ID (defaults to str(uid))
    privilege: 0=User, 14=Admin
    """
    if user_id is None:
        user_id = str(uid)
    
    conn = connect()
    conn.set_user(uid=uid, name=name, privilege=privilege, password=password, user_id=user_id)
    print(f"\n✅ User created on device:")
    print(f"   UID: {uid}")
    print(f"   Name: {name}")
    print(f"   User ID: {user_id}")
    conn.disconnect()

def delete_user(uid):
    """Delete a user from the device by UID"""
    conn = connect()
    conn.delete_user(uid=uid)
    print(f"\n🗑️ User with UID {uid} deleted from device")
    conn.disconnect()

def check_fingerprints(uid=None):
    """Check if a user has fingerprints enrolled on the device"""
    conn = connect()
    users = conn.get_users()
    templates = conn.get_templates()
    
    if uid is not None:
        user = next((u for u in users if u.uid == uid), None)
        if user is None:
            print(f"\n❌ No user with UID {uid} found on device")
            conn.disconnect()
            return
        user_templates = [t for t in templates if t.uid == uid]
        if user_templates:
            print(f"\n✅ {user.name} (UID: {uid}) has {len(user_templates)} fingerprint(s) enrolled")
        else:
            print(f"\n❌ {user.name} (UID: {uid}) has NO fingerprints enrolled")
    else:
        print(f"\n👆 Fingerprint status for all users:\n")
        print(f"{'UID':<8} {'Name':<30} {'Fingerprints':<15}")
        print("=" * 55)
        for user in sorted(users, key=lambda u: u.uid):
            count = len([t for t in templates if t.uid == user.uid])
            status = f"✅ {count} enrolled" if count > 0 else "❌ None"
            print(f"{user.uid:<8} {user.name:<30} {status:<15}")
    
    conn.disconnect()

def enroll_fingerprint(uid):
    """
    Enroll a fingerprint for an existing user.
    The device will prompt the user to place their finger (usually 3 times).
    """
    conn = connect()
    
    # Verify user exists first
    users = conn.get_users()
    user = next((u for u in users if u.uid == uid), None)
    
    if user is None:
        print(f"\n❌ No user with UID {uid} found on device. Create the user first.")
        conn.disconnect()
        return False
    
    print(f"\n👆 Starting fingerprint enrollment for: {user.name} (UID: {uid})")
    print("   📌 The device will now enter enrollment mode.")
    print("   📌 Ask the person to place their finger on the scanner.")
    print("   📌 They need to place it 3 times when the device prompts.")
    print("   ⏳ Waiting for fingerprint scan...\n")
    
    try:
        conn.enroll_user(uid=uid)
        print(f"\n✅ Fingerprint enrolled successfully for {user.name}!")
        
        # Verify by checking templates
        templates = conn.get_templates()
        user_templates = [t for t in templates if t.uid == uid]
        if user_templates:
            print(f"   🔍 Verified: {len(user_templates)} fingerprint template(s) found")
        
        conn.disconnect()
        return True
    except Exception as e:
        print(f"\n❌ Enrollment failed: {e}")
        conn.disconnect()
        return False

def update_employee_name(uid, new_name):
    conn = connect()

    try:
        users = conn.get_users()
        user = next((u for u in users if u.uid == uid), None)

        if user is None:
            print(f"\n❌ No user with UID {uid} found on device")
            return False

        old_name = user.name

        # Just update user info
        conn.set_user(
            uid=uid,
            name=new_name,
            privilege=user.privilege,
            password='',  # or keep if you store it
            group_id='',
            user_id=user.user_id
        )

        print(f"\n✅ Successfully updated name from '{old_name}' to '{new_name}'")
        return True

    except Exception as e:
        print(f"\n❌ Failed to update employee name: {e}")
        return False

    finally:
        conn.disconnect()


if __name__ == "__main__":
    print("🔧 ZKTeco Device User Management")
    print("=" * 40)
    
    while True:
        print("\n1. 📋 List all users")
        print("2. ➕ Create test user")
        print("3. 🗑️ Delete user by UID")
        print("4. 👆 Enroll fingerprint")
        print("5.  Check fingerprints")
        print("6. ✏️ Update employee name")
        print("7. 🚪 Exit")
        choice = input("\n👉 Choice: ").strip()
        
        if choice == "1":
            list_users()
        
        elif choice == "2":
            uid = int(input("   Enter UID (integer, e.g. 99): "))
            name = input("   Enter name: ")
            create_user(uid=uid, name=name)
            print("\n🔍 Verifying... listing all users:")
            list_users()
        
        elif choice == "3":
            uid = int(input("   Enter UID to delete: "))
            confirm = input(f"   ⚠️ Delete user UID={uid}? (y/n): ")
            if confirm.lower() == 'y':
                delete_user(uid=uid)
                print("\n🔍 Verifying... listing all users:")
                list_users()
        
        elif choice == "4":
            uid = int(input("   Enter UID to enroll fingerprint for: "))
            enroll_fingerprint(uid)
        
        elif choice == "5":
            uid_input = input("   Enter UID (or press Enter to check ALL users): ").strip()
            if uid_input:
                check_fingerprints(int(uid_input))
            else:
                check_fingerprints()
        
        elif choice == "6":
            uid = int(input("   Enter UID to update: "))
            new_name = input("   Enter new name: ")
            update_employee_name(uid=uid, new_name=new_name)
            print("\n🔍 Verifying... listing all users:")
            list_users()
        
        elif choice == "7":
            print("👋 Bye!")
            break
