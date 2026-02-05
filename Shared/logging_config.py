import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime

def setup_logging(appName: str, **kwargs):
    root = logging.getLogger()

    logDir = kwargs.get("dir", Path("/app/data"))
    level = kwargs.get("level", logging.INFO)

    root.setLevel(level)

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s: %(message)s"
    )
    
    file_handler = RotatingFileHandler(
        filename=str(
            logDir / f"{appName}_logs_{datetime.now():%Y%m%d_%H%M%S}.log"
        ),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(level)
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(level)

    root.handlers.clear()
    root.addHandler(file_handler)
    root.addHandler(console_handler)

