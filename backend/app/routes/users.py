from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import get_current_user
from ..database import get_db
from ..models import Review, User, UserProject, UserProjectStatus

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile", response_model=schemas.UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    payload: schemas.UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/profile/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = (
        db.query(UserProject)
        .filter(UserProject.user_id == current_user.id, UserProject.status == UserProjectStatus.saved)
        .count()
    )
    in_progress = (
        db.query(UserProject)
        .filter(UserProject.user_id == current_user.id, UserProject.status == UserProjectStatus.in_progress)
        .count()
    )
    completed = (
        db.query(UserProject)
        .filter(UserProject.user_id == current_user.id, UserProject.status == UserProjectStatus.completed)
        .count()
    )
    published = len(current_user.published_projects)
    avg_rating = (
        db.query(func.avg(Review.rating)).filter(Review.user_id == current_user.id).scalar() or 0
    )

    return {
        "total_saved": saved,
        "in_progress": in_progress,
        "total_completed": completed,
        "total_published": published,
        "average_rating_given": round(float(avg_rating), 2),
    }


@router.get("/{user_id}")
def get_public_user(user_id: str, db: Session = Depends(get_db)):
    """Public profile: no email/skills exposed, just what other students should see."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "full_name": user.full_name,
        "college": user.college,
        "year": user.year,
        "total_published": len(user.published_projects),
    }


@router.get("/{user_id}/projects", response_model=list[schemas.ProjectListItem])
def get_user_published_projects(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.published_projects
