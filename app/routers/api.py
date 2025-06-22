from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .chats import router as chats_router
from .messages import router as messages_router
from .websockets import router as websockets_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(users_router)
router.include_router(chats_router)
router.include_router(messages_router)
router.include_router(websockets_router) 