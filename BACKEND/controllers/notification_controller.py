from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from db.session import SessionLocal
from dtos.notification_dto import NotificationCreate, NotificationOut, NotificationUpdate
from models.notification import Notification

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification(notification: NotificationCreate, db: Session = Depends(get_db)):
    db_notification = Notification(**notification.dict())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    logger.info(f"created notification {db_notification.id_notification} for user {db_notification.id_user}")
    return db_notification


@router.get("/", response_model=list[NotificationOut])
def list_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).all()


@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id_notification == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.get("/user/{user_id}", response_model=list[NotificationOut])
def list_notifications_by_user(user_id: int, db: Session = Depends(get_db)):
    notifications = db.query(Notification).filter(Notification.id_user == user_id).all()
    if not notifications:
        raise HTTPException(status_code=404, detail="No notifications for this user")
    return notifications


@router.put("/{notification_id}", response_model=NotificationOut)
def update_notification(notification_id: int, notification: NotificationUpdate, db: Session = Depends(get_db)):
    db_notification = db.query(Notification).filter(Notification.id_notification == notification_id).first()
    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    for key, value in notification.dict(exclude_unset=True).items():
        setattr(db_notification, key, value)
    
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    logger.info(f"updated notification {db_notification.id_notification}")
    return db_notification


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    db_notification = db.query(Notification).filter(Notification.id_notification == notification_id).first()
    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(db_notification)
    db.commit()
    logger.info(f"deleted notification {notification_id}")
    return None
