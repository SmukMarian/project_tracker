import json
from pathlib import Path
from typing import Optional


_BASE_DIR = Path(__file__).resolve().parent.parent
_CONFIG_PATH = _BASE_DIR / "workspace_config.json"
_DEFAULT_WORKSPACE = _BASE_DIR / "workspace"


def _read_config() -> dict:
    if _CONFIG_PATH.exists():
        try:
            return json.loads(_CONFIG_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}
    return {}


def _write_config(data: dict) -> None:
    _CONFIG_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def get_workspace_path() -> Path:
    config = _read_config()
    raw_path: Optional[str] = config.get("workspace_path")
    path = Path(raw_path) if raw_path else _DEFAULT_WORKSPACE
    path.mkdir(parents=True, exist_ok=True)
    return path


def set_workspace_path(path_str: str) -> Path:
    path = Path(path_str).expanduser().resolve()
    path.mkdir(parents=True, exist_ok=True)
    _write_config({"workspace_path": str(path)})
    return path

