import argparse
import json
import os
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict

import hashlib


def load_json(url: str, timeout: float = 10.0) -> Dict[str, Any]:
    with urllib.request.urlopen(url, timeout=timeout) as resp:  # nosec: B310 - trusted local endpoint
        content_type = resp.headers.get("Content-Type", "")
        data = resp.read().decode("utf-8")
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Failed to parse JSON from {url}: {exc}") from exc
    if "application/json" not in content_type and not content_type.startswith("application/json"):
        print(f"[warn] Content-Type is '{content_type}', expected application/json")
    return parsed


def validate_manifest(manifest: Dict[str, Any]) -> None:
    missing = [field for field in ("version", "download_url") if field not in manifest]
    if missing:
        raise ValueError(f"Manifest missing required fields: {', '.join(missing)}")
    if not isinstance(manifest.get("version"), str):
        raise ValueError("Manifest 'version' must be a string")
    if not isinstance(manifest.get("download_url"), str):
        raise ValueError("Manifest 'download_url' must be a string URL")
    if "notes" in manifest and not isinstance(manifest["notes"], (str, list)):
        raise ValueError("Manifest 'notes' must be a string or list of strings if present")
    if "sha256" in manifest:
        sha = manifest["sha256"]
        if sha is not None and (
            not isinstance(sha, str)
            or len(sha) != 64
            or any(c not in "0123456789abcdefABCDEF" for c in sha)
        ):
            raise ValueError("Manifest 'sha256' must be a 64-char hex string if present")


def download_file(url: str, destination: Path, timeout: float = 30.0) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=timeout) as resp:  # nosec: B310 - trusted local endpoint
        chunk = resp.read()
    destination.write_bytes(chunk)
    if destination.stat().st_size == 0:
        raise ValueError("Downloaded file is empty")
    return destination


def compute_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Smoke-test the update hosting endpoints by validating the manifest and optionally "
            "downloading the referenced installer package."
        )
    )
    parser.add_argument(
        "--manifest-url",
        default="http://127.0.0.1:8000/updates/manifest",
        help="Full URL of the manifest endpoint (default: http://127.0.0.1:8000/updates/manifest)",
    )
    parser.add_argument(
        "--expected-version",
        help="If provided, the manifest version must match this value.",
    )
    parser.add_argument(
        "--expected-sha256",
        help="If provided, the downloaded package hash must match this value (or manifest sha256 if set).",
    )
    parser.add_argument(
        "--download/--no-download",
        dest="download",
        default=True,
        help="Whether to download the package referenced in the manifest.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Directory to store the downloaded package (default: temp dir).",
    )
    args = parser.parse_args()

    try:
        manifest = load_json(args.manifest_url)
        validate_manifest(manifest)
    except Exception as exc:  # pragma: no cover - CLI guardrail
        print(f"[error] Manifest validation failed: {exc}")
        return 1

    version = manifest.get("version")
    download_url = manifest.get("download_url")
    notes = manifest.get("notes")
    manifest_sha = manifest.get("sha256")

    print(f"[ok] Manifest loaded: version={version}, download_url={download_url}")
    if notes:
        print(f"[info] Release notes: {notes}")

    if args.expected_version and args.expected_version != version:
        print(f"[error] Expected version {args.expected_version}, got {version}")
        return 1

    if not args.download:
        return 0

    try:
        parsed = urllib.parse.urlparse(download_url)
        filename = os.path.basename(parsed.path) or "update-package.bin"
        target_dir = args.output_dir or Path(tempfile.mkdtemp(prefix="update-package-"))
        target_path = Path(target_dir) / filename
        downloaded = download_file(download_url, target_path)
        print(f"[ok] Downloaded package to {downloaded} ({downloaded.stat().st_size} bytes)")
        sha256 = compute_sha256(downloaded)
        expected_sha = args.expected_sha256 or manifest_sha
        if expected_sha:
            if sha256.lower() != expected_sha.lower():
                print(
                    f"[error] SHA mismatch: expected {expected_sha}, got {sha256}",
                )
                return 1
            print(f"[ok] SHA verified: {sha256}")
        else:
            print(f"[info] SHA256={sha256} (no expected value provided)")
    except Exception as exc:  # pragma: no cover - CLI guardrail
        print(f"[error] Download failed: {exc}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
