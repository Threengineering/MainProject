from fastapi import APIRouter, HTTPException
import urllib.parse
import httpx
import feedparser

router = APIRouter()

@router.get("/{keyword}")
async def get_news(keyword: str, limit: int = 5):
    encoded_keyword = urllib.parse.quote(keyword)
    rss_url = f"https://news.google.com/rss/search?q={encoded_keyword}&hl=ko&gl=KR&ceid=KR:ko"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(rss_url, headers=headers, timeout=5)
        feed = feedparser.parse(response.content)
        news_items = [
            {"title": e.title, "link": e.link, "published": e.published}
            for e in feed.entries[:limit]
        ]
        return {"keyword": keyword, "news": news_items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
