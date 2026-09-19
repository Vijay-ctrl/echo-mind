import json

from datetime import datetime, timezone
from typing import Literal

from bson import ObjectId

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.responses import StreamingResponse

from pydantic import BaseModel, Field

from app.api.auth import get_current_user

from app.database import (
    chats_collection,
    messages_collection,
)

from app.services.gemini_client import (
    ask_gemini,
    stream_gemini,
)

from app.services.search import (
    search_web,
    format_search_results,
)

from app.utils.query_detector import (
    needs_web_search,
)

# ========================================
# ROUTER
# ========================================

router = APIRouter(
    prefix="/api",
    tags=["Chat"],
)


# ========================================
# HELPER FUNCTIONS
# ========================================


def utc_now():
    """
    Return the current UTC datetime.
    """

    return datetime.now(timezone.utc)


def normalize_datetime(value):
    """
    Make MongoDB datetime values safe for comparison.
    """

    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value


def is_after_memory_reset(
    message,
    memory_reset_at,
):
    """
    Return True when a message belongs to the
    current memory period.
    """

    if memory_reset_at is None:
        return True

    message_created_at = normalize_datetime(message.get("created_at"))

    reset_time = normalize_datetime(memory_reset_at)

    if message_created_at is None:
        return False

    return message_created_at >= reset_time


async def get_owned_chat(
    chat_id: str,
    user_id: str,
):
    """
    Validate a chat ID and make sure the chat belongs
    to the authenticated user.
    """

    try:

        chat_object_id = ObjectId(chat_id)

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid chat ID.",
        )

    chat = await chats_collection.find_one(
        {
            "_id": chat_object_id,
            "user_id": user_id,
        }
    )

    if not chat:

        raise HTTPException(
            status_code=404,
            detail="Chat not found.",
        )

    return chat_object_id, chat


def determine_web_search(
    message: str,
    mode: str,
):
    """
    Determine whether web search should be used.
    """

    if mode == "web":
        return True

    if mode == "gemini":
        return False

    return needs_web_search(message)


def get_memory_status(chat):
    """
    Return memory status for the frontend.
    """

    memory_reset_at = chat.get("memory_reset_at")

    interaction_id = chat.get("gemini_interaction_id")

    return {
        "active": bool(interaction_id),
        "reset_at": memory_reset_at,
    }


def is_gemini_limit_error(error):
    """
    Detect Gemini quota/rate-limit errors.

    Gemini-specific error handling stays in the backend.
    The frontend receives only EchoMind-specific error codes.
    """

    status_code = getattr(
        error,
        "code",
        None,
    )

    if status_code == 429:
        return True

    status_code = getattr(
        error,
        "status_code",
        None,
    )

    if status_code == 429:
        return True

    error_text = str(error).lower()

    limit_keywords = [
        "resource_exhausted",
        "quota exceeded",
        "quota_exceeded",
        "rate limit",
        "rate_limit",
        "too many requests",
        "429",
    ]

    return any(keyword in error_text for keyword in limit_keywords)


# ========================================
# REQUEST MODELS
# ========================================


class ChatRequest(BaseModel):

    message: str

    chat_id: str | None = None

    # auto   -> Automatically determine web search
    # gemini -> Gemini only
    # web    -> Always use web search

    mode: Literal[
        "auto",
        "gemini",
        "web",
    ] = "auto"

    # False -> Normal persistent chat
    # True  -> Temporary chat

    temporary: bool = False


class RegenerateRequest(BaseModel):

    chat_id: str

    message_id: str


class RenameChatRequest(BaseModel):

    title: str = Field(
        min_length=1,
        max_length=100,
    )


class FeedbackRequest(BaseModel):

    chat_id: str

    message_id: str

    feedback: Literal[
        "positive",
        "negative",
    ]


# ========================================
# CHAT
# ========================================


