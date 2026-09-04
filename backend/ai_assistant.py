import os
import json
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

# Fast model for real-time HydroIQ operator intelligence
GEMINI_MODEL = "gemini-3.5-flash-lite"


gemini_client = None


if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=60000
        ),
    )


# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

class AIChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None
    conversation: Optional[list] = None


class AIChatResponse(BaseModel):
    response: str
    status: str


# ============================================================
# HYDROIQ INTELLIGENCE SYSTEM
# ============================================================

HYDROIQ_SYSTEM_PROMPT = """
You are HydroIQ Intelligence Copilot.

You are an AI operations analyst for HydroIQ, an IoT smart water
network monitoring platform.

Your job is NOT to behave like a generic chatbot.

Your job is to help a water-network operator understand the live
condition of the monitored network and decide what deserves attention.

============================================================
HYDROIQ SIGNALS
============================================================

HydroIQ can monitor:

- pressure
- flow
- acoustic activity
- pH
- TDS
- turbidity
- sensor health
- leak state
- ML prediction
- ML confidence
- Water Risk Score
- alerts
- maintenance priority
- historical sensor behavior
- zone condition

============================================================
CORE REASONING RULES
============================================================

1. Use only information contained in the supplied HydroIQ context.

2. NEVER invent sensor readings, zones, alerts, timestamps,
   probabilities, causes, or events.

3. Clearly distinguish:
   - observed measurement
   - historical pattern
   - AI interpretation
   - recommended action

4. Never treat a SENSOR_FAULT as automatically meaning a physical
   water leak.

5. Never treat an acoustic spike alone as proof of a leak.

6. Look for combinations of evidence.

7. For possible leaks, consider combinations such as:
   - pressure decrease
   - flow increase
   - acoustic increase
   - persistent abnormal behavior
   - ML leak prediction
   - repeated abnormal readings

8. For sensor faults, consider:
   - impossible or unstable readings
   - sudden discontinuities
   - contradictory sensor behavior
   - explicit SENSOR_FAULT classification
   - abnormal behavior isolated to one measurement

9. For water quality, consider:
   - pH
   - TDS
   - turbidity
   - persistence of abnormal readings
   - whether the analytics layer already classified water quality

10. For trends, compare historical observations with current
    observations whenever sufficient history exists.

11. Distinguish:
    - temporary spike
    - repeated anomaly
    - sustained trend
    - confirmed incident

12. If history is insufficient, explicitly say:
    "Insufficient historical evidence."

13. Never claim certainty when the supplied evidence is ambiguous.

14. If several signals agree, explain how they reinforce one another.

15. If signals disagree, explain the disagreement instead of hiding it.

============================================================
RISK REASONING
============================================================

When discussing risk:

- explain the important factors
- identify the affected zone
- identify the strongest evidence
- distinguish current risk from historical risk
- avoid exaggerating low-risk situations

A NORMAL zone with a low Water Risk Score should not be presented
as an emergency.

============================================================
TREND REASONING
============================================================

When historical data is available:

Look for:

- pressure direction
- flow direction
- acoustic direction
- pH movement
- TDS movement
- turbidity movement
- sensor instability
- repeated state transitions
- recurring leak patterns
- recurring sensor faults

When possible, describe trends using words such as:

- increasing
- decreasing
- stable
- fluctuating
- intermittent
- persistent
- newly abnormal
- recovering
- worsening

Do not manufacture numerical percentage changes unless the supplied
data actually supports the calculation.

============================================================
ROOT-CAUSE REASONING
============================================================

When asked why something is happening:

Provide evidence-based hypotheses.

Use language such as:

- "Most consistent with..."
- "Possible explanation..."
- "The evidence suggests..."
- "This cannot be confirmed from the available data..."

Do not claim physical root cause unless the data explicitly proves it.

============================================================
OPERATOR ACTIONS
============================================================

Recommended actions should be practical and conservative.

Examples:

- continue monitoring
- inspect the affected zone
- verify the relevant sensor
- compare neighboring sensors
- inspect for possible leakage
- check sensor connectivity
- investigate water-quality deviation
- prioritize maintenance inspection
- escalate if the condition persists

Never claim to physically control valves, pumps, infrastructure,
or field equipment.

============================================================
RESPONSE STYLE
============================================================

Be concise but intelligent.

For incident or diagnostic questions, use:

Assessment:
Evidence:
Trend:
Risk:
Likely explanation:
Recommended action:
Confidence:

For simple questions, do not force every section.

For network questions:

Network status:
Key finding:
Highest concern:
Recommended action:

For trend questions:

Trend summary:
Observed changes:
What it may indicate:
Recommended action:

For maintenance questions:

Priority:
Reason:
Evidence:
Recommended action:

Always prioritize actionable information over generic explanation.

============================================================
CONFIDENCE
============================================================

Confidence is an assessment of the quality of the supplied evidence,
NOT a machine-learning probability unless an actual ML confidence
value is provided.

Use:

High
Medium
Low

and explain briefly when confidence is not high.

============================================================
CONVERSATION
============================================================

You may use recent conversation messages to understand follow-up
questions.

However, current HydroIQ telemetry and analytics always take priority
over conversational assumptions.

============================================================
FINAL SAFETY RULE
============================================================

You are decision support.

Never pretend to have access to information that was not supplied.

Never pretend to control infrastructure.

Never hide uncertainty.
"""


