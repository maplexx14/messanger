from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import models
from ..schemas import schemas
from ..auth import auth
from ..websockets.manager import manager
from fastapi import UploadFile, File
import os

router = APIRouter(prefix="/chats/{chat_id}/messages", tags=["messages"])

@router.post("/", response_model=schemas.Message)
async def create_message(
    chat_id: int,
    message: schemas.MessageCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    participant = db.query(models.ChatParticipant).filter(
        models.ChatParticipant.chat_id == chat_id,
        models.ChatParticipant.user_id == current_user.id
    ).first()
    if not participant:
        raise HTTPException(status_code=403, detail="Not authorized to send messages to this chat")
    db_message = models.Message(
        content=message.content,
        chat_id=chat_id,
        user_id=current_user.id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    message_data = {
        "id": db_message.id,
        "content": db_message.content,
        "created_at": db_message.timestamp.isoformat(),
        "user": {
            "id": current_user.id,
            "username": current_user.username
        }
    }
    await manager.broadcast_to_chat(chat_id, message_data)
    return db_message

@router.post("/upload")
async def upload_file(chat_id: int, file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    print(file.filename)
    print(file.content_type)
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if current_user not in chat.participants:
        raise HTTPException(status_code=403, detail="Not authorized to upload files to this chat")
    
    # Save file to uploads directory
    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    # File URL for frontend (assuming /static/uploads/ is served)
    file_url = f"/static/uploads/{file.filename}"
    db_message = models.Message(
        content=file.filename,
        chat_id=chat_id,
        sender_id=current_user.id,
        file_url=file_url,
        filetype=file.content_type,
        filename=file.filename
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    message_data = {
        "id": db_message.id,
        "content": db_message.content,
        "file_url": file_url,
        "filetype": file.content_type,
        "filename": file.filename,
        "created_at": db_message.timestamp.isoformat(),
        "sender_id": current_user.id,
        "chat_id": chat_id,
        "sender": {"id": current_user.id, "username": current_user.username if current_user else "Unknown"}
    }
    await manager.broadcast_to_chat(chat_id, {
        "type": "message",
        "message": message_data
    })
    
    return {
        "id": db_message.id,
        "content": db_message.content,
        "file_url": file_url,
        "filetype": file.content_type,
        "filename": file.filename,
        "created_at": db_message.timestamp.isoformat(),
        "sender_id": current_user.id,
        "chat_id": chat_id
    }

@router.get("/", response_model=List[schemas.Message])
def get_chat_messages(
    chat_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if current_user not in chat.participants:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat's messages")
    return chat.messages 


