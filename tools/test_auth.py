import json
import os
import sys
from fastapi.testclient import TestClient

# Ensure repository root is on sys.path so imports like `backend.app` resolve
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

try:
    # try the asgi wrapper first
    from asgi import app
except Exception:
    try:
        from backend.app.main import app
    except Exception as e:
        print('Failed to import app:', e)
        raise


client = TestClient(app)

reg_payload = {"username": "test+copilot@example.com", "full_name": "Copilot Test User", "password": "testpass"}
print('REGISTER ->', reg_payload)
resp = client.post('/api/auth/register', json=reg_payload)
print('status', resp.status_code)
try:
    print(json.dumps(resp.json(), indent=2))
except Exception:
    print(resp.text)

login_payload = {"username": "test+copilot@example.com", "password": "testpass"}
print('\nLOGIN ->', login_payload)
resp = client.post('/api/auth/login', json=login_payload)
print('status', resp.status_code)
try:
    print(json.dumps(resp.json(), indent=2))
except Exception:
    print(resp.text)
