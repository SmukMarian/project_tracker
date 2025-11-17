"""Simple desktop launcher that boots the FastAPI backend and opens the SPA.

Usage::

    python desktop.py [--ui-url http://localhost:5173]

By default the window loads the statically served SPA from the backend
(`http://localhost:8000/app/`) when `frontend/dist` exists; otherwise a custom
UI URL can be provided (e.g., a Vite dev server).
"""

from __future__ import annotations

import argparse
import threading
import time
from dataclasses import dataclass
import logging

import webview
from uvicorn import Config, Server

from backend.config import get_workspace_path
from backend.logging_utils import setup_logging


BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8000


LOGGER = setup_logging(get_workspace_path() / "logs", name="desktop")


@dataclass
class BackendRunner:
    config: Config
    server: Server
    thread: threading.Thread


def start_backend(host: str = BACKEND_HOST, port: int = BACKEND_PORT) -> BackendRunner:
    config = Config("backend.app:app", host=host, port=port, log_level="info")
    server = Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    # Wait for the server to start listening
    while not server.started and not server.should_exit:
        time.sleep(0.1)
    if server.started:
        LOGGER.info("Backend started on http://%s:%s", host, port)
    else:
        LOGGER.warning("Backend failed to start before shutdown signal")
    return BackendRunner(config=config, server=server, thread=thread)


def stop_backend(runner: BackendRunner) -> None:
    runner.server.should_exit = True
    runner.thread.join(timeout=5)
    LOGGER.info("Backend stopped")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Desktop launcher for the Project Tracker UI")
    parser.add_argument(
        "--ui-url",
        dest="ui_url",
        default=f"http://{BACKEND_HOST}:{BACKEND_PORT}/app/",
        help="URL to load in the desktop window (defaults to statically served SPA)",
    )
    parser.add_argument(
        "--no-backend",
        dest="no_backend",
        action="store_true",
        help="Do not start the bundled backend (use external server)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    runner: BackendRunner | None = None

    if not args.no_backend:
        LOGGER.info("Starting bundled backend")
        runner = start_backend()

    def on_closed() -> None:
        if runner:
            stop_backend(runner)

    LOGGER.info("Opening desktop window at %s", args.ui_url)
    webview.create_window("Haier Project Tracker", args.ui_url, width=1280, height=800)
    webview.start(gui="qt", shutdown=on_closed)


if __name__ == "__main__":
    main()
