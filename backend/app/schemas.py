from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth / Users ----------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=6)
    college: Optional[str] = None
    year: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)


class SkillOut(BaseModel):
    id: str
    skill_name: str
    proficiency: int

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    college: Optional[str] = None
    year: Optional[str] = None
    created_at: datetime
    skills: List[SkillOut] = []

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    year: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SkillIn(BaseModel):
    skill_name: str
    proficiency: int = Field(ge=1, le=5)


class SkillUpdate(BaseModel):
    proficiency: int = Field(ge=1, le=5)


# ---------- Projects ----------
class ProjectBase(BaseModel):
    title: str
    description: str
    domain: str
    sub_domain: Optional[str] = None
    industry: Optional[str] = None
    project_type: str
    difficulty: str
    duration: Optional[str] = None
    tech_stack: List[str] = []
    skills_required: Dict[str, int] = {}
    dataset_links: List[str] = []
    github_repo: Optional[str] = None
    demo_link: Optional[str] = None
    research_papers: List[str] = []
    roadmap: Dict[str, Any] = {}
    why_recommended: Optional[str] = None
    prerequisites: List[str] = []
    learning_outcomes: List[str] = []
    career_benefits: List[str] = []
    challenges: Optional[str] = None
    solutions: Optional[str] = None
    images: List[str] = []


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None
    sub_domain: Optional[str] = None
    industry: Optional[str] = None
    project_type: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    skills_required: Optional[Dict[str, int]] = None
    dataset_links: Optional[List[str]] = None
    github_repo: Optional[str] = None
    demo_link: Optional[str] = None
    research_papers: Optional[List[str]] = None
    roadmap: Optional[Dict[str, Any]] = None
    prerequisites: Optional[List[str]] = None
    learning_outcomes: Optional[List[str]] = None
    career_benefits: Optional[List[str]] = None
    challenges: Optional[str] = None
    solutions: Optional[str] = None
    images: Optional[List[str]] = None


class ProjectOut(ProjectBase):
    id: str
    rating: float
    total_ratings: int
    is_curated: bool
    published_by: Optional[str] = None
    version: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectListItem(BaseModel):
    id: str
    title: str
    description: str
    domain: str
    sub_domain: Optional[str] = None
    industry: Optional[str] = None
    project_type: str
    difficulty: str
    duration: Optional[str] = None
    tech_stack: List[str] = []
    rating: float
    total_ratings: int
    is_curated: bool

    class Config:
        from_attributes = True


class RecommendationRequest(BaseModel):
    domain: str
    sub_domain: Optional[str] = None
    industry: Optional[str] = None
    project_type: str
    skills: Dict[str, int] = {}
    timeline: Optional[str] = None  # e.g. "1-2 months"
    career_goals: Optional[str] = None


# ---------- User Projects ----------
class UserProjectCreate(BaseModel):
    project_id: str
    status: str = "saved"


class UserProjectUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    completed_tasks: Optional[List[str]] = None


class UserProjectOut(BaseModel):
    id: str
    project_id: str
    status: str
    progress: int
    completed_tasks: List[str] = []
    project: ProjectListItem

    class Config:
        from_attributes = True


# ---------- Reviews ----------
class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    difficulty_experienced: Optional[str] = None
    time_taken_actual: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = None
    difficulty_experienced: Optional[str] = None
    time_taken_actual: Optional[str] = None


class ReviewOut(BaseModel):
    id: str
    user_id: str
    project_id: str
    rating: int
    comment: Optional[str] = None
    difficulty_experienced: Optional[str] = None
    time_taken_actual: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Chat ----------
class ChatMessage(BaseModel):
    project_id: Optional[str] = None
    conversation_id: Optional[str] = None
    message: str


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str


class ConversationOut(BaseModel):
    id: str
    project_id: Optional[str] = None
    messages: List[Dict[str, Any]] = []
    updated_at: datetime

    class Config:
        from_attributes = True
