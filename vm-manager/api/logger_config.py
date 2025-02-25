import os
import logging
import logging.handlers
from datetime import datetime


# Configure logging
def setup_logging():
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Clear old logs on startup
    for old_log in os.listdir(log_dir):
        if old_log.endswith(".log"):
            try:
                os.remove(os.path.join(log_dir, old_log))
            except Exception as e:
                print(f"Failed to remove old log file: {e}")
                pass

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"api_{timestamp}.log")

    # Configure logging
    logger = logging.getLogger("vm_manager")
    logger.setLevel(logging.INFO)

    # Clear any existing handlers
    if logger.handlers:
        logger.handlers.clear()

    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        log_file, maxBytes=10 * 1024 * 1024, backupCount=5
    )
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    )
    logger.addHandler(file_handler)

    # Also log to console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    )
    logger.addHandler(console_handler)

    return logger


# Create a global logger instance
logger = setup_logging()
