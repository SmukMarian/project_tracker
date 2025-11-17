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
APP_VERSION = os.environ.get("HPT_VERSION", "0.1.0")
UPDATE_TIMEOUT = 3


LOGGER = setup_logging(get_workspace_path() / "logs", name="desktop")


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
    parser.add_argument(
        "--update-url",
        dest="update_url",
        default=os.environ.get("HPT_UPDATE_URL"),
        help=(
            "Manifest URL for update checks (JSON with 'version' and optional 'download_url'); "
            "skipped when not provided"
        ),
    )
    parser.add_argument(
        "--auto-open-download",
        dest="auto_open_download",
        action="store_true",
        help="Open the download URL in the default browser when a newer version is found",
    )
    return parser.parse_args()


def check_for_update(manifest_url: str | None) -> dict | None:
    if not manifest_url:
        return None
    try:
        with urlopen(manifest_url, timeout=UPDATE_TIMEOUT) as response:
            manifest = json.loads(response.read().decode("utf-8"))
    except (URLError, OSError, json.JSONDecodeError) as exc:
        LOGGER.warning("Update check failed for %s: %s", manifest_url, exc)
        return None

    raw_version = manifest.get("version")
    if not raw_version:
        LOGGER.warning("Update manifest missing version: %s", manifest)
        return None

    try:
        remote_version = Version(str(raw_version))
        current_version = Version(APP_VERSION)
    except InvalidVersion as exc:
        LOGGER.warning("Invalid version strings during update check: %s", exc)
        return None

    if remote_version > current_version:
        LOGGER.info("Update available: %s -> %s", current_version, remote_version)
        return manifest

    LOGGER.info("No updates found (current %s)", current_version)
    return None


def maybe_open_download(manifest: dict | None, auto_open: bool) -> None:
    if not manifest:
        return
    download_url = manifest.get("download_url")
    if not download_url:
        LOGGER.info("Update manifest lacks download_url; skipping auto-open")
        return
    if auto_open:
        LOGGER.info("Opening update download URL: %s", download_url)
        webbrowser.open(download_url)
    else:
        LOGGER.info("New version available at %s", download_url)


def main() -> None:
    args = parse_args()
    runner: BackendRunner | None = None

    manifest = check_for_update(args.update_url)
    maybe_open_download(manifest, args.auto_open_download)

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
