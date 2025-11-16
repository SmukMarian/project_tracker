from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class AttachmentBase(BaseModel):
    path: str
    added_at: Optional[date] = None
    project_id: Optional[int] = None
    step_id: Optional[int] = None


class AttachmentCreate(AttachmentBase):
    pass


class Attachment(AttachmentBase):
    id: int

    class Config:
        from_attributes = True


class ProjectCharacteristicBase(BaseModel):
    parameter: str
    value: Optional[str] = None


class ProjectCharacteristicCreate(ProjectCharacteristicBase):
    project_id: int


class ProjectCharacteristic(ProjectCharacteristicBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True


class SubtaskBase(BaseModel):
    name: str
    status: str = "todo"
    weight: float = 1.0
    target_date: Optional[date] = None
    completed_date: Optional[date] = None
    order_index: int = 0


class SubtaskCreate(SubtaskBase):
    step_id: int


class Subtask(SubtaskBase):
    id: int
    step_id: int

    class Config:
        from_attributes = True


class StepBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "todo"
    assignee_id: Optional[int] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    completed_date: Optional[date] = None
    order_index: int = 0
    weight: float = 1.0
    comments: Optional[str] = None


class StepCreate(StepBase):
    project_id: int


class Step(StepBase):
    id: int
    project_id: int
    subtasks: List[Subtask] = []

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    name: str
    category_id: int
    code: Optional[str] = None
    status: str = "Active"
    owner_id: Optional[int] = None
    start_date: Optional[date] = None
    target_date: Optional[date] = None
    description: Optional[str] = None
    inprogress_coeff: float = 0.5
    moq: Optional[float] = None
    base_price: Optional[float] = None
    retail_price: Optional[float] = None
    cover_image: Optional[str] = None
    media_path: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: int
    steps: List[Step] = []
    characteristics: List[ProjectCharacteristic] = []
    attachments: List[Attachment] = []

    class Config:
        from_attributes = True


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int
    projects: List[Project] = []

    class Config:
        from_attributes = True


class PMBase(BaseModel):
    name: str


class PMCreate(PMBase):
    pass


class PM(PMBase):
    id: int

    class Config:
        from_attributes = True
