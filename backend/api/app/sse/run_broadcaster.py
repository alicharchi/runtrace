import asyncio
import json
from dataclasses import dataclass
from typing import Set


@dataclass(frozen=True)
class Subscriber:
    user_id: int
    is_superuser: bool
    queue: asyncio.Queue

class RunBroadcaster:
    def __init__(self):
        self._subscribers: Set[Subscriber] = set()

    async def subscribe(self, user):
        queue = asyncio.Queue()
        subscriber = Subscriber(
            user_id=user.id,
            is_superuser=user.is_superuser,
            queue=queue,
        )
        self._subscribers.add(subscriber)

        try:
            while True:
                payload = await queue.get()
                yield f"data: {json.dumps(payload)}\n\n"
        finally:
            self._subscribers.remove(subscriber)

    def publish(self, run_id: int, owner_id: int, payload: dict):
        for sub in list(self._subscribers):
            if sub.is_superuser or sub.user_id == owner_id:
                sub.queue.put_nowait(payload)


run_broadcaster = RunBroadcaster()
