from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    last_seen: datetime

    class Config:
        from_attributes = True

class ChatBase(BaseModel):
    name: str
    is_group: bool = False

class ChatCreate(ChatBase):
    participant_ids: List[int]

class Chat(ChatBase):
    id: int
    created_at: datetime
    participants: List[User]

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    content: str
    file_url: Optional[str] = None
    filetype: Optional[str] = None
    filename: Optional[str] = None

class MessageCreate(MessageBase):
    chat_id: int

class Message(MessageBase):
    id: int
    timestamp: datetime
    sender_id: int
    chat_id: int
    is_read: bool
    sender: User

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None 