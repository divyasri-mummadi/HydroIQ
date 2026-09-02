import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
from google.genai import types

load_dotenv()

router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Fast model for real-time HydroIQ operator chat
GEMINI_MODEL = "gemini-3.5-flash-lite"

gemini_client = None

if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=30000
        ),
    )


class AIChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None


class AIChatResponse(BaseModel):
    response: str
    status: str


HYDROIQ_SYSTEM_PROMPT = """
You are HydroIQ Intelligence Copilot.

HydroIQ is an IoT smart water network monitoring platform.

You help operators understand:

- pressure
- flow
- acoustic anomalies
- pH
- TDS
- turbidity
- sensor health
- leak detection
- water quality
- Water Risk Score
- ML predictions
- alerts
- maintenance priorities

RULES:

1. Use only the HydroIQ context provided.
2. Never invent sensor readings.
3. Distinguish measurements from interpretation.
4. If data is unavailable, say so.
5. Explain evidence behind suspected leaks.
6. Do not confuse SENSOR_FAULT with a physical leak.
7. Identify abnormal water-quality measurements.
8. Explain important risk factors.
9. Give practical operator actions.
10. Keep responses concise.
11. Never claim to physically control infrastructure.

For incidents use:

Assessment:
Evidence:
Risk:
Recommended action:
"""


@router.get("/status")
def ai_status():
    return {
        "status": "online" if gemini_client else "not_configured",
        "provider": "Google Gemini",
        "model": GEMINI_MODEL,
        "thinking": "minimal",
    }


@router.post("/chat", response_model=AIChatResponse)
def ai_chat(request: AIChatRequest):

    if not gemini_client:
        return AIChatResponse(
            response="GEMINI_API_KEY is not configured.",
            status="not_configured",
        )

    message = request.message.strip()

    if not message:
        return AIChatResponse(
            response="Please enter a question.",
            status="invalid_request",
        )

    context_text = str(request.context or {})

    prompt = f"""
{HYDROIQ_SYSTEM_PROMPT}

CURRENT HYDROIQ CONTEXT:
{context_text}

OPERATOR QUESTION:
{message}

Give a concise HydroIQ-specific answer.
"""

    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=180,
                thinking_config=types.ThinkingConfig(
                    thinking_level="minimal"
                ),
            ),
        )

        answer = response.text

        if not answer:
            return AIChatResponse(
                response="Gemini returned an empty response.",
                status="empty_response",
            )

        return AIChatResponse(
            response=answer.strip(),
            status="success",
        )

    except Exception as exc:

        error_message = f"{type(exc).__name__}: {str(exc)}"

        print("========== GEMINI DEBUG ==========")
        print(error_message)
        print("===================================")

        return AIChatResponse(
            response=error_message,
            status="gemini_error",
        )