import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional


_DEFAULT_FORMAT = "%(asctime)s [%(levelname)s] %(name)s - %(message)s"


def _find_file_handler(logger: logging.Logger, path: Path) -> Optional[RotatingFileHandler]:
    for handler in logger.handlers:
        if isinstance(handler, RotatingFileHandler) and Path(handler.baseFilename) == path:
            return handler
    return None


def setup_logging(log_dir: Path, *, name: str = "project_tracker", level: int = logging.INFO) -> logging.Logger:
    log_dir.mkdir(parents=True, exist_ok=True)
    logfile = log_dir / f"{name}.log"

    logger = logging.getLogger(name)
    logger.setLevel(level)

    existing = _find_file_handler(logger, logfile)
    if not existing:
        handler = RotatingFileHandler(logfile, maxBytes=2 * 1024 * 1024, backupCount=3, encoding="utf-8")
        handler.setFormatter(logging.Formatter(_DEFAULT_FORMAT))
        logger.addHandler(handler)
    logger.propagate = True
    return logger
