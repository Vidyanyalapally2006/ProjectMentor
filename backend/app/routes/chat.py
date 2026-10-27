from datetime import datetime
from typing import List

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas
from ..auth import get_current_user
from ..config import settings
from ..database import get_db
from ..models import Conversation, Project, User

router = APIRouter(prefix="/chat", tags=["chat"])


def build_system_prompt(project: Project | None) -> str:
    if not project:
        return (
            "You are the ProjectMentor assistant, helping students discover and plan "
            "academic and portfolio projects. Be concise, encouraging, and specific."
        )
    return f"""You are the ProjectMentor assistant. The student is currently viewing this project:

Title: {project.title}
Domain: {project.domain} / {project.sub_domain}
Industry: {project.industry}
Difficulty: {project.difficulty}
Tech stack: {', '.join(project.tech_stack or [])}
Skills required: {project.skills_required}
Prerequisites: {', '.join(project.prerequisites or [])}
Research papers: {', '.join(project.research_papers or [])}
Dataset links: {', '.join(project.dataset_links or [])}

Answer questions about requirements, implementation approach, alternative tech choices,
relevant research papers, datasets, and troubleshooting. Keep answers focused and practical.
Reference the project's own roadmap and tech stack where relevant."""


def canned_reply(message: str, project: Project | None) -> str:
    """Fallback used when no LLM_API_KEY is configured."""
    lower = message.lower()
    name = project.title if project else "this topic"
    if "dataset" in lower:
        links = ", ".join(project.dataset_links) if project and project.dataset_links else "no dataset links on file yet"
        return f"For {name}, here are the datasets I have: {links}. Let me know if you'd like alternatives."
    if "tech" in lower or "stack" in lower or "alternative" in lower:
        stack = ", ".join(project.tech_stack) if project and project.tech_stack else "a standard stack for this domain"
        return f"The recommended stack is {stack}. Common alternatives exist for most of these — tell me which piece you want to swap and I'll suggest options."
    if "paper" in lower or "research" in lower:
        papers = ", ".join(project.research_papers) if project and project.research_papers else "no papers linked yet"
        return f"Relevant research for {name}: {papers}."
    if "error" in lower or "bug" in lower or "troubleshoot" in lower or "stuck" in lower:
        return (
            "Let's debug it step by step — what error message or unexpected behavior are you seeing, "
            "and which week/task of the roadmap are you on?"
        )
    return (
        f"Happy to help with {name}. Ask me about requirements, implementation steps, tech alternatives, "
        "datasets, research papers, or anything you're stuck on."
        + ("" if settings.LLM_API_KEY else " (Note: connect an LLM_API_KEY in .env for fully dynamic answers — this is a placeholder response.)")
    )


async def call_llm(system_prompt: str, history: List[dict], message: str) -> str:
    if not settings.LLM_API_KEY:
        return None  # caller falls back to canned_reply

    messages = [{"role": m["role"], "content": m["content"]} for m in history if m["role"] in ("user", "assistant")]
    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            settings.LLM_API_URL,
            headers={
                "x-api-key": settings.LLM_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-6",
                "max_tokens": 600,
                "system": system_prompt,
                "messages": messages,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        text_blocks = [b["text"] for b in data.get("content", []) if b.get("type") == "text"]
        return "\n".join(text_blocks) if text_blocks else None


@router.post("", response_model=schemas.ChatResponse)
async def chat(
    payload: schemas.ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = None
    if payload.project_id:
        project = db.query(Project).filter(Project.id == payload.project_id).first()

    conversation = None
    if payload.conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == payload.conversation_id, Conversation.user_id == current_user.id)
            .first()
        )
    if not conversation:
        conversation = Conversation(
            user_id=current_user.id,
            project_id=payload.project_id,
            messages=[],
            context={"project_id": payload.project_id},
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    history = conversation.messages or []
    system_prompt = build_system_prompt(project)

    reply = None
    try:
        reply = await call_llm(system_prompt, history, payload.message)
    except Exception:
        reply = None
    if not reply:
        reply = canned_reply(payload.message, project)

    now = datetime.utcnow().isoformat()
    history = history + [
        {"role": "user", "content": payload.message, "ts": now},
        {"role": "assistant", "content": reply, "ts": now},
    ]
    conversation.messages = history
    db.commit()

    return schemas.ChatResponse(conversation_id=conversation.id, reply=reply)


@router.get("/conversations", response_model=List[schemas.ConversationOut])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


@router.get("/conversations/{conversation_id}", response_model=schemas.ConversationOut)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return None
