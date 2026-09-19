import os

from dotenv import load_dotenv
from google import genai


# ========================================
# LOAD ENVIRONMENT VARIABLES
# ========================================

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY is not set in the .env file"
    )


# ========================================
# GEMINI CLIENT
# ========================================

client = genai.Client(
    api_key=api_key
)


# Gemini model used by the application
MODEL = "gemini-3.6-flash"


# ========================================
# ASK GEMINI
# ========================================

def ask_gemini(
    prompt: str,
    previous_interaction_id: str | None = None,
    search_results: str | None = None,
):
    """
    Send a prompt to Gemini using the
    Interactions API.

    Parameters:
        prompt:
            User's question.

        previous_interaction_id:
            ID of the previous Gemini interaction.
            Used to maintain conversation memory.

        search_results:
            Optional Tavily search results.
            These are included in the prompt when
            web search is being used.

    Returns:
        {
            "answer": str,
            "interaction_id": str
        }
    """

    # ========================================
    # VALIDATE PROMPT
    # ========================================

    prompt = prompt.strip()

    if not prompt:
        raise ValueError(
            "Gemini prompt cannot be empty."
        )


    # ========================================
    # ADD WEB SEARCH RESULTS
    # ========================================

    if search_results:

        prompt = f"""
Answer the user's question using the web search
results below.

Important instructions:

- Use the search results as the source of current information.
- Do not claim that you personally browsed the internet.
- Do not invent current information.
- If the search results are insufficient, clearly say so.
- Give a concise and useful answer.

User question:

{prompt}

Web search results:

{search_results}
"""


    # ========================================
    # BUILD GEMINI REQUEST
    # ========================================

    interaction_args = {
        "model": MODEL,
        "input": prompt,
    }


    # ========================================
    # ADD CONVERSATION MEMORY
    # ========================================

    if previous_interaction_id:

        interaction_args[
            "previous_interaction_id"
        ] = previous_interaction_id


    # ========================================
    # CALL GEMINI
    # ========================================

    interaction = client.interactions.create(
        **interaction_args
    )


    # ========================================
    # VALIDATE GEMINI RESPONSE
    # ========================================

    answer = interaction.output_text
    interaction_id = interaction.id

    if not answer:
        raise ValueError(
            "Gemini returned an empty response."
        )

    if not interaction_id:
        raise ValueError(
            "Gemini did not return an interaction ID."
        )


    # ========================================
    # RETURN RESPONSE
    # ========================================

    return {
        "answer": answer,
        "interaction_id": interaction_id,
    }


# ========================================
# STREAM GEMINI
# ========================================

def stream_gemini(
    prompt: str,
    previous_interaction_id: str | None = None,
    search_results: str | None = None,
):
    """
    Stream Gemini response using the
    Interactions API.

    Yields:

        {
            "type": "chunk",
            "text": "..."
        }

    and finally:

        {
            "type": "complete",
            "interaction_id": "..."
        }
    """

    # ========================================
    # VALIDATE PROMPT
    # ========================================

    prompt = prompt.strip()

    if not prompt:
        raise ValueError(
            "Gemini prompt cannot be empty."
        )


    # ========================================
    # ADD WEB SEARCH RESULTS
    # ========================================

    if search_results:

        prompt = f"""
Answer the user's question using the web search
results below.

Important instructions:

- Use the search results as the source of current information.
- Do not claim that you personally browsed the internet.
- Do not invent current information.
- If the search results are insufficient, clearly say so.
- Give a concise and useful answer.

User question:

{prompt}

Web search results:

{search_results}
"""


    # ========================================
    # BUILD STREAMING REQUEST
    # ========================================

    interaction_args = {
        "model": MODEL,
        "input": prompt,
        "stream": True,
    }


    # ========================================
    # ADD CONVERSATION MEMORY
    # ========================================

    if previous_interaction_id:

        interaction_args[
            "previous_interaction_id"
        ] = previous_interaction_id


    # ========================================
    # START GEMINI STREAM
    # ========================================

    stream = client.interactions.create(
        **interaction_args
    )


    interaction_id = None


    # ========================================
    # PROCESS STREAM EVENTS
    # ========================================

    for event in stream:

        # ------------------------------------
        # INTERACTION CREATED
        # ------------------------------------

        if event.event_type == "interaction.created":

            interaction = getattr(
                event,
                "interaction",
                None,
            )

            if interaction:

                interaction_id = (
                    interaction.id
                )


        # ------------------------------------
        # TEXT DELTA
        # ------------------------------------

        elif event.event_type == "step.delta":

            delta = getattr(
                event,
                "delta",
                None,
            )

            if not delta:
                continue

            if getattr(
                delta,
                "type",
                None,
            ) == "text":

                text = getattr(
                    delta,
                    "text",
                    "",
                )

                if text:

                    yield {
                        "type": "chunk",
                        "text": text,
                    }


        # ------------------------------------
        # INTERACTION COMPLETED
        # ------------------------------------

        elif (
            event.event_type
            == "interaction.completed"
        ):

            interaction = getattr(
                event,
                "interaction",
                None,
            )

            if interaction:

                interaction_id = (
                    interaction.id
                )


    # ========================================
    # VALIDATE INTERACTION ID
    # ========================================

    if not interaction_id:

        raise ValueError(
            "Gemini did not return an interaction ID."
        )


    # ========================================
    # STREAM COMPLETED
    # ========================================

    yield {
        "type": "complete",
        "interaction_id": interaction_id,
    }


# ========================================
# STREAMING TEST
# ========================================

if __name__ == "__main__":

    print(
        "🚀 Starting Gemini streaming test...\n"
    )

    for event in stream_gemini(
        "Explain binary search in simple terms."
    ):

        if event["type"] == "chunk":

            print(
                event["text"],
                end="",
                flush=True,
            )

        elif event["type"] == "complete":

            print(
                "\n\n✅ Streaming completed."
            )

            print("\nInteraction ID:")

            print(
                event["interaction_id"]
            )