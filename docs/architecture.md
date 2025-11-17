# Haier Project Tracker – Architecture draft

## Goal
Local-first desktop/web hybrid for project, step, and subtask tracking with FastAPI backend and SPA frontend.

## Proposed stack
- **Backend:** FastAPI + SQLAlchemy over SQLite, ready to swap engines via the ORM layer.
- **Frontend:** SPA (React + TypeScript suggested) embedded via desktop shell (e.g., Tauri/pywebview/Electron) that launches the backend and opens the local UI window.
- **Database:** SQLite file inside the workspace folder with migration-friendly schema.

## Data model overview
- **Category** → has many **Project** records.
- **Project** → references **Category** and **PM**; stores lifecycle fields (status, dates, prices, inprogress_coeff), media paths, cover image, and relations to steps, characteristics, attachments.
- **PM** → directory of project owners/assignees.
- **Step** → belongs to a project; carries schedule, status, comments, order, and weight; owns subtasks and attachments.
- **Subtask** → belongs to a step with status, weight, and scheduling fields.
- **ProjectCharacteristic** → parameter/value rows per project for the characteristics window.
- **Attachment** → file references tied to a project or step.

## API scaffolding (current)
- Health check endpoint `/health`.
- CRUD for categories (`/categories`), PM directory (`/pms`), and projects (`/projects`).
- Project status enum `active`/`archived` and task status enum `todo`/`in_progress`/`blocked`/`done` enforced in payloads.
- Bulk helpers for deleting projects/steps/subtasks and batch status update for projects (`/projects/status`).
- Filtering/search for projects (by category, owner, status, and free-text), steps (by status/assignee/search), and subtasks (by status/search).
- Reordering operations for steps and subtasks via order indices.
- CRUD for steps and subtasks with progress calculation (project and step level) per status/weight rules.
- CRUD for project characteristics and attachments.
- Workspace selector persisted в `workspace_config.json` (GET/POST `/workspace`).
- Экспорт категорий/проектов в Excel (`/export/categories/excel`).
- Импорт/экспорт характеристик проекта в JSON/Excel.
- Экспорт проектов в Word (по категории) и презентации категории в PPTX.
- Статическая выдача собранной SPA по `/app` при наличии `frontend/dist`.
- KPI-отчёт `/kpi` по всем или выбранной категории.
- Хостинг обновлений с манифестом версии/ссылки/примечаний и опциональным SHA-256, загрузкой пакета и раздачей файла для desktop-обновлений.

## Next steps
1. Приложением можно пользоваться уже сейчас (локальный backend + SPA или собранный установщик). Перед распространением установщика рекомендуется прогонять `packaging/build_installer.py --workspace <path> --smoke-test` для автоматической генерации manifest.json в workspace/updates и проверки манифеста (при активном backend добавить `--smoke-test-download` для проверки загрузки/хэша).
2. При необходимости запускать `python packaging/test_update_flow.py` вручную для дополнительных сценариев (альтернативные URL/ожидаемые версии) и быстрой проверки доступности скачивания/хэшей.
3. Расширить покрытие автопроверок установки/обновления (PyInstaller + NSIS) по мере появления CI, чтобы формализовать готовность билдов для распространения.