@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user=Depends(get_current_user),
):

    # ========================================
    # VALIDATE MESSAGE
    # ========================================

    message = request.message.strip()

    if not message:

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    user_id = str(current_user["_id"])

    now = utc_now()

    # ========================================
    # EXISTING CHAT
    # ========================================

    if request.chat_id:

        chat_object_id, chat = await get_owned_chat(
            request.chat_id,
            user_id,
        )

        chat_id = request.chat_id

        # Existing chat keeps its original
        # temporary/normal status.

        is_temporary = bool(
            chat.get(
                "temporary",
                False,
            )
        )

        previous_interaction_id = chat.get("gemini_interaction_id")

        await chats_collection.update_one(
            {
                "_id": chat_object_id,
                "user_id": user_id,
            },
            {
                "$set": {
                    "updated_at": now,
                }
            },
        )

    # ========================================
    # CREATE NEW CHAT
    # ========================================

    else:

        is_temporary = bool(request.temporary)

        chat_document = {
            "user_id": user_id,
            "title": message[:32],
            # Gemini memory
            "gemini_interaction_id": None,
            # Memory reset boundary
            "memory_reset_at": None,
            # Temporary chat
            "temporary": is_temporary,
            "created_at": now,
            "updated_at": now,
        }

        chat_result = await chats_collection.insert_one(chat_document)

        chat_id = str(chat_result.inserted_id)

        chat_object_id = chat_result.inserted_id

        previous_interaction_id = None

    # ========================================
    # SAVE USER MESSAGE
    # ========================================

    user_message = {
        "chat_id": chat_id,
        "user_id": user_id,
        "role": "user",
        "message": message,
        "sources": [],
        "used_web_search": False,
        "created_at": now,
    }

    await messages_collection.insert_one(user_message)

    # ========================================
    # DETERMINE WEB SEARCH
    # ========================================

    use_web_search = determine_web_search(
        message,
        request.mode,
    )

    search_results = []

    formatted_results = None

    web_search_error = None

    # ========================================
    # WEB SEARCH
    # ========================================

    if use_web_search:

        try:

            search_results = search_web(message)

            if search_results:

                formatted_results = format_search_results(search_results)

            else:

                formatted_results = None

        except Exception as error:

            print(
                "Web search error:",
                error,
            )

            search_results = []

            formatted_results = None

            web_search_error = "Web search was unavailable."

    # ========================================
    # ASK GEMINI
    # ========================================

    try:

        gemini_response = ask_gemini(
            prompt=message,
            previous_interaction_id=(previous_interaction_id),
            search_results=(formatted_results),
        )

        answer = gemini_response["answer"]

        new_interaction_id = gemini_response["interaction_id"]

    except Exception as error:

        print(
            "Gemini error:",
            error,
        )

        if is_gemini_limit_error(error):

            raise HTTPException(
                status_code=429,
                detail={
                    "code": "AI_LIMIT_REACHED",
                    "message": (
                        "EchoMind AI limit reached. " "Please try again later."
                    ),
                },
            )

        raise HTTPException(
            status_code=500,
            detail={
                "code": "AI_REQUEST_FAILED",
                "message": (
                    "EchoMind could not generate " "a response. Please try again later."
                ),
            },
        )

    # ========================================
    # UPDATE CHAT MEMORY
    # ========================================

    updated_at = utc_now()

    await chats_collection.update_one(
        {
            "_id": chat_object_id,
            "user_id": user_id,
        },
        {
            "$set": {
                "gemini_interaction_id": new_interaction_id,
                "updated_at": updated_at,
            }
        },
    )

    # ========================================
    # SAVE ASSISTANT MESSAGE
    # ========================================

    assistant_message = {
        "chat_id": chat_id,
        "user_id": user_id,
        "role": "assistant",
        "message": answer,
        "interaction_id": new_interaction_id,
        "sources": search_results,
        "used_web_search": use_web_search,
        "created_at": updated_at,
    }

    assistant_result = await messages_collection.insert_one(assistant_message)

    # ========================================
    # RESPONSE
    # ========================================

    return {
        "chat_id": chat_id,
        "answer": answer,
        "sources": search_results,
        "source_count": len(search_results),
        "used_web_search": use_web_search,
        "web_search_error": web_search_error,
        "mode": request.mode,
        "temporary": is_temporary,
        "interaction_id": new_interaction_id,
        "message_id": str(assistant_result.inserted_id),
    }


# ========================================
# STREAMING CHAT
# ========================================


