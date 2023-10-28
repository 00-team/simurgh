
from fastapi import APIRouter

from api import admin, auth, user
from api.verification import VerificationResponse, verification
from shared.errors import bad_verification

router = APIRouter(
    prefix='/api',
)

router.add_api_route(
    '/verification/', verification, methods=['POST'],
    openapi_extra={'errors': [bad_verification]},
    response_model=VerificationResponse,
    description=(
        'send verification for an action that requires code verification<br/>'
        'like deleteing user account or login'
    )
)


router.include_router(auth.router)
router.include_router(admin.router)
router.include_router(user.router)
