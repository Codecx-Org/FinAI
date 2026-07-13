"""
Language detection utility for the FinAI AI service.
Detects Swahili vs English from the input message to auto-set language.
"""
import re

# Common Swahili function words and greetings
_SWAHILI_MARKERS = {
    "habari", "hujambo", "sijambo", "mambo", "niambie", "nipe", "onyesha",
    "bidhaa", "wateja", "agizo", "malipo", "hesabu", "faida", "gharama",
    "omba", "tafadhali", "asante", "karibu", "sawa", "ndio", "hapana",
    "bei", "idadi", "jumla", "orodha", "ongeza", "futa", "haraka",
    "fedha", "akaunti", "biashara", "mteja", "ununuzi", "uuzaji",
}

_SWAHILI_PATTERN = re.compile(
    r'\b(' + '|'.join(_SWAHILI_MARKERS) + r')\b',
    re.IGNORECASE
)


def detect_language(text: str) -> str:
    """
    Detect whether the text is likely Swahili ('sw') or English ('en').
    Returns 'sw' if 2+ Swahili markers are found, else 'en'.
    """
    matches = _SWAHILI_PATTERN.findall(text.lower())
    return "sw" if len(matches) >= 2 else "en"


def resolve_language(requested: str | None, message: str) -> str:
    """
    Resolve final language:
    - If client explicitly passed 'sw' or 'en', respect it.
    - Otherwise auto-detect from the message content.
    """
    if requested in ("sw", "en"):
        return requested
    return detect_language(message)
