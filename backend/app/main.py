# Compatibility shim so `backend.app.main` can be used as an ASGI import path.
# This re-exports the `app` object defined in `backend.main`.
from backend.main import app  # noqa: F401, E402
