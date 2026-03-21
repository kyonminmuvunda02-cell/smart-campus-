import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.append(str(backend_dir))

from app.modules.core.security import hash_password

try:
    password = "abc"
    print(f"Testing hashing for: '{password}' (length: {len(password)})")
    hashed = hash_password(password)
    print(f"Successfully hashed: {hashed}")
except Exception as e:
    print(f"FAILED to hash: {e}")
    import traceback
    traceback.print_exc()
