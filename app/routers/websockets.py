from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..database import get_db
from ..websockets.manager import manager
from ..models import models
import json

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "join_chat":
                    chat_id = msg.get("chat_id")
                    if chat_id:
                        await manager.join_chat(user_id, chat_id)
                elif msg.get("type") == "message":
                    chat_id = msg.get("chat_id")
                    content = msg.get("content")
                    if chat_id and content:
                        # Check if user is a participant in the chat
                        is_participant = db.execute(
                            select(models.user_chat).where(
                                (models.user_chat.c.user_id == user_id) &
                                (models.user_chat.c.chat_id == chat_id)
                            )
                        ).first()
                        if not is_participant:
                            await websocket.send_text(json.dumps({"type": "error", "message": "Not authorized to send messages to this chat"}))
                            continue
                        # Save message to DB
                        db_message = models.Message(
                            content=content,
                            chat_id=chat_id,
                            sender_id=user_id
                        )
                        db.add(db_message)
                        db.commit()
                        db.refresh(db_message)
                        # Fetch sender username
                        sender = db.query(models.User).filter(models.User.id == user_id).first()
                        message_data = {
                            "id": db_message.id,
                            "content": db_message.content,
                            "created_at": db_message.timestamp.isoformat(),
                            "sender_id": user_id,
                            "chat_id": chat_id,
                            "sender": {"username": sender.username if sender else "Unknown"}
                        }
                        await manager.broadcast_to_chat(chat_id, {
                            "type": "message",
                            "message": message_data
                        })
            except Exception as e:
                print("WebSocket message handling error:", e)
    except WebSocketDisconnect:
        manager.disconnect(user_id) 