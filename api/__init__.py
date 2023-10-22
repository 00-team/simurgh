
from fastapi import APIRouter

from api import admin, auth, user

router = APIRouter(
    prefix='/api',
)


router.include_router(auth.router)
router.include_router(admin.router)
router.include_router(user.router)
