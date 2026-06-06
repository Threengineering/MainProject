# Proto:Miracle - Today's Widget Dashboard

매일 아침 여러 앱을 일일이 확인할 필요 없이 단 하나의 위젯 화면에서 하루 시작에 필요한 모든 정보(뉴스, 날씨, 일정, 주식)를 직관적으로 파악할 수 있게 하는 통합 대시보드 서비스입니다.

---

## 🚀 최근 추가된 핵심 기능

1. **실시간 경제 지표 상단 바 표시**
   - 로그인된 사용자 이름 왼쪽에 **KOSPI 지수**와 **USD/KRW 환율** 정보가 상시 노출됩니다.
   - 전일 대비 지수 상승 시 **빨간색(▲)**, 하락 시 **파란색(▼)**으로 실시간 텍스트 색상이 변경됩니다. (1분 주기 자동 갱신)
2. **오늘의 브리핑(Radio) 위젯 음성 톤 사용자화**
   - 대본 낭독 시 사용자의 취향에 맞는 다양한 목소리 톤을 제공합니다.
   - 속도와 음높이(Pitch) 설정을 조합하여 **4가지 스타일 톤(기본/차분함/경쾌함/중후함)**을 드롭다운을 통해 선택 가능합니다.
   - 실제 OS 환경에 한국어 음성 엔진이 여러 개 활성화(민수, 유나 등)될 경우 각 음성과 톤이 결합된 풍부한 목소리 선택지가 자동으로 동적 제공됩니다.
   - 목소리 선택 드롭다운 UI의 가로 정렬 배치를 개선하여 위젯 제목 및 날짜 텍스트 아래에 정돈되도록 조정하였습니다.

---

## 🛠️ 실행 방법 (Running Locally)

로컬 개발 환경에서 백엔드 API 서버와 프론트엔드 개발 서버를 각각 구동합니다.

### 1. 백엔드 (FastAPI) 실행

FastAPI 서버는 포트 `8000`번에서 실행됩니다.

```bash
# 1. 가상환경 활성화 (macOS/Linux)
source venv/bin/activate

# (Windows 환경의 경우)
# venv\Scripts\activate

# 2. 필수 라이브러리 설치
pip install -r requirements.txt

# 3. FastAPI 개발 서버 실행 (자동 재로드 활성화)
python -m uvicorn main:app --reload
```

- API 문서 확인: `http://localhost:8000/docs`

---

### 2. 프론트엔드 (Vite + React) 실행

Vite 개발 서버는 포트 `5173`번에서 실행됩니다.

```bash
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 구동
npm run dev
```

- 서비스 접속: `http://localhost:5173`

---

## ⚙️ 환경 설정 (.env)

프로젝트 루트 폴더에 `.env` 파일을 작성해야 정상 동작합니다.

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📂 Project Goals & Scope
- 분산된 정보를 하나의 대시보드에 통합하여 사용자 경험 최적화.
- 사용자의 관심사(주요 뉴스 및 주식, To-Do 등)에 맞춘 개인화된 정보 제공.
- 클라우드 및 컨테이너 기술을 활용한 안정적이고 확장 가능한 시스템 구축.

### Scope
- In-Scope:
  - FastAPI 기반 백엔드 API 서버 구축.
  - 뉴스, 날씨, 주식 데이터 수집 및 가공.
  - 사용자별 To-Do List 관리 및 DB 연동.
  - Google OAuth 기반의 간편 로그인 및 개인화 설정.
  - Docker 및 Oracle Cloud를 활용한 서버 배포 및 CI/CD.
- Out-of-Scope:
  - AI로 해외의 뉴스까지 번역 및 요약 제공 (추후 검토).

## 3. Stakeholders & Users
### Stakeholders
- Threengineering Team: 프로젝트 설계, 개발 및 운영 주체.
- Third-party API Providers: 뉴스, 날씨, 주가 정보를 제공하는 외부 서비스.

### Users
- 바쁜 현대인: 출근 또는 등교 전 짧은 시간에 주요 정보를 확인하고자 하는 사용자.
- 개인 투자자: 설정한 주식 섹터나 종목의 주가를 실시간으로 모니터링하려는 사용자.
- 자기관리 사용자: To-Do List를 통해 일정을 관리하고 알림을 받고자 하는 사용자.

## 4. Milestone
- Phase 1: 인프라 및 인증 시스템 구축
  - GitHub Actions, Docker, Oracle Cloud 환경 설정.
  - Google OAuth 로그인 기능 구현.
- Phase 2: 핵심 데이터 연동 (Backend Focus)
  - 뉴스, 날씨, 주식 정보 API 연동 및 데이터 가공 로직 완성.
  - To-Do List CRUD 기능 개발.
- Phase 3: 프론트엔드 개발 및 UI 통합
  - 프레임워크 확정 및 대시보드 화면 구현.
  - 실시간 데이터 바인딩 및 반응형 웹 디자인 적용.
- Phase 4: 시스템 고도화 및 확장
  - 최적화, 보안 점검 및 PWA 지원.
  - 해외 뉴스 번역 기능 등 추가 기능 검토.

## 5. Github Address
- URL: https://github.com/Threengineering/MainProject
- Branch: Main
