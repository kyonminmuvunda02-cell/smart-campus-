import bcrypt

try:
    print(f"Bcrypt version: {bcrypt.__version__}")
    password = "abc".encode('utf-8')
    salt = bcrypt.gensalt()
    print(f"Hashing '{password}' directly with bcrypt...")
    hashed = bcrypt.hashpw(password, salt)
    print(f"Success: {hashed}")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
