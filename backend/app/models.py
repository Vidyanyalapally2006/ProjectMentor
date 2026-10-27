import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


class UserProjectStatus(str, enum.Enum):
    saved = "saved"
    in_progress = "in_progress"
    completed = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    college = Column(String(255), nullable=True)
    year = Column(String(20), nullable=True)  # e.g. "3rd Year" - kept as free text for flexibility
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    user_projects = relationship("UserProject", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    published_projects = relationship("Project", back_populates="publisher")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    skill_name = Column(String(120), nullable=False)
    proficiency = Column(Integer, nullable=False)  # 1-5
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "skill_name", name="uq_user_skill"),)

    user = relationship("User", back_populates="skills")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    domain = Column(String(80), nullable=False)
    sub_domain = Column(String(80), nullable=True)
    industry = Column(String(80), nullable=True)
    project_type = Column(String(40), nullable=False)  # Mini/Major/Research/Industry/Hackathon
    difficulty = Column(String(40), nullable=False)  # Beginner/Intermediate/Advanced
    duration = Column(String(60), nullable=True)
    tech_stack = Column(JSON, default=list)  # list[str]
    skills_required = Column(JSON, default=dict)  # {"Python": 4, ...}
    dataset_links = Column(JSON, default=list)
    github_repo = Column(String(500), nullable=True)
    demo_link = Column(String(500), nullable=True)
    research_papers = Column(JSON, default=list)
    roadmap = Column(JSON, default=dict)  # {"weeks": [...]}
    why_recommended = Column(Text, nullable=True)
    prerequisites = Column(JSON, default=list)
    learning_outcomes = Column(JSON, default=list)
    career_benefits = Column(JSON, default=list)
    challenges = Column(Text, nullable=True)
    solutions = Column(Text, nullable=True)
    images = Column(JSON, default=list)
    rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)  # % of starters who complete it
    is_curated = Column(Boolean, default=True)
    published_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    version = Column(Integer, default=1)
    version_history = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    publisher = relationship("User", back_populates="published_projects")
    user_projects = relationship("UserProject", back_populates="project", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="project", cascade="all, delete-orphan")


class UserProject(Base):
    __tablename__ = "user_projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    status = Column(Enum(UserProjectStatus), default=UserProjectStatus.saved)
    progress = Column(Integer, default=0)  # 0-100
    completed_tasks = Column(JSON, default=list)  # list of "week-task" ids
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "project_id", name="uq_user_project"),)

    user = relationship("User", back_populates="user_projects")
    project = relationship("Project", back_populates="user_projects")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    difficulty_experienced = Column(String(40), nullable=True)
    time_taken_actual = Column(String(60), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "project_id", name="uq_user_review"),)

    user = relationship("User", back_populates="reviews")
    project = relationship("Project", back_populates="reviews")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    messages = Column(JSON, default=list)  # [{role, content, ts}]
    context = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    type = Column(String(60), nullable=False)
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
