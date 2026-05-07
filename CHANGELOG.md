📄 README.md (프로젝트 설정 가이드)
이 대시보드는 M3 맥북 환경에서 최적화되었으며, React와 FastAPI를 동시에 실행해야 모든 위젯(특히 주식)이 정상 작동합니다.

1. 필수 환경 변수 설정 (.env)
프로젝트 루트 폴더에 제가 전달하는 .env 파일을 적용해야 하지만, 원활한 프로젝트 진행을 위해 push 했습니다.

Plaintext
# Supabase 설정
2. 백엔드 설정 (FastAPI)
주가 실시간 연동을 위해 파이썬 서버가 필요합니다.

필수 라이브러리 설치:
Bash
pip install fastapi uvicorn yfinance

서버 실행:
Bash
# main.py가 있는 위치에서 실행
uvicorn main:app --reload --port 8000
(package.json 에서 서버 실행과 프론트엔드 실행을 동시에 할 수 있도록 npm start 로 통일했습니다. 즉 , 필수 라이브러리들 다운받으시고 npm start 실행하시면 동시에 두 서버가 실행됩니다.)
3. 프론트엔드 설정 (React/Vite)
패키지 설치: npm install

개발 서버 실행: npm run dev (또는 npm start)

동시 실행 팁: concurrently를 설치했다면 npm start 하나로 두 서버를 동시에 켤 수 있습니다.

🛠 주요 변경 및 추가 사항 

주식 위젯(StockWidget) 전용 컴포넌트 구현: Widgets.jsx에서 주식 로직을 분리하여 StockWidget.jsx를 신설했습니다.

FastAPI 중계 서버 도입: 브라우저 CORS 정책 문제를 해결하고 yfinance를 통해 실시간 주가 및 전일 대비 등락률을 가져오는 백엔드를 구축했습니다.

Supabase DB 연동: 사용자가 등록한 관심 종목(Ticker) 리스트는 Supabase의 profiles 테이블에 배열 형태로 영구 저장됩니다.

동적 레이아웃 시스템: 등록된 종목 수에 따라 위젯 내부 격자(Grid) 크기가 자동으로 조절되도록 설계했습니다.