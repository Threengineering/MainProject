

# MainProject - Today's Widget Dashboard

## 1. Vision Statement
매일 아침 여러 앱을 일일이 확인할 필요 없이 단 하나의 위젯 화면에서 하루 시작에 필요한 모든 정보(뉴스, 날씨, 일정, 주식)를 직관적으로 파악할 수 있게 하는 것

## 2. Project Goals & Scope
### Goals
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

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
