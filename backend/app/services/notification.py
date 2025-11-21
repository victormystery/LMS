import threading
import time
from typing import List

class NotificationManager:
    _instance = None

    def __init__(self):
        self._queue: List[dict] = []
        self._running = False
        self._thread = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = NotificationManager()
        return cls._instance

    def push(self, message: dict):
        self._queue.append(message)

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
                msg = self._queue.pop(0)
                # In production: send email / websocket / push notification
                print("[Notification]", msg)
            time.sleep(1)
