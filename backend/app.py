from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from . import models, schemas
from .database import Base, SessionLocal, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Haier Project Tracker API")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def healthcheck():
    return {"status": "ok"}


def _status_value(status: str, inprogress_coeff: float) -> float:
    mapping = {
        "done": 1.0,
        "in_progress": inprogress_coeff,
    }
    return mapping.get(status, 0.0)


def _compute_step_progress(step: models.Step, inprogress_coeff: float) -> int:
    if step.subtasks:
        total_weight = sum(subtask.weight for subtask in step.subtasks)
        if total_weight == 0:
            return 0
        value = sum(
            _status_value(subtask.status, inprogress_coeff) * subtask.weight
            for subtask in step.subtasks
        )
        return round((value / total_weight) * 100)
    return round(_status_value(step.status, inprogress_coeff) * 100)


def _apply_progress(project: models.Project) -> models.Project:
    step_progresses: list[int] = []
    for step in project.steps:
        step.progress_percent = _compute_step_progress(step, project.inprogress_coeff)
        step_progresses.append(step.progress_percent)
    project.progress_percent = round(sum(step_progresses) / len(step_progresses)) if step_progresses else 0
    return project


def _load_project_with_steps(project_id: int, db: Session) -> models.Project:
    project = (
        db.query(models.Project)
        .options(joinedload(models.Project.steps).joinedload(models.Step.subtasks))
        .filter(models.Project.id == project_id)
        .first()
    )
    if project:
        _apply_progress(project)
    return project


