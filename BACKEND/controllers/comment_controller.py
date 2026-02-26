from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from db.session import SessionLocal
from dtos.comment_dto import CommentCreate, CommentOut, CommentUpdate
from models.comment import Comment

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/comments", tags=["comments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    db_comment = Comment(**comment.dict())
    db.add(db_comment)
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
    if not comments:
        raise HTTPException(status_code=404, detail="No comments for this ticket")
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
