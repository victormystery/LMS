import os
import sys

# Ensure the 'backend' directory is on sys.path so the internal 'app' package
# (located at backend/app) can be imported when running from the project root.
ROOT = os.path.dirname(__file__)
BACKEND_PATH = os.path.join(ROOT, "backend")
if BACKEND_PATH not in sys.path:
    sys.path.insert(0, BACKEND_PATH)

from backend.main import app  # noqa: E402