@app.post("/categories", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@app.get("/categories", response_model=list[schemas.Category])
def list_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@app.post("/pms", response_model=schemas.PM)
def create_pm(pm: schemas.PMCreate, db: Session = Depends(get_db)):
    existing = db.query(models.PM).filter(models.PM.name == pm.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="PM already exists")
    db_pm = models.PM(name=pm.name)
    db.add(db_pm)
    db.commit()
    db.refresh(db_pm)
    return db_pm


@app.get("/pms", response_model=list[schemas.PM])
def list_pms(db: Session = Depends(get_db)):
    return db.query(models.PM).all()


@app.post("/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    db.refresh(db_project, attribute_names=["steps", "characteristics", "attachments"])
    return _apply_progress(db_project)


@app.post("/projects/status", response_model=list[schemas.Project])
def bulk_update_project_status(
    payload: schemas.BulkProjectStatusUpdate, db: Session = Depends(get_db)
):
    projects = (
        db.query(models.Project)
        .options(
            joinedload(models.Project.steps).joinedload(models.Step.subtasks),
            joinedload(models.Project.characteristics),
            joinedload(models.Project.attachments),
        )
        .filter(models.Project.id.in_(payload.ids))
        .all()
    )
    if not projects:
        raise HTTPException(status_code=404, detail="No matching projects found")
    for project in projects:
        project.status = payload.status.value
    db.commit()
    for project in projects:
        db.refresh(project)
    return [_apply_progress(project) for project in projects]


@app.patch("/projects/{project_id}", response_model=schemas.Project)
def update_project(project_id: int, update: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    db.refresh(project, attribute_names=["steps", "characteristics", "attachments"])
    return _apply_progress(project)


@app.get("/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = (
        db.query(models.Project)
        .options(
            joinedload(models.Project.steps).joinedload(models.Step.subtasks),
            joinedload(models.Project.characteristics),
            joinedload(models.Project.attachments),
        )
        .filter(models.Project.id == project_id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return _apply_progress(project)


@app.get("/projects", response_model=list[schemas.Project])
def list_projects(
    category_id: Optional[int] = None,
    owner_id: Optional[int] = None,
    status: Optional[schemas.ProjectStatus] = None,
    search: Optional[str] = Query(None, description="Search by name, code, or status"),
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Project)
        .options(
            joinedload(models.Project.steps).joinedload(models.Step.subtasks),
            joinedload(models.Project.characteristics),
            joinedload(models.Project.attachments),
        )
        .order_by(models.Project.id)
    )

    if category_id is not None:
        query = query.filter(models.Project.category_id == category_id)
    if owner_id is not None:
        query = query.filter(models.Project.owner_id == owner_id)
    if status is not None:
        query = query.filter(models.Project.status == status.value)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                models.Project.name.ilike(like),
                models.Project.code.ilike(like),
                models.Project.status.ilike(like),
            )
        )

    projects = query.all()
    return [_apply_progress(project) for project in projects]


@app.post("/projects/bulk-delete", status_code=204)
def bulk_delete_projects(payload: schemas.BulkDeleteRequest, db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.id.in_(payload.ids)).all()
    if not projects:
        raise HTTPException(status_code=404, detail="No matching projects found")
    for project in projects:
        db.delete(project)
    db.commit()


@app.get("/projects/{project_id}/steps", response_model=list[schemas.Step])
def list_steps(
    project_id: int,
    status: Optional[schemas.TaskStatus] = None,
    assignee_id: Optional[int] = None,
    search: Optional[str] = Query(None, description="Search by name or description"),
    db: Session = Depends(get_db),
):
    steps = (
        db.query(models.Step)
        .options(joinedload(models.Step.subtasks))
        .filter(models.Step.project_id == project_id)
        .order_by(models.Step.order_index, models.Step.id)
    )
    if status:
        steps = steps.filter(models.Step.status == status.value)
    if assignee_id:
        steps = steps.filter(models.Step.assignee_id == assignee_id)
    if search:
        like = f"%{search}%"
        steps = steps.filter(or_(models.Step.name.ilike(like), models.Step.description.ilike(like)))

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    step_rows = steps.all()
    for step in step_rows:
        step.progress_percent = _compute_step_progress(step, project.inprogress_coeff)
    return step_rows


@app.post("/steps", response_model=schemas.Step)
def create_step(step: schemas.StepCreate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == step.project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db_step = models.Step(**step.dict())
    db.add(db_step)
    db.commit()
    db.refresh(db_step)
    db.refresh(db_step, attribute_names=["subtasks"])
    db_step.progress_percent = _compute_step_progress(db_step, project.inprogress_coeff)
    return db_step


@app.patch("/steps/{step_id}", response_model=schemas.Step)
def update_step(step_id: int, update: schemas.StepUpdate, db: Session = Depends(get_db)):
    step = db.query(models.Step).filter(models.Step.id == step_id).first()
    if step is None:
        raise HTTPException(status_code=404, detail="Step not found")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(step, key, value)
    db.commit()
    db.refresh(step)
    db.refresh(step, attribute_names=["subtasks"])
    project = db.query(models.Project).filter(models.Project.id == step.project_id).first()
    step.progress_percent = _compute_step_progress(step, project.inprogress_coeff)
    return step


@app.delete("/steps/{step_id}", status_code=204)
def delete_step(step_id: int, db: Session = Depends(get_db)):
    step = db.query(models.Step).filter(models.Step.id == step_id).first()
    if step is None:
        raise HTTPException(status_code=404, detail="Step not found")
    db.delete(step)
    db.commit()


@app.post("/steps/bulk-delete", status_code=204)
def bulk_delete_steps(payload: schemas.BulkDeleteRequest, db: Session = Depends(get_db)):
    steps = db.query(models.Step).filter(models.Step.id.in_(payload.ids)).all()
    if not steps:
        raise HTTPException(status_code=404, detail="No matching steps found")
    for step in steps:
        db.delete(step)
    db.commit()


@app.post("/projects/{project_id}/steps/reorder", response_model=list[schemas.Step])
def reorder_steps(project_id: int, payload: schemas.OrderUpdate, db: Session = Depends(get_db)):
    step_ids = payload.ids
    steps = db.query(models.Step).filter(models.Step.project_id == project_id).all()
    existing_ids = {step.id for step in steps}
    if set(step_ids) - existing_ids:
        raise HTTPException(status_code=400, detail="One or more steps do not belong to the project")

    order_map = {step_id: index for index, step_id in enumerate(step_ids)}
    for step in steps:
        if step.id in order_map:
            step.order_index = order_map[step.id]
    db.commit()
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    for step in steps:
        step.progress_percent = _compute_step_progress(step, project.inprogress_coeff)
    return sorted(steps, key=lambda s: (s.order_index, s.id))


@app.post("/subtasks", response_model=schemas.Subtask)
def create_subtask(subtask: schemas.SubtaskCreate, db: Session = Depends(get_db)):
    step = db.query(models.Step).filter(models.Step.id == subtask.step_id).first()
    if step is None:
        raise HTTPException(status_code=404, detail="Step not found")
    db_subtask = models.Subtask(**subtask.dict())
    db.add(db_subtask)
    db.commit()
    db.refresh(db_subtask)
    return db_subtask


@app.patch("/subtasks/{subtask_id}", response_model=schemas.Subtask)
def update_subtask(subtask_id: int, update: schemas.SubtaskUpdate, db: Session = Depends(get_db)):
    subtask = db.query(models.Subtask).filter(models.Subtask.id == subtask_id).first()
    if subtask is None:
        raise HTTPException(status_code=404, detail="Subtask not found")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(subtask, key, value)
    db.commit()
    db.refresh(subtask)
    return subtask


@app.delete("/subtasks/{subtask_id}", status_code=204)
def delete_subtask(subtask_id: int, db: Session = Depends(get_db)):
    subtask = db.query(models.Subtask).filter(models.Subtask.id == subtask_id).first()
    if subtask is None:
        raise HTTPException(status_code=404, detail="Subtask not found")
    db.delete(subtask)
    db.commit()


@app.post("/subtasks/bulk-delete", status_code=204)
def bulk_delete_subtasks(payload: schemas.BulkDeleteRequest, db: Session = Depends(get_db)):
    subtasks = db.query(models.Subtask).filter(models.Subtask.id.in_(payload.ids)).all()
    if not subtasks:
        raise HTTPException(status_code=404, detail="No matching subtasks found")
    for subtask in subtasks:
        db.delete(subtask)
    db.commit()


@app.post("/steps/{step_id}/subtasks/reorder", response_model=list[schemas.Subtask])
def reorder_subtasks(step_id: int, payload: schemas.OrderUpdate, db: Session = Depends(get_db)):
    subtask_ids = payload.ids
    subtasks = db.query(models.Subtask).filter(models.Subtask.step_id == step_id).all()
    existing_ids = {subtask.id for subtask in subtasks}
    if set(subtask_ids) - existing_ids:
        raise HTTPException(status_code=400, detail="One or more subtasks do not belong to the step")

    order_map = {subtask_id: index for index, subtask_id in enumerate(subtask_ids)}
    for subtask in subtasks:
        if subtask.id in order_map:
            subtask.order_index = order_map[subtask.id]
    db.commit()
    return sorted(subtasks, key=lambda s: (s.order_index, s.id))


@app.get("/steps/{step_id}/subtasks", response_model=list[schemas.Subtask])
def list_subtasks(
    step_id: int,
    status: Optional[schemas.TaskStatus] = None,
    search: Optional[str] = Query(None, description="Search by name"),
    db: Session = Depends(get_db),
):
    step = db.query(models.Step).filter(models.Step.id == step_id).first()
    if step is None:
        raise HTTPException(status_code=404, detail="Step not found")
    subtasks = db.query(models.Subtask).filter(models.Subtask.step_id == step_id)
    if status:
        subtasks = subtasks.filter(models.Subtask.status == status.value)
    if search:
        like = f"%{search}%"
        subtasks = subtasks.filter(models.Subtask.name.ilike(like))
    return subtasks.order_by(models.Subtask.order_index, models.Subtask.id).all()


@app.get("/projects/{project_id}/characteristics", response_model=list[schemas.ProjectCharacteristic])
def list_characteristics(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.ProjectCharacteristic).filter(models.ProjectCharacteristic.project_id == project_id).all()


@app.post("/characteristics", response_model=schemas.ProjectCharacteristic)
def create_characteristic(
    characteristic: schemas.ProjectCharacteristicCreate, db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == characteristic.project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db_characteristic = models.ProjectCharacteristic(**characteristic.dict())
    db.add(db_characteristic)
    db.commit()
    db.refresh(db_characteristic)
    return db_characteristic


@app.patch("/characteristics/{characteristic_id}", response_model=schemas.ProjectCharacteristic)
def update_characteristic(
    characteristic_id: int, update: schemas.ProjectCharacteristicUpdate, db: Session = Depends(get_db)
):
    characteristic = (
        db.query(models.ProjectCharacteristic)
        .filter(models.ProjectCharacteristic.id == characteristic_id)
        .first()
    )
    if characteristic is None:
        raise HTTPException(status_code=404, detail="Characteristic not found")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(characteristic, key, value)
    db.commit()
    db.refresh(characteristic)
    return characteristic


@app.delete("/characteristics/{characteristic_id}", status_code=204)
def delete_characteristic(characteristic_id: int, db: Session = Depends(get_db)):
    characteristic = (
        db.query(models.ProjectCharacteristic)
        .filter(models.ProjectCharacteristic.id == characteristic_id)
        .first()
    )
    if characteristic is None:
        raise HTTPException(status_code=404, detail="Characteristic not found")
    db.delete(characteristic)
    db.commit()


@app.post("/attachments", response_model=schemas.Attachment)
def create_attachment(attachment: schemas.AttachmentCreate, db: Session = Depends(get_db)):
    if attachment.project_id is None and attachment.step_id is None:
        raise HTTPException(status_code=400, detail="Attachment must reference a project or step")
    db_attachment = models.Attachment(**attachment.dict())
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment


@app.delete("/attachments/{attachment_id}", status_code=204)
def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    attachment = db.query(models.Attachment).filter(models.Attachment.id == attachment_id).first()
    if attachment is None:
        raise HTTPException(status_code=404, detail="Attachment not found")
    db.delete(attachment)
    db.commit()


@app.get("/projects/{project_id}/attachments", response_model=list[schemas.Attachment])
def list_project_attachments(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Attachment).filter(models.Attachment.project_id == project_id).all()


@app.get("/steps/{step_id}/attachments", response_model=list[schemas.Attachment])
def list_step_attachments(step_id: int, db: Session = Depends(get_db)):
    return db.query(models.Attachment).filter(models.Attachment.step_id == step_id).all()