@router.post("/chat/stream")
async def stream_chat(
    request: ChatRequest,
    current_user=Depends(get_current_user),
):
    """
    Stream Gemini responses using Server-Sent Events.

    The existing /api/chat endpoint remains unchanged.
    """

    # ========================================
    # VALIDATE MESSAGE
    # ========================================

    message = request.message.strip()

    if not message:

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    user_id = str(current_user["_id"])

    now = utc_now()

    # ========================================
    # EXISTING CHAT
    # ========================================

    if request.chat_id:

        chat_object_id, chat = await get_owned_chat(
            request.chat_id,
            user_id,
        )

        chat_id = request.chat_id

        # Existing chat keeps its original
        # temporary/normal status.

        is_temporary = bool(
            chat.get(
                "temporary",
                False,
            )
        )

        previous_interaction_id = chat.get("gemini_interaction_id")

        await chats_collection.update_one(
            {
                "_id": chat_object_id,
                "user_id": user_id,
            },
            {
                "$set": {
                    "updated_at": now,
                }
            },
        )

    # ========================================
    # CREATE NEW CHAT
    # ========================================

    else:

        is_temporary = bool(request.temporary)

        chat_document = {
            "user_id": user_id,
            "title": message[:32],
            # Gemini memory
            "gemini_interaction_id": None,
            # Memory reset boundary
            "memory_reset_at": None,
            # Temporary chat
            "temporary": is_temporary,
            "created_at": now,
            "updated_at": now,
        }

        chat_result = await chats_collection.insert_one(chat_document)

        chat_id = str(chat_result.inserted_id)

        chat_object_id = chat_result.inserted_id

        previous_interaction_id = None

    # ========================================
    # SAVE USER MESSAGE
    # ========================================

    user_message = {
        "chat_id": chat_id,
        "user_id": user_id,
        "role": "user",
        "message": message,
        "sources": [],
        "used_web_search": False,
        "created_at": now,
    }

    await messages_collection.insert_one(user_message)

    # ========================================
    # DETERMINE WEB SEARCH
    # ========================================

    use_web_search = determine_web_search(
        message,
        request.mode,
    )

    search_results = []

    formatted_results = None

    web_search_error = None

    # ========================================
    # WEB SEARCH
    # ========================================

    if use_web_search:

        try:

            search_results = search_web(message)

            if search_results:

                formatted_results = format_search_results(search_results)

            else:

                formatted_results = None

        except Exception as error:

            print(
                "Web search error:",
                error,
            )

            search_results = []

            formatted_results = None

            web_search_error = "Web search was unavailable."

    # ========================================
    # SSE EVENT HELPER
    # ========================================

    def make_event(data):

        return (
            "data: "
            + json.dumps(
                data,
                ensure_ascii=False,
            )
            + "\n\n"
        )

    # ========================================
    # STREAM EVENT GENERATOR
    # ========================================

    async def event_generator():

        full_answer = ""

        new_interaction_id = None

        try:

            # ========================================
            # START EVENT
            # ========================================

            yield make_event(
                {
                    "type": "start",
                    "chat_id": chat_id,
                    "mode": request.mode,
                    "temporary": is_temporary,
                    "used_web_search": use_web_search,
                    "web_search_error": web_search_error,
                }
            )

            # ========================================
            # START GEMINI STREAM
            # ========================================

            for event in stream_gemini(
                prompt=message,
                previous_interaction_id=(previous_interaction_id),
                search_results=(formatted_results),
            ):

                # ========================================
                # TEXT CHUNK
                # ========================================

                if event["type"] == "chunk":

                    chunk = event.get(
                        "text",
                        "",
                    )

                    if not chunk:
                        continue

                    full_answer += chunk

                    yield make_event(
                        {
                            "type": "chunk",
                            "text": chunk,
                        }
                    )

                # ========================================
                # COMPLETION EVENT
                # ========================================

                elif event["type"] == "complete":

                    new_interaction_id = event.get("interaction_id")

            # ========================================
            # VALIDATE ANSWER
            # ========================================

            if not full_answer.strip():

                raise ValueError("Gemini returned an empty response.")

            if not new_interaction_id:

                raise ValueError("Gemini did not return an interaction ID.")

            # ========================================
            # UPDATE CHAT MEMORY
            # ========================================

            updated_at = utc_now()

            await chats_collection.update_one(
                {
                    "_id": chat_object_id,
                    "user_id": user_id,
                },
                {
                    "$set": {
                        "gemini_interaction_id": new_interaction_id,
                        "updated_at": updated_at,
                    }
                },
            )

            # ========================================
            # SAVE ASSISTANT MESSAGE
            # ========================================

            assistant_message = {
                "chat_id": chat_id,
                "user_id": user_id,
                "role": "assistant",
                "message": full_answer,
                "interaction_id": new_interaction_id,
                "sources": search_results,
                "used_web_search": use_web_search,
                "created_at": updated_at,
            }

            assistant_result = await messages_collection.insert_one(assistant_message)

            # ========================================
            # COMPLETE EVENT
            # ========================================

            yield make_event(
                {
                    "type": "complete",
                    "chat_id": chat_id,
                    "message_id": str(assistant_result.inserted_id),
                    "interaction_id": new_interaction_id,
                    "sources": search_results,
                    "source_count": len(search_results),
                    "used_web_search": use_web_search,
                    "web_search_error": web_search_error,
                    "mode": request.mode,
                    "temporary": is_temporary,
                }
            )

        except Exception as error:

            print(
                "Streaming chat error:",
                error,
            )

            if is_gemini_limit_error(error):

                yield make_event(
                    {
                        "type": "error",
                        "code": "AI_LIMIT_REACHED",
                        "message": (
                            "EchoMind AI limit reached. " "Please try again later."
                        ),
                    }
                )

            else:

                yield make_event(
                    {
                        "type": "error",
                        "code": "AI_REQUEST_FAILED",
                        "message": (
                            "EchoMind could not generate "
                            "a response. Please try again later."
                        ),
                    }
                )

    # ========================================
    # RETURN SSE STREAM
    # ========================================

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ========================================
# SUBMIT MESSAGE FEEDBACK
# ========================================


