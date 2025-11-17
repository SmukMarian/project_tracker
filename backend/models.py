from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    projects = relationship("Project", back_populates="category")


class PM(Base):
    __tablename__ = "pms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    projects = relationship("Project", back_populates="owner")
    steps = relationship("Step", back_populates="assignee")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active")
    owner_id = Column(Integer, ForeignKey("pms.id"), nullable=True)
    start_date = Column(Date, nullable=True)
    target_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    inprogress_coeff = Column(Float, nullable=False, default=0.5)
    moq = Column(Float, nullable=True)
    base_price = Column(Float, nullable=True)
    retail_price = Column(Float, nullable=True)
    cover_image = Column(String, nullable=True)
    media_path = Column(String, nullable=True)

    category = relationship("Category", back_populates="projects")
    owner = relationship("PM", back_populates="projects")
    steps = relationship("Step", back_populates="project", cascade="all, delete-orphan")
    characteristics = relationship(
        "ProjectCharacteristic", back_populates="project", cascade="all, delete-orphan"
    )
    attachments = relationship("Attachment", back_populates="project", cascade="all, delete-orphan")


class Step(Base):
    __tablename__ = "steps"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="todo")
    assignee_id = Column(Integer, ForeignKey("pms.id"), nullable=True)
    start_date = Column(Date, nullable=True)
    target_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    weight = Column(Float, nullable=False, default=1.0)
    comments = Column(Text, nullable=True)

    project = relationship("Project", back_populates="steps")
    assignee = relationship("PM", back_populates="steps")
    subtasks = relationship("Subtask", back_populates="step", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="step", cascade="all, delete-orphan")


class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("steps.id"), nullable=False)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="todo")
    weight = Column(Float, nullable=False, default=1.0)
    target_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)

    step = relationship("Step", back_populates="subtasks")


class ProjectCharacteristic(Base):
    __tablename__ = "project_characteristics"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    parameter = Column(String, nullable=False)
    value = Column(String, nullable=True)

    project = relationship("Project", back_populates="characteristics")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    step_id = Column(Integer, ForeignKey("steps.id"), nullable=True)
    path = Column(String, nullable=False)
    added_at = Column(Date, nullable=True)

    project = relationship("Project", back_populates="attachments")
    step = relationship("Step", back_populates="attachments")