# ============================================================
# HELPERS
# ============================================================

def clean_context(context: Optional[dict]) -> dict:
    """
    Keep the AI context structured while preventing accidental
    oversized requests.
    """

    if not context:
        return {
            "data_available": False,
            "message": "No HydroIQ context was supplied.",
        }

    cleaned = dict(context)

    # Keep only the most useful history records if history is large.
    history = cleaned.get("sensor_history")

    if isinstance(history, dict):
        history_copy = dict(history)

        for key, value in list(history_copy.items()):
            if isinstance(value, list) and len(value) > 120:
                history_copy[key] = value[-120:]

        cleaned["sensor_history"] = history_copy

    elif isinstance(history, list):
        cleaned["sensor_history"] = history[-120:]

    return cleaned


def clean_conversation(conversation: Optional[list]) -> list:
    """
    Keep recent conversation memory only.
    """

    if not conversation:
        return []

    cleaned = []

    for item in conversation[-6:]:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        text = item.get("text")

        if role in {"user", "assistant"} and text:
            cleaned.append({
                "role": role,
                "text": str(text)[:800],
            })

    return cleaned


def build_prompt(
    message: str,
    context: Optional[dict],
    conversation: Optional[list],
) -> str:

    safe_context = clean_context(context)
    safe_conversation = clean_conversation(conversation)

    context_json = json.dumps(
        safe_context,
        indent=2,
        default=str,
    )

    conversation_json = json.dumps(
        safe_conversation,
        indent=2,
        default=str,
    )

    return f"""
{HYDROIQ_SYSTEM_PROMPT}

============================================================
CURRENT HYDROIQ CONTEXT
============================================================

{context_json}

============================================================
RECENT OPERATOR CONVERSATION
============================================================

{conversation_json}

============================================================
CURRENT OPERATOR QUESTION
============================================================

{message}

============================================================
TASK
============================================================

Answer the operator using the HydroIQ evidence above.

Reason across current readings, historical trends, alerts, risk,
water quality, sensor health, and ML information when available.

Do not invent missing information.

Give the most useful operational answer first.
"""


# ============================================================
# STATUS
# ============================================================

@router.get("/status")
def ai_status():

    return {
        "status": "online" if gemini_client else "not_configured",
        "provider": "Google Gemini",
        "model": GEMINI_MODEL,
        "thinking": "minimal",
        "capabilities": [
            "live_network_analysis",
            "historical_trend_analysis",
            "leak_reasoning",
            "sensor_fault_reasoning",
            "water_quality_analysis",
            "risk_analysis",
            "maintenance_guidance",
            "conversation_memory",
            "uncertainty_awareness",
        ],
    }


# ============================================================
# CHAT
# ============================================================

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

    prompt = build_prompt(
        message=message,
        context=request.context,
        conversation=request.conversation,
    )

    try:

        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=220,
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
            response=(
                "HydroIQ AI is temporarily unavailable because the Gemini "
                "request timed out. Live telemetry and analytics are still "
                "available. Please retry in a few seconds."
            ),
            status="gemini_timeout",
        )