@router.post("/chat/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    current_user=Depends(get_current_user),
):

    user_id = str(current_user["_id"])

    # ========================================
    # FIND OWNED CHAT
    # ========================================

    await get_owned_chat(
        request.chat_id,
        user_id,
    )

    # ========================================
    # VALIDATE MESSAGE ID
    # ========================================

    try:

        message_object_id = ObjectId(request.message_id)

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid message ID.",
        )

    # ========================================
    # FIND ASSISTANT MESSAGE
    # ========================================

    message = await messages_collection.find_one(
        {
            "_id": message_object_id,
            "chat_id": request.chat_id,
            "user_id": user_id,
            "role": "assistant",
        }
    )

    if not message:

        raise HTTPException(
            status_code=404,
            detail="Assistant message not found.",
        )

    # ========================================
    # SAVE FEEDBACK
    # ========================================

    feedback_updated_at = utc_now()

    await messages_collection.update_one(
        {
            "_id": message_object_id,
            "chat_id": request.chat_id,
            "user_id": user_id,
            "role": "assistant",
        },
        {
            "$set": {
                "feedback": request.feedback,
                "feedback_updated_at": feedback_updated_at,
            }
        },
    )

    # ========================================
    # RESPONSE
    # ========================================

    return {
        "success": True,
        "chat_id": request.chat_id,
        "message_id": request.message_id,
        "feedback": request.feedback,
        "updated_at": feedback_updated_at,
    }


# ========================================
# REGENERATE ANSWER
# ========================================


