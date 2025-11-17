from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend import models
from backend.app import _apply_progress, _compute_step_progress, _kpi_report


def make_session():
    engine = create_engine("sqlite:///:memory:")
    TestingSession = sessionmaker(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    return TestingSession()


def test_compute_step_progress_with_weighted_subtasks():
    step = models.Step(
        project_id=1,
        name="Design",
        subtasks=[
            models.Subtask(step_id=1, name="Layout", status="done", weight=2),
            models.Subtask(step_id=1, name="Copy", status="in_progress", weight=1),
            models.Subtask(step_id=1, name="QA", status="blocked", weight=1),
        ],
    )

    progress = _compute_step_progress(step, inprogress_coeff=0.5)

    # (2*1 + 1*0.5 + 1*0) / 4 = 0.625 -> 62.5%
    assert progress == 62


def test_apply_progress_weights_steps_and_metrics():
    project = models.Project(
        id=1,
        category_id=1,
        name="Test",
        inprogress_coeff=0.4,
        steps=[
            models.Step(
                id=1,
                project_id=1,
                name="Heavy",
                status="done",
                weight=2,
                subtasks=[],
            ),
            models.Step(
                id=2,
                project_id=1,
                name="Light",
                status="in_progress",
                weight=1,
                subtasks=[
                    models.Subtask(step_id=2, name="Sub", status="done", weight=1),
                    models.Subtask(step_id=2, name="Review", status="in_progress", weight=1),
                ],
            ),
        ],
    )

    enriched = _apply_progress(project)

    # Step1=100 (w=2), Step2=((1*1 + 0.4*1)/2)*100=70 (w=1) => (100*2+70*1)/3=90
    assert enriched.progress_percent == 90
    assert enriched.steps_total == 2
    assert enriched.steps_done == 1
    assert enriched.subtasks_total == 2
    assert enriched.subtasks_done == 1


def test_kpi_report_uses_weighted_progress():
    session = make_session()
    project = models.Project(
        id=1,
        category_id=1,
        name="KPI",
        status="active",
        inprogress_coeff=0.5,
        steps=[
            models.Step(
                id=1,
                project_id=1,
                name="One",
                status="in_progress",
                weight=2,
                subtasks=[
                    models.Subtask(step_id=1, name="Draft", status="done", weight=1),
                    models.Subtask(step_id=1, name="Review", status="in_progress", weight=1),
                ],
            )
        ],
    )
    session.add(project)
    session.commit()

    report = _kpi_report(session)

    assert report.total_projects == 1
    assert report.steps_total == 1
    assert report.steps_done == 0
    assert report.subtasks_total == 2
    assert report.subtasks_done == 1
    assert report.average_progress > 0
