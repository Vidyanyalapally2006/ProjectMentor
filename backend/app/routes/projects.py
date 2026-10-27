import hashlib
import random
import time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import get_current_user
from ..database import get_db
from ..models import Project, User

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[schemas.ProjectListItem])
def list_projects(
    db: Session = Depends(get_db),
    q: Optional[str] = None,
    project_type: Optional[str] = None,
    domain: Optional[str] = None,
    sub_domain: Optional[str] = None,
    industry: Optional[str] = None,
    difficulty: Optional[str] = None,
    duration: Optional[str] = None,
    sort: str = Query("rating", pattern="^(rating|newest|title)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
):
    query = db.query(Project)

    if q:
        like = f"%{q}%"
        query = query.filter(Project.title.ilike(like) | Project.description.ilike(like))
    if project_type:
        query = query.filter(Project.project_type == project_type)
    if domain:
        query = query.filter(Project.domain == domain)
    if sub_domain:
        query = query.filter(Project.sub_domain == sub_domain)
    if industry:
        query = query.filter(Project.industry == industry)
    if difficulty:
        query = query.filter(Project.difficulty == difficulty)
    if duration:
        query = query.filter(Project.duration == duration)

    if sort == "rating":
        query = query.order_by(Project.rating.desc())
    elif sort == "newest":
        query = query.order_by(Project.created_at.desc())
    elif sort == "title":
        query = query.order_by(Project.title.asc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items


@router.get("/meta/facets")
def get_facets(db: Session = Depends(get_db)):
    """Distinct values for building filter dropdowns on the Explore page."""
    domains = sorted({p.domain for p in db.query(Project.domain).distinct()})
    types = sorted({p.project_type for p in db.query(Project.project_type).distinct()})
    industries = sorted({p.industry for p in db.query(Project.industry).distinct() if p.industry})
    difficulties = sorted({p.difficulty for p in db.query(Project.difficulty).distinct()})
    return {
        "domains": domains,
        "project_types": types,
        "industries": industries,
        "difficulties": difficulties,
    }


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


DOMAIN_SUBDOMAINS = {
    "AI": ["Search & Planning", "Reinforcement Learning", "Expert Systems"],
    "ML": ["Classification", "Regression", "Clustering"],
    "Deep Learning": ["CNNs", "RNNs", "Transformers", "GANs"],
    "Data Science": ["EDA", "Time Series", "Statistical Modeling"],
    "Web Dev": ["Frontend", "Backend", "Full Stack"],
    "Mobile": ["Android", "iOS", "Cross-platform"],
    "Cybersecurity": ["Network Security", "Cryptography", "Pen Testing"],
    "Cloud": ["Serverless", "Containers", "Cloud-native"],
    "DevOps": ["CI/CD", "Infrastructure as Code", "Monitoring"],
    "Blockchain": ["Smart Contracts", "DeFi", "NFTs"],
    "IoT": ["Embedded Systems", "Sensor Networks", "Edge Computing"],
    "AR/VR": ["Augmented Reality", "Virtual Reality", "Mixed Reality"],
    "Game Dev": ["2D Games", "3D Games", "Game AI"],
    "NLP": ["Sentiment Analysis", "Text Generation", "Machine Translation"],
    "Computer Vision": ["Object Detection", "Image Segmentation", "CNNs"],
}


@router.get("/meta/subdomains")
def get_subdomains(domain: str):
    return {"domain": domain, "sub_domains": DOMAIN_SUBDOMAINS.get(domain, [])}


def score_project(project: Project, req: schemas.RecommendationRequest) -> float:
    """40% domain match + 30% skill match + 15% industry + 10% type + 5% timeline."""
    domain_score = 1.0 if project.domain == req.domain else (0.5 if project.sub_domain == req.sub_domain else 0.0)

    skill_score = 0.0
    if req.skills and project.skills_required:
        matches = []
        for skill, level in project.skills_required.items():
            user_level = req.skills.get(skill)
            if user_level is not None:
                # closeness of user's skill to what's required, capped at 1
                matches.append(max(0.0, 1 - abs(user_level - level) / 4))
        skill_score = sum(matches) / len(matches) if matches else 0.3
    else:
        skill_score = 0.3

    industry_score = 1.0 if req.industry and project.industry == req.industry else 0.2
    type_score = 1.0 if project.project_type == req.project_type else 0.2

    timeline_score = 0.5
    if req.timeline and project.duration:
        timeline_score = 1.0 if req.timeline == project.duration else 0.3

    total = (
        0.40 * domain_score
        + 0.30 * skill_score
        + 0.15 * industry_score
        + 0.10 * type_score
        + 0.05 * timeline_score
    )
    return round(total, 4)


@router.post("/recommendations", response_model=List[schemas.ProjectListItem])
def get_recommendations(
    payload: schemas.RecommendationRequest,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidates = db.query(Project).filter(Project.domain == payload.domain).all()
    if len(candidates) < limit:
        # widen the pool so we always have enough to recommend from
        candidates = db.query(Project).all()

    scored = [(score_project(p, payload), p) for p in candidates]
    scored.sort(key=lambda x: x[0], reverse=True)

    # per-user, per-session randomized seed so no two users (or requests) get an
    # identical ordering among similarly-scored projects
    seed_material = f"{current_user.id}-{int(time.time())}"
    seed = int(hashlib.sha256(seed_material.encode()).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)

    top_pool = scored[: max(limit * 3, limit)]
    rng.shuffle(top_pool)
    top_pool.sort(key=lambda x: x[0], reverse=True)  # keep score ordering but shuffle ties

    results = [p for _, p in top_pool[:limit]]
    return results


@router.get("/{project_id}/recommend")
def why_recommended(
    project_id: str,
    domain: Optional[str] = None,
    industry: Optional[str] = None,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    reasons = []
    if domain and project.domain == domain:
        reasons.append(f"Matches your chosen domain: {domain}")
    if industry and project.industry == industry:
        reasons.append(f"Aligned with your target industry: {industry}")
    if project.skills_required:
        reasons.append(
            "Builds on skills like " + ", ".join(list(project.skills_required.keys())[:3])
        )
    reasons.append(project.why_recommended or "A strong fit based on your stated goals and skill profile.")
    return {"project_id": project_id, "reasons": reasons}
