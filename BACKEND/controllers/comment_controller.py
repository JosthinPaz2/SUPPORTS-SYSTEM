from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from db.session import SessionLocal
from dtos.comment_dto import CommentCreate, CommentOut, CommentUpdate
from models.comment import Comment
from models.ticket import Ticket
from models.notification import Notification
from models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/comments", tags=["comments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_role_one_user_ids(db: Session) -> set[int]:
    rows = db.query(User.id_user).filter(User.id_role == 1).all()
    return {int(row[0]) for row in rows}


def _is_admin_user(db: Session, user_id: int | None) -> bool:
    if not user_id:
        return False

    return (
        db.query(User.id_user)
        .filter(User.id_user == user_id, User.id_role == 1)
        .first()
        is not None
    )


def _create_notifications(
    db: Session,
    user_ids: set[int],
    message: str,
    *,
    exclude_user_id: int | None = None,
    action_type: str | None = None,
    severity: str | None = None,
    id_ticket: int | None = None,
    id_station: str | None = None,
):
    for user_id in user_ids:
        if exclude_user_id is not None and user_id == exclude_user_id:
            continue
        db.add(
            Notification(
                id_user=user_id,
                message=message,
                read=False,
                action_type=action_type,
                severity=severity,
                id_ticket=id_ticket,
                id_station=id_station,
            )
        )


@router.post("/", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    db_ticket = db.query(Ticket).filter(Ticket.id_ticket == comment.id_ticket).first()
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db_comment = Comment(**comment.dict())
    db.add(db_comment)
    db.flush()

    role_one_user_ids = _get_role_one_user_ids(db)
    assigned_techs = {
        tech_id for tech_id in [db_ticket.primary_technician, db_ticket.secondary_technician] if tech_id
    }
    commenter_is_admin = _is_admin_user(db, comment.id_user)

    if bool(comment.internal_note):
        recipients = set(assigned_techs)
        if not commenter_is_admin:
            recipients.update(role_one_user_ids)
        _create_notifications(
            db,
            recipients,
            f"Internal note added on ticket #{db_ticket.id_ticket}: {db_ticket.title}",
            exclude_user_id=comment.id_user,
            action_type="open_ticket",
            severity="info",
            id_ticket=db_ticket.id_ticket,
            id_station=db_ticket.id_station,
        )
    else:
        recipients = {db_ticket.created_by}.union(assigned_techs)
        if not commenter_is_admin:
            recipients.update(role_one_user_ids)

        recipients.discard(None)
        _create_notifications(
            db,
            recipients,
            f"New comment on ticket #{db_ticket.id_ticket}: {db_ticket.title}",
            exclude_user_id=comment.id_user,
            action_type="open_ticket",
            severity="info",
            id_ticket=db_ticket.id_ticket,
            id_station=db_ticket.id_station,
        )

    db.commit()
    db.refresh(db_comment)
    logger.info(f"created comment {db_comment.id_comment} for ticket {db_comment.id_ticket}")
    return db_comment


@router.get("/", response_model=list[CommentOut])
def list_comments(db: Session = Depends(get_db)):
    return db.query(Comment).all()


@router.get("/{comment_id}", response_model=CommentOut)
def get_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id_comment == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


@router.get("/ticket/{ticket_id}", response_model=list[CommentOut])
def list_comments_by_ticket(ticket_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.id_ticket == ticket_id).all()
    return comments


@router.put("/{comment_id}", response_model=CommentOut)
def update_comment(comment_id: int, comment: CommentUpdate, db: Session = Depends(get_db)):
    db_comment = db.query(Comment).filter(Comment.id_comment == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    for key, value in comment.dict(exclude_unset=True).items():
        setattr(db_comment, key, value)
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    logger.info(f"updated comment {db_comment.id_comment}")
    return db_comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    db_comment = db.query(Comment).filter(Comment.id_comment == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    db.delete(db_comment)
    db.commit()
    logger.info(f"deleted comment {comment_id}")
    return None
