TIME_SENSITIVE_WORDS = [
    "current",
    "currently",
    "today",
    "today's",
    "latest",
    "recent",
    "live",
    "now",
]

REAL_TIME_TOPICS = [
    "bitcoin price",
    "ethereum price",
    "stock price",
    "weather",
    "exchange rate",
    "news",
]


def needs_web_search(question: str) -> bool:
    question_lower = question.lower().strip()

    has_time_indicator = any(
        word in question_lower
        for word in TIME_SENSITIVE_WORDS
    )

    has_real_time_topic = any(
        topic in question_lower
        for topic in REAL_TIME_TOPICS
    )

    return has_time_indicator or has_real_time_topic