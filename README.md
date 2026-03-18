# MainProject - Today's Widget Dashboard

사용자가 하루를 시작할 때 또는 오랜만에 위젯을 확인했을 때, 오늘 하루 꼭 알아야 할 모든 정보를 하나의 화면에서 간편하게 확인할 수 있도록 돕는 개인 맞춤형 위젯 대시보드 프로젝트입니다.

## 🌟 주요 기능

### 1. 최신 뉴스 브리핑 (News Widget)
- 사용자가 부재중이었던 시간 동안 쌓인 최신 뉴스를 요약하여 제공합니다.
- 핵심 이슈를 빠르게 파악하여 세상의 흐름을 놓치지 않게 도와줍니다.

### 2. 위치 기반 실시간 날씨 (Weather Widget)
- 사용자의 현재 위치를 기반으로 실시간 날씨 정보를 제공합니다.
- 단순히 현재 날씨뿐만 아니라, 해당 날의 시간별 예보를 통해 하루의 일정을 계획할 수 있도록 돕습니다.

### 3. 스마트 투두리스트 (ToDoList Widget)
- 오늘의 주요 일정을 강조하여 표시합니다.
- 내일의 일정은 하단에 작게 표시하여 다음날의 계획도 미리 인지할 수 있게 구성합니다.
- 사용자 개인 DB와 연동하여 관리됩니다.

### 4. 맞춤형 주식 정보 (Stock Widget)
- 사용자가 설정한 주식 섹터(분야)의 주요 주가를 자동으로 롤링(넘겨주기) 방식으로 보여줍니다.
- 또는 사용자가 직접 등록한 특정 종목의 실시간 주가 정보를 위젯에 띄워 모니터링할 수 있습니다.

## 🛠 기술 스택 (Tech Stack)

### Backend
- **Framework:** FastAPI (Python)
- **Database:** 사용자 데이터 관리를 위한 데이터베이스 (개발 난이도를 위해 SQLite가 유력)
- **Data Scraping:** API를 통한 뉴스 및 날씨 데이터 수집
- **Google Auth** 구글 아이디 로그인을 구현하여 사용자별 데이터 분리 및 로딩

### Frontend
- **Framework:** TBD (미정 - React, Vue.js, or Next.js 등 검토 예정)

### Infrastructure & DevOps
- **Cloud:** Oracle Cloud Infrastructure (OCI)
- **Containerization:** Docker
- **CI/CD:** GitHub Actions

## 🏗 시스템 아키텍처 (Architecture)

- **Web Application:** 대시보드 화면 접속 시 백엔드 API를 호출하여 데이터 로드.
- **External APIs:** 외부 뉴스 서비스 및 날씨 서비스 API를 활용하여 실시간 정보 수집.
- **Server:** Oracle Cloud 인스턴스 내에서 Docker 컨테이너 기반으로 서버 운영 및 배포 자동화.

## 📅 향후 계획 (Roadmap)
- 프론트엔드 프레임워크 확정 및 UI/UX 디자인 고도화
- 추가적인 맞춤형 위젯 기능 확장 (캘린더 연동, 알림 서비스 등)
- 모바일 최적화 및 PWA 지원
