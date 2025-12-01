import threading
import time
from typing import List

class NotificationManager:
    _instance = None

    def __init__(self):
        self._queue: List[dict] = []
        self._store: List[dict] = []
        self._next_id = 1
        self._lock = threading.Lock()
        # subscribers: user_id -> list of {'cond': Condition, 'items': list}
        self._subs = {}
        self._running = False
        self._thread = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = NotificationManager()
        return cls._instance

    def push(self, message: dict):
        with self._lock:
            # assign an id and timestamp
            nid = self._next_id
            self._next_id += 1
            item = dict(message)
            item["id"] = nid
            item["read"] = False
            item["ts"] = time.time()
            self._queue.append(item)
            # persist in-memory store for API access
            self._store.append(item)
            # notify subscribers for the user
            try:
                uid = item.get("user_id")
                if uid and uid in self._subs:
                    for sub in list(self._subs.get(uid, [])):
                        with sub["cond"]:
                            sub["items"].append(item)
                            sub["cond"].notify()
            except Exception:
                pass

    def start_worker(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._worker, daemon=True)
        self._thread.start()

    def stop_worker(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=1)

    def _worker(self):
        while self._running:
            if self._queue:
                with self._lock:
                    msg = self._queue.pop(0)
                # In production: send email / websocket / push notification
                # For now we print a human-friendly message
                try:
                    t = msg.get("type")
                    if t == "book_available":
                        user = msg.get("username") or f"user_id={msg.get('user_id')}"
                        book = msg.get("book_title") or f"book_id={msg.get('book_id')}"
                        print(f"[Notification] Book available -> {book} for {user}")
                    else:
                        print("[Notification]", msg)
                except Exception:
                    print("[Notification]", msg)
            time.sleep(1)

    # API helpers
    def get_notifications_for_user(self, user_id: int):
        with self._lock:
            return [n for n in self._store if n.get("user_id") == user_id and not n.get("read")]

    def mark_read(self, notification_id: int):
        with self._lock:
            for n in self._store:
                if n.get("id") == notification_id:
                    n["read"] = True
                    return True
        return False

    # Subscription API for server-sent events / streaming
    def subscribe(self, user_id: int):
        cond = threading.Condition()
        sub = {"cond": cond, "items": []}
        with self._lock:
            self._subs.setdefault(user_id, []).append(sub)
        return sub

    def unsubscribe(self, user_id: int, sub):
        with self._lock:
            lst = self._subs.get(user_id)
            if not lst:
                return
            try:
                lst.remove(sub)
            except ValueError:
                pass
            if not lst:
                self._subs.pop(user_id, None)
