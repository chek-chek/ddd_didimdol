# python_backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import uvicorn

# 기존 코드 import
from api import ask_rag_chatbot, load_prompt, insert_prompt

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    chat_history: List[Dict[str, str]] = []


class ChatResponse(BaseModel):
    answer: str


class AnalyzeResponse(BaseModel):
    type: str
    solution: str
    reason: str


@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        answer = ask_rag_chatbot(request.message, request.chat_history)
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze(request: ChatRequest):
    try:
        answer = {
            "type": "placeholder type",
            "solution": "placeholder solution",
            "reason": "placeholder reason",
        }
        return AnalyzeResponse(**answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/prompts/{prompt_name}")
async def get_prompt(prompt_name: str):
    try:
        prompt = load_prompt(prompt_name)
        return {"prompt": prompt}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/prompts/{prompt_name}")
async def update_prompt(prompt_name: str, prompt_text: str):
    try:
        insert_prompt(prompt_name, prompt_text)
        return {"message": "Prompt updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
