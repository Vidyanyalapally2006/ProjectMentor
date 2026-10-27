from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import get_current_user
from ..database import get_db
from ..models import User, UserSkill

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("", response_model=list[schemas.SkillOut])
def list_skills(current_user: User = Depends(get_current_user)):
    return current_user.skills


@router.post("", response_model=schemas.SkillOut, status_code=201)
def add_skill(
    payload: schemas.SkillIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(UserSkill)
        .filter(UserSkill.user_id == current_user.id, UserSkill.skill_name == payload.skill_name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already added this skill; update it instead")

    skill = UserSkill(user_id=current_user.id, skill_name=payload.skill_name, proficiency=payload.proficiency)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.put("/{skill_id}", response_model=schemas.SkillOut)
def update_skill(
    skill_id: str,
    payload: schemas.SkillUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skill = (
        db.query(UserSkill)
        .filter(UserSkill.id == skill_id, UserSkill.user_id == current_user.id)
        .first()
    )
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    skill.proficiency = payload.proficiency
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/{skill_id}", status_code=204)
def delete_skill(
    skill_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skill = (
        db.query(UserSkill)
        .filter(UserSkill.id == skill_id, UserSkill.user_id == current_user.id)
        .first()
    )
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return None
