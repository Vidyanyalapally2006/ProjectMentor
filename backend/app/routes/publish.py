from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import get_current_user
from ..database import get_db
from ..models import Project, User

router = APIRouter(prefix="/projects", tags=["publishing"])


@router.post("/publish", response_model=schemas.ProjectOut, status_code=201)
def publish_project(
    payload: schemas.ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = Project(
        **payload.model_dump(),
        is_curated=False,
        published_by=current_user.id,
        version=1,
        version_history=[{"version": 1, "at": datetime.utcnow().isoformat(), "note": "Initial publish"}],
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/publish/{project_id}", response_model=schemas.ProjectOut)
def update_published_project(
    project_id: str,
    payload: schemas.ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.published_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit projects you published")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    project.version += 1
    history = project.version_history or []
    history.append({"version": project.version, "at": datetime.utcnow().isoformat(), "note": "Updated"})
    project.version_history = history

    db.commit()
    db.refresh(project)
    return project


@router.delete("/publish/{project_id}", status_code=204)
def delete_published_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.published_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete projects you published")
    db.delete(project)
    db.commit()
    return None


@router.get("/published", response_model=List[schemas.ProjectListItem])
def list_published(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Project)
        .filter(Project.published_by == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )
