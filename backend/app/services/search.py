import os
import re
from urllib.parse import urlparse

from dotenv import load_dotenv
from tavily import TavilyClient


# ========================================
# LOAD ENVIRONMENT VARIABLES
# ========================================

load_dotenv()

api_key = os.getenv("TAVILY_API_KEY")

if not api_key:
    raise ValueError(
        "TAVILY_API_KEY is not set in the .env file"
    )


# ========================================
# TAVILY CLIENT
# ========================================

tavily_client = TavilyClient(
    api_key=api_key
)


# ========================================
# SEARCH SETTINGS
# ========================================

SEARCH_RESULTS_TO_FETCH = 8
SEARCH_RESULTS_TO_RETURN = 5


# ========================================
# SOURCE HELPERS
# ========================================

def get_domain(url: str) -> str:
    """
    Extract a clean domain name from a URL.

    Example:
        https://www.example.com/article
        -> example.com
    """

    if not url:
        return ""

    try:
        domain = urlparse(url).netloc.lower()

        if domain.startswith("www."):
            domain = domain[4:]

        return domain

    except Exception:
        return ""


def get_source_name(domain: str) -> str:
    """
    Convert a domain into a readable source name.
    """

    if not domain:
        return "Web Source"

    source_names = {
        "google.com": "Google",
        "blog.google": "Google",

        "github.com": "GitHub",

        "wikipedia.org": "Wikipedia",

        "youtube.com": "YouTube",

        "reuters.com": "Reuters",

        "bbc.com": "BBC",
        "bbc.co.uk": "BBC",

        "cnn.com": "CNN",

        "nytimes.com": "The New York Times",

        "techcrunch.com": "TechCrunch",

        "medium.com": "Medium",

        "stackoverflow.com": "Stack Overflow",

        "microsoft.com": "Microsoft",

        "apple.com": "Apple",

        "openai.com": "OpenAI",

        "developers.google.com": "Google Developers",

        "finance.yahoo.com": "Yahoo Finance",

        "arxiv.org": "arXiv",

        "nature.com": "Nature",

        "forbes.com": "Forbes",

        "theverge.com": "The Verge",

        "wired.com": "Wired",

        "coinmarketcap.com": "CoinMarketCap",

        "coindesk.com": "CoinDesk",

        "cointelegraph.com": "Cointelegraph",
    }

    if domain in source_names:
        return source_names[domain]

    return domain


# ========================================
# CONTENT CLEANING
# ========================================

def clean_content(
    content: str,
    max_length: int = 500,
) -> str:
    """
    Clean and shorten search-result content
    for displaying in the frontend.

    Removes:
        - Markdown headings
        - Markdown emphasis
        - Markdown links
        - Common truncation artifacts
        - Excessive whitespace
    """

    if not content:
        return ""

    content = str(content).strip()

    # ----------------------------------------
    # REMOVE MARKDOWN HEADINGS
    # ----------------------------------------

    content = re.sub(
        r"#{1,6}\s*",
        "",
        content,
    )

    # ----------------------------------------
    # REMOVE MARKDOWN BOLD / ITALIC
    # ----------------------------------------

    content = re.sub(
        r"\*\*(.*?)\*\*",
        r"\1",
        content,
    )

    content = re.sub(
        r"__(.*?)__",
        r"\1",
        content,
    )

    content = re.sub(
        r"\*(.*?)\*",
        r"\1",
        content,
    )

    content = re.sub(
        r"_(.*?)_",
        r"\1",
        content,
    )

    # ----------------------------------------
    # CLEAN MARKDOWN LINKS
    #
    # [text](url) -> text
    # ----------------------------------------

    content = re.sub(
        r"\[([^\]]+)\]\([^)]+\)",
        r"\1",
        content,
    )

    # ----------------------------------------
    # REMOVE COMMON TRUNCATION ARTIFACTS
    # ----------------------------------------

    content = re.sub(
        r"\[\s*\.\.\.\s*\]",
        "",
        content,
    )

    content = re.sub(
        r"\(\s*\.\.\.\s*\)",
        "",
        content,
    )

    # ----------------------------------------
    # NORMALIZE EXCESSIVE ELLIPSIS
    # ----------------------------------------

    content = re.sub(
        r"\.{4,}",
        "...",
        content,
    )

    # ----------------------------------------
    # NORMALIZE WHITESPACE
    # ----------------------------------------

    content = re.sub(
        r"\s+",
        " ",
        content,
    ).strip()

    # ----------------------------------------
    # REMOVE SPACE BEFORE PUNCTUATION
    # ----------------------------------------

    content = re.sub(
        r"\s+([,.!?;:])",
        r"\1",
        content,
    )

    # ----------------------------------------
    # LIMIT LENGTH
    # ----------------------------------------

    if len(content) <= max_length:
        return content

    shortened = content[:max_length].rstrip()

    # Try to end at a complete word.
    last_space = shortened.rfind(" ")

    if last_space > max_length * 0.75:
        shortened = shortened[:last_space]

    return shortened.rstrip(".,;: ") + "..."


