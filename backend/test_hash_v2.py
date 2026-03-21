from passlib.context import CryptContext
import bcrypt

try:
    print(f"Bcrypt version: {bcrypt.__version__}")
    ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password = "abc"
    print(f"Hashing '{password}' directly with passlib...")
    h = ctx.hash(password)
    print(f"Success: {h}")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
