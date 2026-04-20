from fastapi import APIRouter

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("/test")
def test():
    return {"message": "Profile router is working"}