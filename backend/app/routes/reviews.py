from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import get_current_user
from ..database import get_db
from ..models import Project, Review, User

router = APIRouter(tags=["reviews"])


def _recalculate_rating(db: Session, project: Project):
    reviews = db.query(Review).filter(Review.project_id == project.id).all()
    if reviews:
        project.total_ratings = len(reviews)
        project.rating = round(sum(r.rating for r in reviews) / len(reviews), 2)
    else:
        project.total_ratings = 0
        project.rating = 0.0
    db.commit()


def _to_out(review: Review) -> schemas.ReviewOut:
    out = schemas.ReviewOut.model_validate(review)
    out.user_name = review.user.full_name if review.user else None
    return out


@router.get("/projects/{project_id}/reviews", response_model=List[schemas.ReviewOut])
def list_reviews(project_id: str, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.project_id == project_id).order_by(Review.created_at.desc()).all()
    return [_to_out(r) for r in reviews]


@router.post("/projects/{project_id}/reviews", response_model=schemas.ReviewOut, status_code=201)
def create_review(
    project_id: str,
    payload: schemas.ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing = (
        db.query(Review)
        .filter(Review.project_id == project_id, Review.user_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this project; edit your review instead")

    review = Review(
        project_id=project_id,
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
        difficulty_experienced=payload.difficulty_experienced,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    _recalculate_rating(db, project)
    return _to_out(review)


@router.put("/reviews/{review_id}", response_model=schemas.ReviewOut)
def update_review(
    review_id: str,
    payload: schemas.ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == current_user.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    db.commit()
    db.refresh(review)

    project = db.query(Project).filter(Project.id == review.project_id).first()
    _recalculate_rating(db, project)
    return _to_out(review)


@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == current_user.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    project_id = review.project_id
    db.delete(review)
    db.commit()

    project = db.query(Project).filter(Project.id == project_id).first()
    _recalculate_rating(db, project)
    return None
