from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import get_current_user
from ..database import get_db
from ..models import Project, User, UserProject, UserProjectStatus

router = APIRouter(prefix="/user-projects", tags=["user-projects"])


@router.get("", response_model=List[schemas.UserProjectOut])
def list_user_projects(
    status: Optional[str] = Query(None, pattern="^(saved|in_progress|completed)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(UserProject).filter(UserProject.user_id == current_user.id)
    if status:
        query = query.filter(UserProject.status == UserProjectStatus(status))
    return query.order_by(UserProject.updated_at.desc()).all()


@router.post("", response_model=schemas.UserProjectOut, status_code=201)
def add_user_project(
    payload: schemas.UserProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing = (
        db.query(UserProject)
        .filter(UserProject.user_id == current_user.id, UserProject.project_id == payload.project_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="This project is already in your list")

    up = UserProject(
        user_id=current_user.id,
        project_id=payload.project_id,
        status=UserProjectStatus(payload.status),
        progress=0 if payload.status != "completed" else 100,
    )
    db.add(up)
    db.commit()
    db.refresh(up)
    return up


@router.put("/{user_project_id}", response_model=schemas.UserProjectOut)
def update_user_project(
    user_project_id: str,
    payload: schemas.UserProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    up = (
        db.query(UserProject)
        .filter(UserProject.id == user_project_id, UserProject.user_id == current_user.id)
        .first()
    )
    if not up:
        raise HTTPException(status_code=404, detail="Not found in your projects")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data:
        up.status = UserProjectStatus(data["status"])
        if up.status == UserProjectStatus.completed:
            up.progress = 100
    if "progress" in data:
        up.progress = data["progress"]
        if up.progress >= 100:
            up.status = UserProjectStatus.completed
        elif up.progress > 0 and up.status == UserProjectStatus.saved:
            up.status = UserProjectStatus.in_progress
    if "completed_tasks" in data:
        up.completed_tasks = data["completed_tasks"]

    db.commit()
    db.refresh(up)
    return up


@router.delete("/{user_project_id}", status_code=204)
def delete_user_project(
    user_project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    up = (
        db.query(UserProject)
        .filter(UserProject.id == user_project_id, UserProject.user_id == current_user.id)
        .first()
    )
    if not up:
        raise HTTPException(status_code=404, detail="Not found in your projects")
    db.delete(up)
    db.commit()
    return None
