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
- Filtering/search for projects (by category, owner, status, and free-text), steps (by status/assignee/search), and subtasks (by status/search).
- Reordering operations for steps and subtasks via order indices.
- CRUD for steps and subtasks with progress calculation (project and step level) per status/weight rules.
- CRUD for project characteristics and attachments.

## Next steps
1. Add bulk operations (delete/archive), tokenized search, and status validation aligned with the UX shortcuts.
2. Design React SPA layout matching the desktop-style UI (menu, left navigation, right workspace panels).
3. Add export/import utilities (Excel/Word/JSON) and media handling.
4. Package desktop wrapper that launches FastAPI and opens the SPA, ensuring clean shutdown.
