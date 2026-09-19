import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from app.database import users_collection
from app.models.user import (
    UserCreate,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.email import send_password_reset_email
from app.utils.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


security = HTTPBearer()


# =========================================================
# REGISTER
# =========================================================

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(user: UserCreate):
    # Normalize email
    normalized_email = user.email.lower().strip()

    # Check whether email already exists
    existing_user = await users_collection.find_one(
        {"email": normalized_email}
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Hash password
    password_hash = hash_password(user.password)

    # Create user document
    user_document = {
        "email": normalized_email,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc),

        # Password reset fields
        "reset_password_token": None,
        "reset_password_expires": None,
    }

    # Insert user
    result = await users_collection.insert_one(
        user_document
    )

    user_id = str(result.inserted_id)

    # Create JWT
    access_token = create_access_token(user_id)

    response_user = UserResponse(
        id=user_id,
        email=normalized_email,
        created_at=user_document["created_at"],
    )

    return TokenResponse(
        access_token=access_token,
        user=response_user,
    )


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(user: UserCreate):
    # Normalize email
    normalized_email = user.email.lower().strip()

    # Find user
    existing_user = await users_collection.find_one(
        {"email": normalized_email}
    )

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Verify password
    if not verify_password(
        user.password,
        existing_user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_id = str(existing_user["_id"])

    # Create JWT
    access_token = create_access_token(user_id)

    response_user = UserResponse(
        id=user_id,
        email=existing_user["email"],
        created_at=existing_user["created_at"],
    )

    return TokenResponse(
        access_token=access_token,
        user=response_user,
    )


# =========================================================
# CURRENT USER
# =========================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
):
    # Get token from Authorization header
    token = credentials.credentials

    # Decode JWT
    user_id = decode_access_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    # Convert string ID to MongoDB ObjectId
    try:
        object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID.",
        )

    # Find user
    current_user = await users_collection.find_one(
        {"_id": object_id}
    )

    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    return current_user


# =========================================================
# GET CURRENT USER
# =========================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_me(
    current_user=Depends(get_current_user),
):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        created_at=current_user["created_at"],
    )


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
):
    normalized_email = request.email.lower().strip()

    # Find account
    user = await users_collection.find_one(
        {"email": normalized_email}
    )

    # Always return the same message.
    # This prevents revealing whether an email exists.
    success_message = (
        "If an account exists for that email, "
        "a password reset link has been sent."
    )

    if not user:
        return {
            "success": True,
            "message": success_message,
        }

    # -----------------------------------------------------
    # Generate secure random reset token
    # -----------------------------------------------------

    reset_token = secrets.token_urlsafe(32)

    # Store only a hash of the token in MongoDB
    hashed_token = hashlib.sha256(
        reset_token.encode("utf-8")
    ).hexdigest()

    # Token expires after 15 minutes
    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=15)
    )

    # Save token hash + expiry
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_password_token": hashed_token,
                "reset_password_expires": expires_at,
            }
        },
    )

    # -----------------------------------------------------
    # Create frontend reset URL
    # -----------------------------------------------------

    import os

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")

    reset_url = (
        f"{frontend_url}/reset-password"
        f"?token={reset_token}"
    )

    # -----------------------------------------------------
    # Send reset email
    # -----------------------------------------------------

    try:
        await send_password_reset_email(
            recipient_email=user["email"],
            reset_url=reset_url,
        )

    except Exception as error:
        print(
            "Password reset email error:",
            error,
        )

        # Remove invalid reset token if email failed
        await users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "reset_password_token": None,
                    "reset_password_expires": None,
                }
            },
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to send password reset email. "
                "Please try again later."
            ),
        )

    return {
        "success": True,
        "message": success_message,
    }


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    token: str,
):
    # Check token exists
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token is required.",
        )

    # Hash token received from frontend
    hashed_token = hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

    # Find user with valid token
    user = await users_collection.find_one(
        {
            "reset_password_token": hashed_token,
            "reset_password_expires": {
                "$gt": datetime.now(timezone.utc)
            },
        }
    )

    # Token invalid or expired
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Password reset token is invalid "
                "or has expired."
            ),
        )

    # Hash new password
    new_password_hash = hash_password(
        request.password
    )

    # Update password and invalidate token
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": new_password_hash,

                # Token can only be used once
                "reset_password_token": None,
                "reset_password_expires": None,
            }
        },
    )

    return {
        "success": True,
        "message": (
            "Password reset successful. "
            "You can now log in."
        ),
    }