@router.post("/chat/regenerate")
async def regenerate_chat_message(
    request: RegenerateRequest,
    current_user=Depends(get_current_user),
):

    user_id = str(current_user["_id"])

    # ========================================
    # FIND OWNED CHAT
    # ========================================

    chat_object_id, chat = await get_owned_chat(
        request.chat_id,
        user_id,
    )

    # ========================================
    # VALIDATE MESSAGE ID
    # ========================================

    try:

        message_object_id = ObjectId(request.message_id)

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid message ID.",
        )

    # ========================================
    # GET MEMORY RESET TIME
    # ========================================

    memory_reset_at = chat.get("memory_reset_at")

    # ========================================
    # GET CHAT MESSAGES
    # ========================================

    messages_cursor = messages_collection.find(
        {
            "chat_id": request.chat_id,
            "user_id": user_id,
        }
    ).sort(
        "created_at",
        1,
    )

    messages = []

    async for message in messages_cursor:

        messages.append(message)

    if not messages:

        raise HTTPException(
            status_code=404,
            detail=("No messages found " "in this chat."),
        )

    # ========================================
    # FIND TARGET MESSAGE
    # ========================================

    target_index = None

    for index, message in enumerate(messages):

        if message["_id"] == message_object_id:

            target_index = index

            break

    if target_index is None:

        raise HTTPException(
            status_code=404,
            detail="Message not found.",
        )

    target_message = messages[target_index]

    # ========================================
    # ONLY ASSISTANT ANSWERS
    # ========================================

    if target_message.get("role") != "assistant":

        raise HTTPException(
            status_code=400,
            detail=("Only assistant answers " "can be regenerated."),
        )

    # ========================================
    # MEMORY RESET CHECK
    # ========================================

    if not is_after_memory_reset(
        target_message,
        memory_reset_at,
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This answer belongs to the "
                "conversation before memory "
                "was cleared and cannot be "
                "regenerated."
            ),
        )

    # ========================================
    # FIND LATEST ASSISTANT ANSWER
    # ========================================

    latest_assistant_index = None

    for index in range(
        len(messages) - 1,
        -1,
        -1,
    ):

        candidate = messages[index]

        if candidate.get("role") != "assistant":

            continue

        if not is_after_memory_reset(
            candidate,
            memory_reset_at,
        ):

            continue

        latest_assistant_index = index

        break

    if latest_assistant_index is None or target_index != latest_assistant_index:

        raise HTTPException(
            status_code=400,
            detail=("Only the latest assistant " "answer can be regenerated."),
        )

    # ========================================
    # FIND USER QUESTION
    # ========================================

    user_question = None

    for index in range(
        target_index - 1,
        -1,
        -1,
    ):

        candidate = messages[index]

        if candidate.get("role") != "user":

            continue

        if not is_after_memory_reset(
            candidate,
            memory_reset_at,
        ):

            continue

        user_question = candidate

        break

    if user_question is None:

        raise HTTPException(
            status_code=400,
            detail=("The user question for this " "answer could not be found."),
        )

    question = user_question.get(
        "message",
        "",
    ).strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="User question is empty.",
        )

    # ========================================
    # FIND PREVIOUS GEMINI INTERACTION
    # ========================================

    previous_interaction_id = None

    for index in range(
        target_index - 1,
        -1,
        -1,
    ):

        candidate = messages[index]

        if candidate.get("role") != "assistant":

            continue

        if not is_after_memory_reset(
            candidate,
            memory_reset_at,
        ):

            continue

        interaction_id = candidate.get("interaction_id")

        if interaction_id:

            previous_interaction_id = interaction_id

            break

    # ========================================
    # CHECK MEMORY CONSISTENCY
    # ========================================

    current_memory_assistant_messages = [
        message
        for message in messages
        if (
            message.get("role") == "assistant"
            and is_after_memory_reset(
                message,
                memory_reset_at,
            )
        )
    ]

    if len(current_memory_assistant_messages) > 1 and previous_interaction_id is None:

        raise HTTPException(
            status_code=400,
            detail=(
                "This conversation does not "
                "contain the required Gemini "
                "interaction memory for "
                "regeneration."
            ),
        )

    # ========================================
    # WEB SEARCH
    # ========================================

    use_web_search = bool(
        target_message.get(
            "used_web_search",
            False,
        )
    )

    search_results = []

    formatted_results = None

    web_search_error = None

    if use_web_search:

        try:

            search_results = search_web(question)

            if search_results:

                formatted_results = format_search_results(search_results)

        except Exception as error:

            print(
                "Web search error during " "regeneration:",
                error,
            )

            search_results = []

            formatted_results = None

            web_search_error = "Web search was unavailable."

    # ========================================
    # REGENERATE WITH GEMINI
    # ========================================

    try:

        gemini_response = ask_gemini(
            prompt=question,
            previous_interaction_id=(previous_interaction_id),
            search_results=(formatted_results),
        )

        new_answer = gemini_response["answer"]

        new_interaction_id = gemini_response["interaction_id"]

    except Exception as error:

        print(
            "Gemini regeneration error:",
            error,
        )

        if is_gemini_limit_error(error):

            raise HTTPException(
                status_code=429,
                detail={
                    "code": "AI_LIMIT_REACHED",
                    "message": (
                        "EchoMind AI limit reached. " "Please try again later."
                    ),
                },
            )

        raise HTTPException(
            status_code=500,
            detail={
                "code": "AI_REGENERATION_FAILED",
                "message": (
                    "EchoMind could not regenerate "
                    "the response. Please try again later."
                ),
            },
        )

    # ========================================
    # UPDATE ASSISTANT MESSAGE
    # ========================================

    update_result = await messages_collection.update_one(
        {
            "_id": message_object_id,
            "chat_id": request.chat_id,
            "user_id": user_id,
            "role": "assistant",
        },
        {
            "$set": {
                "message": new_answer,
                "interaction_id": new_interaction_id,
                "sources": search_results,
                "used_web_search": use_web_search,
                "updated_at": utc_now(),
            }
        },
    )

    if update_result.matched_count == 0:

        raise HTTPException(
            status_code=404,
            detail=("The assistant message " "could not be updated."),
        )

    # ========================================
    # UPDATE CHAT MEMORY
    # ========================================

    await chats_collection.update_one(
        {
            "_id": chat_object_id,
            "user_id": user_id,
        },
        {
            "$set": {
                "gemini_interaction_id": new_interaction_id,
                "updated_at": utc_now(),
            }
        },
    )

    # ========================================
    # RESPONSE
    # ========================================

    return {
        "success": True,
        "chat_id": request.chat_id,
        "message_id": request.message_id,
        "answer": new_answer,
        "sources": search_results,
        "source_count": len(search_results),
        "used_web_search": use_web_search,
        "web_search_error": web_search_error,
        "temporary": bool(
            chat.get(
                "temporary",
                False,
            )
        ),
        "interaction_id": new_interaction_id,
    }


