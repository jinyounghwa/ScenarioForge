# ScenarioForge

<p align="center">
  <strong>시나리오 작성·정리 도구</strong><br/>
  시나리오 작가, 웹툰 작가, 게임 기획자를 위한 로컬 시나리오 관리 시스템
</p>

---

## ✨ 주요 기능

### 📊 대시보드
- 전체 씬 · 등장 인물 · 총 언급 · 총 글자 수 통계 카드
- **인물별 언급 수 막대그래프** (Recharts BarChart)
- **씬 상태 분포 파이차트** (Recharts PieChart)
- 인물별 상세 통계 테이블 (빈도 바 시각화)
- 최근 수정 씬 타임라인 + 상태 배지
- 인물별 등장 씬 상세 목록 → 클릭 시 해당 씬으로 바로 이동

### 👥 인물 관리
- 인물 추가/수정/삭제 (15가지 색상 지원)
- **인물 설명 필드** — 역할, 나이, 성격 등 자유 입력
- 인물별 등장 씬 수 표시
- 인라인 편집 지원 (이름, 설명, 색상)
- 인물 검색 (이름 + 설명 통합)

### ✏️ 에디터
- TipTap 기반 리치 텍스트 에디터 (굵게, 기울임, 밑줄, 취소선, 제목, 리스트, 정렬, 인용구, 코드블록 등)
- `@` 입력으로 인물 태그 (mention) — 기존 인물 선택 또는 새 인물 자동 생성
- 태그된 인물 배지 실시간 표시
- **1.5초 자동저장** (상태 + 태그 포함)
- **Ctrl+S / Cmd+S 빠른 저장** 단축키
- **글자 수 카운터** (공백 제외)
- 저장 상태 실시간 표시 (저장 중 / 저장 완료 시각)

### 📋 씬 목록
- 제목 + 본문 내용 통합 검색
- **다중 필터** — 인물 / 상태 / 태그 조합 필터링
- 정렬 (순서 / 수정일 / 작성일 / 제목)
- **드래그앤드롭 순서 변경** (순서 정렬 모드)
- 씬 카드에 상태 배지 + 태그 + 등장 인물 표시
- **씬 복제** — 원클릭으로 사본 생성
- 씬 상세 뷰 (조회 / 빠른 수정 / 에디터 열기)

### 🌙 다크 모드
- 헤더 토글 버튼으로 즉시 전환
- `localStorage`에 설정 저장
- OS 시스템 다크 모드 자동 감지
- 전체 컴포넌트 다크 테마 지원

### 📦 데이터 관리
- **JSON 내보내기** — 전체 씬 + 인물 데이터 백업 다운로드
- **JSON 가져오기** — 백업 파일 복원
- 토스트 알림으로 결과 피드백

### 🔔 알림 시스템
- **토스트 알림** — 성공 / 에러 / 정보 타입, 3.5초 자동 사라짐
- **커스텀 확인 모달** — 기존 `alert()` / `confirm()` 대체

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + `dark:` 클래스 다크 모드 |
| **Icons** | Remix Icon |
| **에디터** | TipTap (@mention, underline, link, text-align, highlight) |
| **상태관리** | Zustand |
| **차트** | Recharts (BarChart, PieChart) |
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
│   │   ├── characters/
│   │   │   ├── route.ts           # GET, POST
│   │   │   └── [id]/route.ts      # PUT, DELETE
│   │   ├── scenes/
│   │   │   ├── route.ts           # GET, POST
│   │   │   ├── [id]/route.ts      # PUT, DELETE
│   │   │   └── reorder/route.ts   # PUT (드래그앤드롭 순서)
│   │   ├── export/route.ts        # GET (JSON 내보내기)
│   │   └── import/route.ts        # POST (JSON 가져오기)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Icon.tsx                   # Remix Icon 래퍼
│   ├── ThemeToggle.tsx            # 다크 모드 토글
│   ├── Toast.tsx                  # 토스트 알림 컨테이너
│   ├── ConfirmModal.tsx           # 커스텀 확인 모달
│   ├── Dashboard.tsx              # 대시보드 (차트 + 통계)
│   ├── CharacterManager.tsx       # 인물 관리
│   ├── CharacterStats.tsx         # 인물별 통계 테이블
│   ├── SceneEditor.tsx            # 씬 에디터
│   ├── SceneList.tsx              # 씬 목록 (필터 + DnD)
│   ├── SceneDetail.tsx            # 씬 상세
│   ├── RichEditor.tsx             # TipTap 에디터
│   └── RichEditor.css             # 에디터 스타일 (다크 모드 포함)
├── lib/
│   ├── data.ts                    # 서버 파일 I/O 헬퍼
│   └── utils.ts                   # 공통 유틸리티 (mention regex 등)
├── store/
│   ├── sceneStore.ts              # 씬 스토어 (optimistic update)
│   ├── characterStore.ts          # 인물 스토어
│   ├── toastStore.ts              # 토스트 알림 스토어
│   ├── confirmStore.ts            # 확인 모달 스토어
│   └── themeStore.ts              # 다크 모드 스토어
├── types/
│   └── index.ts                   # 타입 + normalize + 상수
├── data/
│   ├── scenes.json                # 씬 데이터 (자동 생성)
│   └── characters.json            # 인물 데이터 (자동 생성)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 💾 데이터 구조

### Scene

```typescript
type SceneStatus = 'draft' | 'writing' | 'complete' | 'review'

interface Scene {
  id: string
  title: string
  content: string          // HTML (TipTap 에디터 출력)
  createdAt: string        // ISO 8601
  updatedAt: string        // ISO 8601
  characterIds: string[]
  order: number            // 정렬 순서
  status: SceneStatus      // 씬 상태
  tags: string[]           // 씬 태그
}
```

### Character

```typescript
interface Character {
  id: string
  name: string
  color: string            // HEX color
  description: string      // 인물 설명
  createdAt: string        // ISO 8601
}
```

### 하위 호환

구버전 데이터(`order`, `status`, `tags`, `description` 누락)는 `normalizeScene()` / `normalizeCharacter()`가 기본값으로 자동 채웁니다.

---

## 🏷️ 씬 태그 시스템

프리셋 태그 14종: `서론`, `전개`, `갈등`, `클라이맥스`, `결말`, `액션`, `대화`, `회상`, `반전`, `감정`, `실내`, `실외`, `낮`, `밤`

직접 입력하여 커스텀 태그도 추가 가능합니다.  
태그는 해시 기반 HSL 색상으로 자동 칠해집니다.

---

## 📝 인물 태그 시스템

에디터에서 `@` 를 입력하면 인물 태그 팝업이 나타납니다.

- **기존 인물** → ↑↓ 화살표 키 또는 클릭으로 선택
- **새 인물** → 입력한 이름으로 자동 생성 후 `characters.json`에 저장

태그된 인물은 씬 HTML에 `<span class="mention" data-label="인물명">` 형태로 저장되며,
대시보드 · 씬 목록 · 인물 관리에서 실시간으로 통계에 반영됩니다.

한글 인물명 완벽 지원 (word boundary `\b` 대신 lookahead 패턴 사용).

---

## ⌨️ 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl+S` / `Cmd+S` | 에디터에서 즉시 저장 |
| `@` | 인물 태그 팝업 열기 |
| `↑` / `↓` | 팝업 내 인물 선택 이동 |
| `Enter` | 선택한 인물 태그 삽입 |
| `Esc` | 팝업 닫기 |

---

## 📜 라이선스

Private Project
