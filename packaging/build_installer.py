"""Helper to build a Windows installer for the desktop launcher.

Requires PyInstaller and (optionally) NSIS to generate an installer from the
single-file executable. Run from repo root:

    python packaging/build_installer.py --version 0.1.0 --with-nsis

The script will produce `dist/haier-project-tracker.exe` and, if NSIS is
available, `dist/HaierProjectTracker-Setup.exe`.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import hashlib

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = REPO_ROOT / "dist"
EXECUTABLE_NAME = "haier-project-tracker"
NSIS_SCRIPT = REPO_ROOT / "packaging" / "installer.nsi"
DEFAULT_DOWNLOAD_BASE = "http://127.0.0.1:8000/updates/download"


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
    parser.add_argument(
        "--workspace",
        type=Path,
        help="Optional workspace path; if set, copies artifacts into workspace/updates/ and writes a manifest.json",
    )
    parser.add_argument(
        "--download-base",
        default=DEFAULT_DOWNLOAD_BASE,
        help=(
            "Base URL for download links in manifest (default: http://127.0.0.1:8000/updates/download). "
            "The filename is appended automatically."
        ),
    )
    parser.add_argument(
        "--notes",
        help="Optional release notes string to embed into manifest.json",
    )
    parser.add_argument(
        "--smoke-test",
        action="store_true",
        help="Validate the generated manifest with packaging/test_update_flow.py after packaging",
    )
    parser.add_argument(
        "--smoke-test-download",
        action="store_true",
        help="When used with --smoke-test, also download the package referenced in the manifest",
    )
    parser.add_argument(
        "--smoke-test-url",
        help="Override manifest URL for smoke test; defaults to the generated manifest file URI when --workspace is set",
    )
    return parser.parse_args()


def compute_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def write_manifest(workspace: Path, filename: str, version: str, download_base: str, sha256: str, notes: str | None) -> Path:
    updates_dir = workspace / "updates"
    updates_dir.mkdir(parents=True, exist_ok=True)
    download_url = f"{download_base.rstrip('/')}/{filename}"
    manifest = {
        "version": version,
        "download_url": download_url,
        "sha256": sha256,
    }
    if notes:
        manifest["notes"] = notes
    manifest_path = updates_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote manifest to {manifest_path}")
    return manifest_path


def run_smoke_test(manifest_url: str, version: str, expected_sha: str | None, download: bool) -> None:
    script = REPO_ROOT / "packaging" / "test_update_flow.py"
    cmd = [
        sys.executable,
        str(script),
        "--manifest-url",
        manifest_url,
        "--expected-version",
        version,
    ]
    if expected_sha:
        cmd.extend(["--expected-sha256", expected_sha])
    if not download:
        cmd.append("--no-download")
    print(f"Running smoke test: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)


def main() -> None:
    args = parse_args()
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    exe = run_pyinstaller(args.version)
    print(f"Built executable: {exe}")
    installer: Path | None = None
    sha_values = {exe.name: compute_sha256(exe)}
    print(f"SHA256({exe.name})={sha_values[exe.name]}")
    if args.with_nsis:
        installer = run_nsis(exe, args.version)
        if installer:
            print(f"Built installer: {installer}")
            sha_values[installer.name] = compute_sha256(installer)
            print(f"SHA256({installer.name})={sha_values[installer.name]}")

    manifest_path: Path | None = None
    if args.workspace:
        updates_dir = args.workspace / "updates"
        updates_dir.mkdir(parents=True, exist_ok=True)
        artifacts = [exe]
        if installer:
            artifacts.append(installer)
        for artifact in artifacts:
            target = updates_dir / artifact.name
            shutil.copy2(artifact, target)
            print(f"Copied {artifact.name} to {target}")

        # Prefer NSIS installer for manifest if present, otherwise the one-file exe.
        manifest_target = installer or exe
        manifest_sha = sha_values.get(manifest_target.name)
        manifest_path = write_manifest(
            args.workspace, manifest_target.name, args.version, args.download_base, manifest_sha, args.notes
        )

    if args.smoke_test:
        if not manifest_path:
            raise SystemExit("--smoke-test requires --workspace to locate the generated manifest")
        manifest_url = args.smoke_test_url or manifest_path.as_uri()
        run_smoke_test(
            manifest_url,
            args.version,
            sha_values.get((installer or exe).name),
            download=args.smoke_test_download,
        )


if __name__ == "__main__":
    main()