# ========================================
# CLEAR MEMORY FOR ALL CHATS
# ========================================


@router.post("/clear-memory")
async def clear_memory(
    current_user=Depends(get_current_user),
):

    user_id = str(current_user["_id"])

    reset_time = utc_now()

    # IMPORTANT:
    # Do NOT update updated_at.

    result = await chats_collection.update_many(
        {
            "user_id": user_id,
        },
        {
            "$set": {
                "gemini_interaction_id": None,
                "memory_reset_at": reset_time,
            }
        },
    )

    return {
        "success": True,
        "message": "AI conversation memory cleared for all chats.",
        "memory_reset_at": reset_time,
        "chats_updated": result.modified_count,
    }


# ========================================
# CLEAR MEMORY FOR ONE CHAT
# ========================================


@router.post("/chats/{chat_id}/clear-memory")
async def clear_chat_memory(
    chat_id: str,
    current_user=Depends(get_current_user),
):

    user_id = str(current_user["_id"])

    # ========================================
    # FIND OWNED CHAT
    # ========================================

    chat_object_id, chat = await get_owned_chat(
        chat_id,
        user_id,
    )

    reset_time = utc_now()

    # ========================================
    # CLEAR ONLY THIS CHAT'S MEMORY
    # ========================================

    await chats_collection.update_one(
        {
            "_id": chat_object_id,
            "user_id": user_id,
        },
        {
            "$set": {
                "gemini_interaction_id": None,
                "memory_reset_at": reset_time,
            }
        },
    )

    return {
        "success": True,
        "message": "Memory cleared for this chat.",
        "chat_id": chat_id,
        "memory_reset_at": reset_time,
        "chat_title": chat.get(
            "title",
            "Untitled Chat",
        ),
        "temporary": bool(
            chat.get(
                "temporary",
                False,
            )
        ),
    }


# ========================================
# GET ALL NORMAL CHATS
# ========================================


@router.get("/chats")
async def get_chats(
    current_user=Depends(get_current_user),
):

    user_id = str(current_user["_id"])

    # ========================================
    # IMPORTANT
    # ========================================
    #
    # Temporary chats must NOT appear in
    # normal chat history.
    #
    # They are active server-side only while
    # the temporary session exists.
    #
    # They are deleted when the user exits
    # the temporary chat.

    chats_cursor = chats_collection.find(
        {
            "user_id": user_id,
            "temporary": {"$ne": True},
        }
    ).sort(
        "updated_at",
        -1,
    )

    chat_list = []

    async for chat in chats_cursor:

        chat_list.append(
            {
                "id": str(chat["_id"]),
                "title": chat.get(
                    "title",
                    "Untitled Chat",
                ),
                "created_at": chat.get("created_at"),
                "updated_at": chat.get("updated_at"),
                "temporary": False,
                "memory_active": bool(chat.get("gemini_interaction_id")),
                "memory_reset_at": chat.get("memory_reset_at"),
            }
        )

    return {"chats": chat_list}


