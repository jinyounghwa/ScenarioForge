# ScenarioForge — 시나리오 관리 시스템

## 목표
로컬 컴퓨터에서만 실행되는 시나리오 작성·정리 도구.
데이터는 서버 파일시스템(JSON)에 저장한다. 브라우저 저장소 미사용.

## 사용자
시나리오 작가, 웹툰 작가, 게임 기획자 등 1인 창작자.

## 핵심 기능 (4개)
1. **웹 에디터** — 제목 + 본문 작성. 제목 단위로 씬(Scene)이 쌓임
2. **씬 검색** — 제목 기준 실시간 필터링
3. **인물 태그** — 본문에 `@인물명` 태그 삽입. 태그별 씬·대사·언급 검색 및 이동
4. **대시보드** — 인물별 등장 씬 수 / 대사 수 / 언급 수 집계

## 기술 스택
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **에디터**: TipTap (@mention 확장)
- **API**: Next.js Route Handlers — Node.js `fs`로 파일 R/W
- **저장소**: 로컬 JSON 파일 (`/data/scenes.json`, `/data/characters.json`)
- **상태관리**: Zustand (클라이언트 캐시)
- **차트**: Recharts

## 데이터 저장 구조
```
/data/
  scenes.json       # Scene[]
  characters.json   # Character[]
```
Next.js API Route에서 Node `fs/promises`로 직접 읽고 쓴다.
`npm run dev` 실행 후 `localhost:3000`에서 접근.

## 스코프 (이번 버전)
- 로컬 단독 실행
- 인물 관리 (추가/삭제/색상)
- 씬 CRUD + 자동저장
- 인물 태그 검색 → 씬 이동 + 하이라이트
- 대시보드 집계

## 스코프 외
- 클라우드 동기화, 다중 프로젝트, 공동 편집, 내보내기
