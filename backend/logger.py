import os
import json
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler

# Logs directory inside backend/
LOG_DIR = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'chatbot.log')

# Basic JSON-line logger with rotation
logger = logging.getLogger('chatbot')
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = RotatingFileHandler(LOG_FILE, maxBytes=2 * 1024 * 1024, backupCount=5, encoding='utf-8')
    formatter = logging.Formatter('%(message)s')  # we log pre-formatted JSON strings
    handler.setFormatter(formatter)
    logger.addHandler(handler)


def log_event(event: dict):
    """Write one JSON event line to chatbot log with UTC timestamp."""
    try:
        if 'ts' not in event:
            event['ts'] = datetime.utcnow().isoformat() + 'Z'
        logger.info(json.dumps(event, ensure_ascii=False))
    except Exception:
        # Never crash on logging errors
        pass
