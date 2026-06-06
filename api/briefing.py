import os
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai

router = APIRouter()
api_key = os.getenv("GEMINI_API_KEY")

class BriefingRequest(BaseModel):
    weather: Optional[str] = None
    news: Optional[str] = None
    stock: Optional[str] = None
    todo: Optional[str] = None

@router.post("/generate")
async def generate_briefing(req: BriefingRequest):
    if not api_key or api_key == "여기에_발급받은_API_키를_입력하세요":
        raise HTTPException(status_code=500, detail="Gemini API 키가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 입력해 주세요.")

    prompt = f"""
당신은 친절하고 활기찬 아침 라디오 DJ입니다.
아래 제공된 사용자 데이터를 바탕으로 자연스럽고 듣기 좋은 라디오 브리핑 대본을 작성해주세요.
인사말로 시작해서, 날씨, 주요 뉴스, 주식 상황, 그리고 오늘의 할 일 순서로 자연스럽게 넘어가며 설명해주세요.
너무 길지 않게, 자연스럽게 읽을 수 있는 분량으로 작성하고, 마무리는 활기찬 응원으로 끝내주세요.
특수문자나 이모지는 TTS 음성 합성이 읽을 때 어색할 수 있으므로 최대한 한글 텍스트로만 작성해주세요. 예를 들어 18도씨, 달러 상승, 퍼센트처럼 풀어서 쓰세요.
음악은 넣지 않는다.
대사를 만드는 것이기에 'DJ:'이런 것 넣지 않는다.

[데이터]
날씨: {req.weather or '데이터 없음'}
뉴스: {req.news or '데이터 없음'}
주식: {req.stock or '데이터 없음'}
할일: {req.todo or '데이터 없음'}
"""
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        return {"script": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"대본 생성 중 오류가 발생했습니다: {str(e)}")
