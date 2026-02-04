import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime

def setup_logging(appName:str,logDir=Path("/app/data")):
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    logFile = logDir / f"{appName}logs_{datetime.now():%Y%m%d_%H%M%S}.log"
    handler = RotatingFileHandler(
        filename=str(logFile),
        maxBytes=10 * 1024 * 1024,  
        backupCount=5,              
        encoding="utf-8",
    )

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s: %(message)s"
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)
