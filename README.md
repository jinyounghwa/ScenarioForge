# ScenarioForge

<p align="center">
  <strong>시나리오 작성·정리 도구</strong><br/>
  시나리오 작가, 웹툰 작가, 게임 기획자를 위한 로컬 시나리오 관리 시스템
</p>

---

## ✨ 주요 기능

### 📊 대시보드
- 전체 씬·등장 인물·총 언급·평균 언급 통계 카드
- 인물별 등장 씬 수·언급 빈도 시각화 (바 차트)
- 최근 수정 씬 타임라인
- 인물별 등장 씬 상세 목록 → 클릭 시 해당 씬으로 바로 이동

### 👥 인물 관리
- 인물 추가/수정/삭제 (15가지 색상 지원)
- 인물별 등장 씬 수 표시
- 인라인 편집 지원
- 인물 검색

### ✏️ 에디터
- TipTap 기반 리치 텍스트 에디터 (굵게, 기울임, 밑줄, 취소선, 제목, 리스트, 정렬, 인용구, 코드블록 등)
- `@` 입력으로 인물 태그 (mention) — 기존 인물 선택 또는 새 인물 자동 생성
- 태그된 인물 배지 실시간 표시
- 자동저장 (1.5초 debounce)

### 📋 씬 목록
- 제목 + 본문 내용 통합 검색
- 인물별 필터링 (특정 인물이 등장하는 씬만)
- 정렬 (수정일/작성일/제목)
- 씬 카드에 태그된 인물 배지 표시
- 씬 상세 뷰 (조회/빠른 수정/에디터 열기)

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + @tailwindcss/typography |
| **Icons** | Remix Icon |
| **에디터** | TipTap (@mention, underline, link, text-align, highlight) |
| **상태관리** | Zustand |
| **데이터** | 로컬 JSON 파일 (`data/scenes.json`, `data/characters.json`) |

---

## 🚀 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (port 3002)
npm run dev
```

브라우저에서 `http://localhost:3002` 에 접속합니다.

---

## 📁 프로젝트 구조

```
ScenarioForge/
├── app/
│   ├── api/
│   │   ├── characters/          # 인물 CRUD API
│   │   │   ├── route.ts         # GET, POST
│   │   │   └── [id]/route.ts    # PUT, DELETE
│   │   └── scenes/              # 씬 CRUD API
│   │       ├── route.ts         # GET, POST
│   │       └── [id]/route.ts    # PUT, DELETE
│   ├── globals.css              # 전역 스타일 + 공통 컴포넌트 클래스
│   ├── layout.tsx               # Root layout (remixicon import)
│   └── page.tsx                 # 메인 페이지 (탭 네비게이션)
├── components/
│   ├── Icon.tsx                 # Remix Icon 래퍼 컴포넌트
│   ├── Dashboard.tsx            # 대시보드 (통계 카드, 인물별 등장 씬)
│   ├── CharacterManager.tsx     # 인물 관리 (추가/수정/삭제)
│   ├── CharacterStats.tsx       # 인물별 통계 테이블 + 바 차트
│   ├── SceneEditor.tsx          # 씬 에디터 (자동저장, 태그 인물 표시)
│   ├── SceneList.tsx            # 씬 목록 (검색, 필터, 정렬)
│   ├── SceneDetail.tsx          # 씬 상세 (조회/빠른수정/에디터열기)
│   ├── RichEditor.tsx           # TipTap 리치 에디터
│   └── RichEditor.css           # 에디터 스타일
├── store/
│   ├── sceneStore.ts            # 씬 Zustand 스토어
│   └── characterStore.ts        # 인물 Zustand 스토어
├── types/
│   └── index.ts                 # TypeScript 타입 정의
├── data/
│   ├── scenes.json              # 씬 데이터 (자동 생성)
│   └── characters.json          # 인물 데이터 (자동 생성)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 💾 데이터 구조

### Scene

```typescript
interface Scene {
  id: string
  title: string
  content: string          // HTML (TipTap 에디터 출력)
  createdAt: string        // ISO 8601
  updatedAt: string        // ISO 8601
  characterIds: string[]
}
```

### Character

```typescript
interface Character {
  id: string
  name: string
  color: string            // HEX color
  createdAt: string        // ISO 8601
}
```

---

## 📝 인물 태그 시스템

에디터에서 `@` 를 입력하면 인물 태그(popup)가 나타납니다.

- **기존 인물** → 목록에서 선택
- **새 인물** → 입력한 이름으로 자동 생성 후 characters.json에 저장

태그된 인물은 씬 HTML에 `<span class="mention" data-label="인물명">` 형태로 저장되며,
대시보드·씬 목록·인물 관리에서 실시간으로 통계에 반영됩니다.

한글 인물명 완벽 지원 (word boundary `\b` 대신 lookahead 패턴 사용).

---

## 📜 라이선스

Private Project
