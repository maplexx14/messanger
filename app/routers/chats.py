from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import models
from ..schemas import schemas
from ..auth import auth
from ..websockets.manager import manager
from fastapi import UploadFile, File
router = APIRouter(prefix="/chats", tags=["chats"])

@router.post("/", response_model=schemas.Chat)
async def create_chat(
    chat: schemas.ChatCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_chat = models.Chat(name=chat.name, is_group=chat.is_group)
    db_chat.participants.append(current_user)
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    for user_id in chat.participant_ids:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            db_chat.participants.append(user)
    db.commit()
    db.refresh(db_chat)
    chat_data = {
        "id": db_chat.id,
        "name": db_chat.name,
        "is_group": db_chat.is_group,
        "created_at": db_chat.created_at.isoformat(),
        "participants": [{"id": p.id, "username": p.username} for p in db_chat.participants]
    }
    await manager.notify_chat_update(db_chat.id, "new_chat", chat_data)
    return db_chat

@router.get("/", response_model=List[schemas.Chat])
def get_user_chats(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    return current_user.chats

@router.get("/{chat_id}", response_model=schemas.Chat)
def get_chat(
    chat_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if current_user not in chat.participants:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")
    return chat

@router.delete("/{chat_id}")
async def delete_chat(chat_id: int, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    try:
        chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        participants = [p.id for p in chat.participants]
        if current_user not in chat.participants:
            raise HTTPException(status_code=403, detail="Not authorized to delete this chat")
        if not chat.is_group:
            db.query(models.Message).filter(models.Message.chat_id == chat_id).delete()
            db.query(models.ChatParticipant).filter(models.ChatParticipant.chat_id == chat_id).delete()
            db.delete(chat)
            db.commit()
            for user_id in participants:
                await manager.notify_user_chats_update(user_id, {
                    "id": chat_id,
                    "deleted": True
                })
            return {"message": "Chat deleted successfully"}
        chat.participants.remove(current_user)
        if not chat.participants:
            db.query(models.Message).filter(models.Message.chat_id == chat_id).delete()
            db.delete(chat)
            db.commit()
            for user_id in participants:
                await manager.notify_user_chats_update(user_id, {
                    "id": chat_id,
                    "deleted": True
                })
        else:
            db.commit()
            chat_data = {
                "id": chat.id,
                "name": chat.name,
                "is_group": chat.is_group,
                "created_at": chat.created_at.isoformat(),
                "participants": [{"id": p.id, "username": p.username} for p in chat.participants]
            }
            for user_id in participants:
                if user_id != current_user.id:
                    await manager.notify_user_chats_update(user_id, chat_data)
        return {"message": "Successfully removed from chat"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{chat_id}/leave")
async def leave_chat(chat_id: int, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    participant = db.query(models.ChatParticipant).filter(
        models.ChatParticipant.chat_id == chat_id,
        models.ChatParticipant.user_id == current_user.id
    ).first()
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant in this chat")
    db.delete(participant)
    db.commit()
    chat_data = {
        "id": chat.id,
        "name": chat.name,
        "is_group": chat.is_group,
        "created_at": chat.created_at.isoformat(),
        "participants": [{"id": p.id, "username": p.username} for p in chat.participants]
    }
    for user_id in [p.id for p in chat.participants]:
        if user_id != current_user.id:
            await manager.notify_user_chats_update(user_id, chat_data)
    return {"message": "Successfully left the chat"}

@router.post("/{chat_id}/participants/{user_id}")
async def add_participant(
    chat_id: int,
    user_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    current_participant = db.query(models.ChatParticipant).filter(
        models.ChatParticipant.chat_id == chat_id,
        models.ChatParticipant.user_id == current_user.id,
        models.ChatParticipant.is_admin == True
    ).first()
    if not current_participant:
        raise HTTPException(status_code=403, detail="Not authorized to add participants")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing_participant = db.query(models.ChatParticipant).filter(
        models.ChatParticipant.chat_id == chat_id,
        models.ChatParticipant.user_id == user_id
    ).first()
    if existing_participant:
        raise HTTPException(status_code=400, detail="User is already a participant")
    participant = models.ChatParticipant(user_id=user_id, chat_id=chat_id)
    db.add(participant)
    db.commit()
    chat_data = {
        "id": chat.id,
        "name": chat.name,
        "is_group": chat.is_group,
        "created_at": chat.created_at.isoformat(),
        "participants": [{"id": p.id, "username": p.username} for p in chat.participants]
    }
    await manager.notify_chat_update(chat.id, "participant_update", chat_data)
    return {"message": "Successfully added participant"}

@router.post("/direct/{user_id}", response_model=schemas.Chat)
async def create_direct_chat(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        target_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        existing_chat = db.query(models.Chat).filter(
            models.Chat.is_group == False,
            models.Chat.participants.contains(current_user),
            models.Chat.participants.contains(target_user)
        ).first()
        if existing_chat:
            chat_data = {
                "id": existing_chat.id,
                "name": existing_chat.name,
                "is_private": existing_chat.is_group == False,
                "created_at": existing_chat.created_at.isoformat(),
                "participants": [{"id": p.id, "username": p.username} for p in existing_chat.participants]
            }
            await manager.notify_user_chats_update(current_user.id, chat_data)
            await manager.notify_user_chats_update(user_id, chat_data)
            return existing_chat
        chat = models.Chat(
            name=f"Direct Message with {target_user.username}",
            is_group=False
        )
        chat.participants = [current_user, target_user]
        db.add(chat)
        db.commit()
        db.refresh(chat)
        chat_data = {
            "id": chat.id,
            "name": chat.name,
            "is_private": chat.is_group == False,
            "created_at": chat.created_at.isoformat(),
            "participants": [{"id": p.id, "username": p.username} for p in chat.participants]
        }
        await manager.notify_user_chats_update(current_user.id, chat_data)
        await manager.notify_user_chats_update(user_id, chat_data)
        return chat
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 
    


