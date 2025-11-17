"""Helper to build a Windows installer for the desktop launcher.

Requires PyInstaller and (optionally) NSIS to generate an installer from the
single-file executable. Run from repo root:

    python packaging/build_installer.py --version 0.1.0 --with-nsis

The script will produce `dist/haier-project-tracker.exe` and, if NSIS is
available, `dist/HaierProjectTracker-Setup.exe`.
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = REPO_ROOT / "dist"
EXECUTABLE_NAME = "haier-project-tracker"
NSIS_SCRIPT = REPO_ROOT / "packaging" / "installer.nsi"


def run_pyinstaller(version: str) -> Path:
    cmd = [
        "pyinstaller",
        "--noconfirm",
        "--onefile",
        "--name",
        EXECUTABLE_NAME,
        "--add-data",
        "frontend/dist;frontend/dist",
        "desktop.py",
    ]
    env = dict(os.environ)
    env["HPT_VERSION"] = version
    subprocess.run(cmd, check=True, cwd=REPO_ROOT, env=env)
    return DIST_DIR / f"{EXECUTABLE_NAME}.exe"


def run_nsis(executable: Path, version: str) -> Path | None:
    if shutil.which("makensis") is None:
        print("NSIS (makensis) not found; skipping installer generation")
        return None

    output = DIST_DIR / f"HaierProjectTracker-Setup-{version}.exe"
    subprocess.run(
        [
            "makensis",
            f"/DVERSION={version}",
            f"/DAPP_EXE={executable}",
            f"/DOUTPUT={output}",
            str(NSIS_SCRIPT),
        ],
        check=True,
        cwd=REPO_ROOT,
    )
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build desktop installer")
    parser.add_argument("--version", default="0.1.0", help="Version string embedded in artifacts")
    parser.add_argument("--with-nsis", action="store_true", help="Attempt to build an NSIS installer if makensis is available")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    exe = run_pyinstaller(args.version)
    print(f"Built executable: {exe}")
    if args.with_nsis:
        installer = run_nsis(exe, args.version)
        if installer:
            print(f"Built installer: {installer}")


if __name__ == "__main__":
    main()