# ========================================
# GET ONE CHAT WITH MESSAGES
# ========================================


@router.get("/chats/{chat_id}")
async def get_chat(
    chat_id: str,
    current_user=Depends(get_current_user),
):

    user_id = str(current_user["_id"])

    # ========================================
    # FIND OWNED CHAT
    # ========================================

    chat_object_id, chat = await get_owned_chat(
        chat_id,
        user_id,
    )

    # ========================================
    # GET MESSAGES
    # ========================================

    messages_cursor = messages_collection.find(
        {
            "chat_id": chat_id,
            "user_id": user_id,
        }
    ).sort(
        "created_at",
        1,
    )

    messages = []

    async for message in messages_cursor:

        messages.append(
            {
                "id": str(message["_id"]),
                "role": message.get("role"),
                "message": message.get(
                    "message",
                    "",
                ),
                # ========================================
                # BETTER WEB SOURCES
                # ========================================
                "sources": message.get(
                    "sources",
                    [],
                ),
                "used_web_search": bool(
                    message.get(
                        "used_web_search",
                        False,
                    )
                ),
                "interaction_id": message.get("interaction_id"),
                "feedback": message.get("feedback"),
                "created_at": message.get("created_at"),
            }
        )

    # ========================================
    # RESPONSE
    # ========================================

    return {
        "id": str(chat_object_id),
        "title": chat.get(
            "title",
            "Untitled Chat",
        ),
        "created_at": chat.get("created_at"),
        "updated_at": chat.get("updated_at"),
        "temporary": bool(
            chat.get(
                "temporary",
                False,
            )
        ),
        "memory": get_memory_status(chat),
        "messages": messages,
    }


# ========================================
# RENAME CHAT
# ========================================


@router.patch("/chats/{chat_id}")
async def rename_chat(
    chat_id: str,
    request: RenameChatRequest,
    current_user=Depends(get_current_user),
):

    user_id = str(current_user["_id"])

    # ========================================
    # FIND OWNED CHAT
    # ========================================

    chat_object_id, chat = await get_owned_chat(
        chat_id,
        user_id,
    )

    # ========================================
    # DON'T RENAME TEMPORARY CHATS
    # ========================================

    if chat.get(
        "temporary",
        False,
    ):

        raise HTTPException(
            status_code=400,
            detail=("Temporary chats cannot be renamed."),
        )

    # ========================================
    # VALIDATE TITLE
    # ========================================

    new_title = request.title.strip()

    if not new_title:

        raise HTTPException(
            status_code=400,
            detail="Chat title cannot be empty.",
        )

    if len(new_title) > 100:

        raise HTTPException(
            status_code=400,
            detail=("Chat title cannot exceed " "100 characters."),
        )

    # ========================================
    # UPDATE TITLE
    # ========================================

    updated_at = utc_now()

    await chats_collection.update_one(
        {
            "_id": chat_object_id,
            "user_id": user_id,
        },
        {
            "$set": {
                "title": new_title,
                "updated_at": updated_at,
            }
        },
    )

    # ========================================
    # RESPONSE
    # ========================================

    return {
        "success": True,
        "chat_id": chat_id,
        "title": new_title,
        "updated_at": updated_at,
    }


# ========================================
# DELETE CHAT
# ========================================


@router.delete("/chats/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user=Depends(get_current_user),
):

    user_id = str(current_user["_id"])

    # ========================================
    # FIND OWNED CHAT
    # ========================================

    chat_object_id, chat = await get_owned_chat(
        chat_id,
        user_id,
    )

    # ========================================
    # DELETE MESSAGES
    # ========================================

    await messages_collection.delete_many(
        {
            "chat_id": chat_id,
            "user_id": user_id,
        }
    )

    # ========================================
    # DELETE CHAT
    # ========================================

    await chats_collection.delete_one(
        {
            "_id": chat_object_id,
            "user_id": user_id,
        }
    )

    # ========================================
    # RESPONSE
    # ========================================

    return {
        "success": True,
        "message": "Chat deleted successfully.",
        "chat_id": chat_id,
        "temporary": bool(
            chat.get(
                "temporary",
                False,
            )
        ),
    }
