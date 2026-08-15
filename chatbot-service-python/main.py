import os
from functools import lru_cache
from typing import Any

from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from groq import Groq

app = FastAPI(title="VaccineCare Groq Chatbot", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

VACCINATION_TERMS = {
    "vaccine", "vaccination", "immunization", "immunisation", "dose", "booster",
    "bcg", "polio", "opv", "ipv", "hepatitis", "pentavalent", "dpt", "dtap",
    "mmr", "mr", "pcv", "rotavirus", "measles", "rubella", "tetanus", "pertussis",
    "influenza", "flu shot", "covid", "chickenpox", "varicella", "typhoid",
    "injection", "side effect", "fever after", "missed dose", "schedule",
    "newborn", "infant", "baby", "child", "pediatric", "paediatric",
}

SYSTEM_PROMPT = """
You are VaccineCare AI, a careful child-vaccination information assistant for parents in India.

Scope:
- Answer only questions about childhood vaccines, immunisation schedules, vaccine benefits,
  common side effects, missed or delayed doses, appointment preparation, after-care,
  and vaccine records.
- Politely decline unrelated questions in one sentence.

Response quality:
- Give a useful and complete answer, not a one-line response.
- Start with a direct answer, then use short headings and bullets when helpful.
- Explain what is normally expected, what the parent can do, and when to contact a doctor.
- When age, vaccine name, previous doses, or country schedule changes the answer,
  clearly ask for the missing detail.
- Use simple language suitable for a parent.
- Do not invent a child's schedule or claim a diagnosis.
- Do not replace a pediatrician or vaccination clinic.
- For breathing difficulty, facial swelling, seizure, unconsciousness, severe weakness,
  or a rapidly worsening reaction, advise emergency medical care immediately.
- Mention that schedules can differ by national programme, private pediatric guidance,
  medical history, and previous doses.
- Never provide unsafe instructions, dosage calculations, or instructions to skip a
  medically recommended vaccine.

Answer length:
- Usually 180 to 450 words for an explanation.
- A simple factual question may be shorter but should still include practical context.
""".strip()


def is_related(message: str) -> bool:
    text = message.lower()
    return any(term in text for term in VACCINATION_TERMS)


def extract_message(payload: Any) -> str:
    """Accept request bodies used by React, Spring Boot, Swagger, and Postman."""
    if isinstance(payload, str):
        message = payload
    elif isinstance(payload, dict):
        message = payload.get("message") or payload.get("question") or payload.get("prompt")
        if message is None and isinstance(payload.get("data"), dict):
            nested = payload["data"]
            message = nested.get("message") or nested.get("question") or nested.get("prompt")
    else:
        message = None

    if not isinstance(message, str) or not message.strip():
        raise HTTPException(
            status_code=400,
            detail='Send JSON such as {"message":"Which vaccines are due at 6 weeks?"}',
        )

    message = message.strip()
    if len(message) > 4000:
        raise HTTPException(status_code=400, detail="Message must not exceed 4000 characters")
    return message


@lru_cache(maxsize=1)
def get_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key or api_key == "put-your-groq-api-key-here":
        raise RuntimeError("GROQ_API_KEY is not configured")
    return Groq(api_key=api_key, timeout=45.0, max_retries=2)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": (
                'Invalid request. Send Content-Type: application/json with body '
                '{"message":"your vaccination question"}.'
            ),
            "errors": exc.errors(),
        },
    )


@app.get("/")
def root():
    return {
        "service": "VaccineCare Groq Chatbot",
        "health": "/health",
        "chat": "/api/chat",
        "exampleBody": {"message": "Which vaccines are due at 6 weeks?"},
    }


@app.get("/health")
def health():
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    configured = bool(api_key and api_key != "put-your-groq-api-key-here")
    return {
        "status": "UP" if configured else "CONFIGURATION_REQUIRED",
        "provider": "GroqCloud",
        "sdk": "groq-python",
        "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "apiKeyConfigured": configured,
    }


@app.post("/api/chat")
def chat(payload: Any = Body(...)):
    message = extract_message(payload)
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

    if not is_related(message):
        return {
            "answer": (
                "I can help only with child vaccination, immunisation schedules, "
                "vaccine side effects, missed doses, and vaccine-related appointment guidance."
            ),
            "vaccination_related": False,
            "model": model,
        }

    try:
        completion = get_client().chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
            temperature=0.25,
            max_completion_tokens=1000,
            stream=False,
        )
        answer = completion.choices[0].message.content
        if not isinstance(answer, str) or not answer.strip():
            raise RuntimeError("Groq returned an empty answer")

        return {
            "answer": answer.strip(),
            "vaccination_related": True,
            "model": model,
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        name = exc.__class__.__name__
        message_text = str(exc)
        if "Authentication" in name or "401" in message_text:
            detail = "Groq authentication failed. Create a new API key and update GROQ_API_KEY."
            status = 401
        elif "RateLimit" in name or "429" in message_text:
            detail = "Groq rate limit reached. Wait briefly and try again."
            status = 429
        elif "timeout" in message_text.lower():
            detail = "Groq request timed out. Please try again."
            status = 504
        else:
            detail = f"Groq request failed: {message_text}"
            status = 502
        raise HTTPException(status_code=status, detail=detail) from exc
