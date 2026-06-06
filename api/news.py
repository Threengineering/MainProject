from fastapi import APIRouter
import urllib.parse
import httpx
import feedparser

router = APIRouter()

@router.get("/{keyword}")
async def get_news(keyword: str, limit: int = 5):
    try:
        encoded_keyword = urllib.parse.quote(keyword)
        rss_url = f"https://news.google.com/rss/search?q={encoded_keyword}&hl=ko&gl=KR&ceid=KR:ko"

        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        async with httpx.AsyncClient() as client:
            response = await client.get(rss_url, headers=headers, timeout=5)
        feed = feedparser.parse(response.content)
        
        news_items = []
        for entry in feed.entries[:limit]:  # 상위 limit개 뉴스
            news_items.append({
                "title": entry.title,
                "link": entry.link,
                "published": entry.published
            })
            
        return {
            "keyword": keyword,
            "news": news_items
        }
    except Exception as e:
        return {"error": str(e)}
