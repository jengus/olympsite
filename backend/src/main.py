from fastapi import Depends, FastAPI
from auth.users import fastapi_users, auth_backend
from auth.schemas import UserCreate, UserRead, UserUpdate
from fastapi.middleware.cors import CORSMiddleware
from auth.rolerouter import router as router_roles
from auth.router import router as auth_router
from olymp.router import router as router_olymps

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    router_roles
)


app.include_router(
    router_olymps
)
app.include_router(
    fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"]
)

app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)
app.include_router(auth_router, prefix="/customusers", tags=["reg"])
@app.get("/")
async def root():
    return {"message": "Testing your app"}