# ========================================
# QUERY CLASSIFICATION
# ========================================

def detect_search_topic(query: str) -> str:
    """
    Detect a broad Tavily search topic.

    Returns:
        - finance
        - news
        - general
    """

    query_lower = query.lower()

    finance_keywords = [
        "bitcoin",
        "btc",
        "ethereum",
        "eth",
        "crypto",
        "cryptocurrency",
        "stock",
        "stocks",
        "share price",
        "share market",
        "market price",
        "nasdaq",
        "nyse",
        "forex",
        "exchange rate",
        "gold price",
        "silver price",
        "oil price",
        "financial",
        "finance",
    ]

    news_keywords = [
        "latest news",
        "recent news",
        "breaking news",
        "news today",
        "what happened",
        "latest update",
        "recent update",
        "today's news",
        "current events",
    ]

    if any(
        keyword in query_lower
        for keyword in finance_keywords
    ):
        return "finance"

    if any(
        keyword in query_lower
        for keyword in news_keywords
    ):
        return "news"

    return "general"


# ========================================
# QUERY ENHANCEMENT
# ========================================

def enhance_search_query(query: str) -> str:
    """
    Add useful context for time-sensitive queries.

    We do not rewrite normal technical/general
    questions unnecessarily.
    """

    query_lower = query.lower()

    time_sensitive_terms = [
        "latest",
        "current",
        "currently",
        "today",
        "now",
        "recent",
        "live",
    ]

    is_time_sensitive = any(
        term in query_lower
        for term in time_sensitive_terms
    )

    if not is_time_sensitive:
        return query

    topic = detect_search_topic(query)

    if topic == "finance":
        return f"{query} current latest market data"

    if topic == "news":
        return f"{query} latest recent information"

    return query


# ========================================
# RESULT RELEVANCE
# ========================================

def get_result_score(result: dict) -> float:
    """
    Safely extract Tavily's relevance score.
    """

    try:
        return float(
            result.get("score", 0)
        )
    except (
        TypeError,
        ValueError,
    ):
        return 0.0


def deduplicate_results(
    results: list[dict],
) -> list[dict]:
    """
    Remove duplicate URLs and duplicate domains
    where possible.

    Keeps the highest-scoring result.
    """

    seen_urls = set()
    seen_domains = set()

    unique_results = []

    for result in results:

        url = (
            str(result.get("url", ""))
            .strip()
            .lower()
        )

        domain = (
            str(result.get("domain", ""))
            .strip()
            .lower()
        )

        # Skip duplicate URLs.
        if url and url in seen_urls:
            continue

        # Avoid filling all source slots with
        # the same website.
        if domain and domain in seen_domains:
            continue

        if url:
            seen_urls.add(url)

        if domain:
            seen_domains.add(domain)

        unique_results.append(result)

    return unique_results


# ========================================
# WEB SEARCH
# ========================================

