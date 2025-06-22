from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Store active connections: {user_id: WebSocket}
        self.active_connections: Dict[int, WebSocket] = {}
        # Store chat rooms: {chat_id: List[user_id]}
        self.chat_rooms: Dict[int, List[int]] = {}
        # Store user's active chats: {user_id: List[chat_id]}
        self.user_chats: Dict[int, List[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        if user_id not in self.user_chats:
            self.user_chats[user_id] = []

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_chats:
            del self.user_chats[user_id]
        # Remove user from all chat rooms
        for chat_id in self.chat_rooms:
            if user_id in self.chat_rooms[chat_id]:
                self.chat_rooms[chat_id].remove(user_id)

    async def join_chat(self, user_id: int, chat_id: int):
        if chat_id not in self.chat_rooms:
            self.chat_rooms[chat_id] = []
        if user_id not in self.chat_rooms[chat_id]:
            self.chat_rooms[chat_id].append(user_id)
        if user_id not in self.user_chats:
            self.user_chats[user_id] = []
        if chat_id not in self.user_chats[user_id]:
            self.user_chats[user_id].append(chat_id)

    async def leave_chat(self, user_id: int, chat_id: int):
        if chat_id in self.chat_rooms and user_id in self.chat_rooms[chat_id]:
            self.chat_rooms[chat_id].remove(user_id)
        if user_id in self.user_chats and chat_id in self.user_chats[user_id]:
            self.user_chats[user_id].remove(chat_id)

    async def broadcast_to_chat(self, chat_id: int, message: dict):
        if chat_id in self.chat_rooms:
            for user_id in self.chat_rooms[chat_id]:
                if user_id in self.active_connections:
                    await self.active_connections[user_id].send_json(message)

    async def notify_chat_update(self, chat_id: int, update_type: str, chat_data: dict):
        """Notify all participants of a chat about updates"""
        if chat_id in self.chat_rooms:
            for user_id in self.chat_rooms[chat_id]:
                if user_id in self.active_connections:
                    await self.active_connections[user_id].send_json({
                        "type": "chat_update",
                        "update_type": update_type,
                        "chat": chat_data
                    })

    async def notify_user_chats_update(self, user_id: int, chat_data: dict):
        """Notify a specific user about their chat list updates"""
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json({
                "type": "chats_update",
                "chat": chat_data
            })

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager() 