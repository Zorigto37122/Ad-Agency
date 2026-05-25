from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_db, get_current_user, require_admin
from models.message import Message
from models.user import User
from schemas.message import MessageCreate, MessageOut

router = APIRouter(prefix="/api/messages", tags=["messages"])


def _to_out(msg: Message, user: User) -> MessageOut:
    return MessageOut(
        id=msg.id,
        user_id=msg.user_id,
        user_name=user.full_name,
        user_email=user.email,
        subject=msg.subject,
        body=msg.body,
        is_read=msg.is_read,
        created_at=msg.created_at,
    )


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def create_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = Message(
        user_id=current_user.id,
        subject=payload.subject.strip(),
        body=payload.body.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _to_out(msg, current_user)


@router.get("", response_model=List[MessageOut])
def list_messages(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Message, User)
        .join(User, Message.user_id == User.id)
        .order_by(Message.created_at.desc())
        .all()
    )
    return [_to_out(msg, user) for msg, user in rows]


@router.get("/unread-count")
def unread_count(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    count = db.query(Message).filter(Message.is_read == False).count()  # noqa: E712
    return {"count": count}


@router.patch("/{message_id}/read", response_model=MessageOut)
def mark_read(
    message_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = (
        db.query(Message, User)
        .join(User, Message.user_id == User.id)
        .filter(Message.id == message_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сообщение не найдено")
    msg, user = row
    msg.is_read = True
    db.commit()
    db.refresh(msg)
    return _to_out(msg, user)