def search_web(query: str) -> list[dict]:
    """
    Search the web using Tavily.

    Pipeline:

        User query
            ↓
        Query enhancement
            ↓
        Tavily search
            ↓
        Relevance score
            ↓
        Sort results
            ↓
        Remove duplicates
            ↓
        Return top results

    Returns structured source information:

        {
            "title": str,
            "content": str,
            "snippet": str,
            "url": str,
            "domain": str,
            "source_name": str,
            "score": float
        }
    """

    query = query.strip()

    if not query:
        return []

    # ----------------------------------------
    # ENHANCE QUERY
    # ----------------------------------------

    search_query = enhance_search_query(query)

    # ----------------------------------------
    # DETECT TOPIC
    # ----------------------------------------

    topic = detect_search_topic(
        search_query
    )

    # ----------------------------------------
    # TAVILY SEARCH
    # ----------------------------------------

    search_arguments = {
        "query": search_query,
        "search_depth": "basic",
        "max_results": SEARCH_RESULTS_TO_FETCH,
    }

    # Tavily supports topic-specific search.
    if topic in {"finance", "news"}:
        search_arguments["topic"] = topic

    try:
        response = tavily_client.search(
            **search_arguments
        )

    except Exception as error:
        print(
            "❌ Tavily search failed:",
            error,
        )

        return []

    results = response.get(
        "results",
        [],
    )

    if not results:
        return []

    # ----------------------------------------
    # SORT BY TAVILY RELEVANCE SCORE
    # ----------------------------------------

    results.sort(
        key=get_result_score,
        reverse=True,
    )

    # ----------------------------------------
    # FORMAT RESULTS
    # ----------------------------------------

    formatted_results = []

    for result in results:

        title = result.get(
            "title",
            "",
        )

        content = result.get(
            "content",
            "",
        )

        url = result.get(
            "url",
            "",
        )

        score = get_result_score(
            result
        )

        # ------------------------------------
        # CLEAN VALUES
        # ------------------------------------

        title = (
            str(title).strip()
            if title
            else "Web Source"
        )

        content = (
            str(content).strip()
            if content
            else ""
        )

        url = (
            str(url).strip()
            if url
            else ""
        )

        # ------------------------------------
        # SOURCE INFORMATION
        # ------------------------------------

        domain = get_domain(url)

        source_name = get_source_name(
            domain
        )

        # ------------------------------------
        # CLEAN SNIPPET
        # ------------------------------------

        snippet = clean_content(
            content,
            max_length=500,
        )

        # ------------------------------------
        # STORE STRUCTURED SOURCE
        # ------------------------------------

        formatted_results.append(
            {
                "title": title,
                "content": content,
                "snippet": snippet,
                "url": url,
                "domain": domain,
                "source_name": source_name,
                "score": round(score, 4),
            }
        )

    # ----------------------------------------
    # REMOVE DUPLICATES
    # ----------------------------------------

    formatted_results = deduplicate_results(
        formatted_results
    )

    # ----------------------------------------
    # RETURN TOP RESULTS
    # ----------------------------------------

    formatted_results = formatted_results[
        :SEARCH_RESULTS_TO_RETURN
    ]

    print(
        f"🔎 Search query: {search_query}"
    )

    print(
        f"📚 Search topic: {topic}"
    )

    print(
        f"📊 Sources returned: "
        f"{len(formatted_results)}"
    )

    for index, result in enumerate(
        formatted_results,
        start=1,
    ):
        print(
            f"  {index}. "
            f"{result['domain']} "
            f"(score={result['score']})"
        )

    return formatted_results


# ========================================
# FORMAT SEARCH RESULTS FOR GEMINI
# ========================================

def format_search_results(
    results: list[dict],
) -> str:
    """
    Convert structured web sources into
    clean text for Gemini.

    The frontend uses the structured
    results from search_web().
    """

    if not results:
        return (
            "No web search results were found."
        )

    formatted_results = []

    for index, result in enumerate(
        results,
        start=1,
    ):

        title = result.get(
            "title",
            "Untitled",
        )

        content = result.get(
            "content",
            "",
        )

        url = result.get(
            "url",
            "",
        )

        domain = result.get(
            "domain",
            "",
        )

        source_name = result.get(
            "source_name",
            "Web Source",
        )

        score = result.get(
            "score",
            0,
        )

        # ------------------------------------
        # CLEAN CONTENT FOR GEMINI
        # ------------------------------------

        cleaned_content = clean_content(
            content,
            max_length=1200,
        )

        formatted_results.append(
            f"Source {index}\n"
            f"Source Name: {source_name}\n"
            f"Domain: {domain}\n"
            f"Relevance Score: {score}\n"
            f"Title: {title}\n"
            f"Content: {cleaned_content}\n"
            f"URL: {url}"
        )

    return "\n\n".join(
        formatted_results
    )


# ========================================
# LOCAL TEST
# ========================================

if __name__ == "__main__":

    print(
        "\n🚀 Testing Tavily web search...\n"
    )

    test_query = (
        "What is the latest Bitcoin price?"
    )

    results = search_web(
        test_query
    )

    print(
        "\n========== RESULTS ==========\n"
    )

    for index, result in enumerate(
        results,
        start=1,
    ):

        print(
            f"{index}. {result['title']}"
        )

        print(
            f"   Source: "
            f"{result['source_name']}"
        )

        print(
            f"   Domain: "
            f"{result['domain']}"
        )

        print(
            f"   Score: "
            f"{result['score']}"
        )

        print(
            f"   URL: "
            f"{result['url']}"
        )

        print(
            f"   Snippet: "
            f"{result['snippet'][:200]}..."
        )

        print()