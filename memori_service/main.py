"""Minimal FastAPI wrapper around Memori.

Run with:
  uvicorn memori_service.main:app --host 0.0.0.0 --port 8001

Env vars:
  MEMORI_DATABASE__CONNECTION_STRING  - Postgres/MySQL/SQLite connection string
  OPENAI_API_KEY                      - API key used by Memori + LLM calls
  OPENAI_MODEL                        - Model name (default: gpt-4o-mini)
  MEMORI_MEMORY__NAMESPACE            - Optional namespace for segmentation
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from memori import Memori
from openai import OpenAI
import os


app = FastAPI(title="Memori Memory Service")

BASE_MEMORI_CONFIG = {
    "database_connect": os.getenv("MEMORI_DATABASE__CONNECTION_STRING"),
    "conscious_ingest": True,
    "auto_ingest": True,
    "openai_api_key": os.getenv("OPENAI_API_KEY"),
}

DEFAULT_NAMESPACE = os.getenv("MEMORI_MEMORY__NAMESPACE", "default")


def build_memori(namespace: str, user_id: str | None) -> Memori:
    # Instantiate per request to avoid cross-namespace bleed in the OpenAI hook
    instance = Memori(
        **BASE_MEMORI_CONFIG,
        namespace=namespace,
        user_id=user_id,
        session_id=user_id or "default",
    )
    instance.enable()
    return instance


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ChatRequest(BaseModel):
    user_id: str
    message: str
    stats: dict | None = None


@app.get("/healthz")
def healthcheck():
    return {"status": "ok"}


@app.post("/chat")
def chat(req: ChatRequest):
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    namespace = f"user-{req.user_id}" if req.user_id else DEFAULT_NAMESPACE
    memori = build_memori(namespace, req.user_id)

    stats_context = ""
    if req.stats:
        stats_context = (
            "User learning stats (use as context, keep private): "
            f"total_points={req.stats.get('total_points')}, "
            f"completed={req.stats.get('completed_challenges')}, "
            f"avg_score={req.stats.get('average_score')}, "
            f"attempts={req.stats.get('total_attempts')}"
        )

    chat_messages = []
    if stats_context:
        chat_messages.append({"role": "system", "content": stats_context})
    chat_messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=chat_messages,
        user=req.user_id,
    )
    # Memori hooks automatically ingest context; we just return the AI reply
    return {
        "reply": response.choices[0].message.content,
        "raw": response.model_dump(),
        "namespace": namespace,
    }
