from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import stock, news

app = FastAPI()

# 2. 허용할 주소(오리진) 목록 설정
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# 3. CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           # 특정 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],             # 모든 HTTP 메서드(GET, POST 등) 허용
    allow_headers=["*"],             # 모든 헤더 허용
)

# 4. 각 라우터 연결
app.include_router(stock.router, prefix="/api/stock", tags=["Stock"])
app.include_router(news.router, prefix="/api/news", tags=["News"])
#test