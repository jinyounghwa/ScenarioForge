# SKILL.md — ScenarioForge 구현 가이드

## 1. 프로젝트 구조

```
scenario-forge/
├── data/                          # 실제 데이터 저장 위치 (gitignore 권장)
│   ├── scenes.json
│   └── characters.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # / → /editor 리다이렉트
│   │   ├── editor/page.tsx        # 메인 에디터
│   │   ├── dashboard/page.tsx     # 대시보드
│   │   └── api/
│   │       ├── scenes/
│   │       │   ├── route.ts       # GET(전체), POST(생성)
│   │       │   └── [id]/route.ts  # PUT(수정), DELETE(삭제)
│   │       └── characters/
│   │           ├── route.ts       # GET, POST
│   │           └── [id]/route.ts  # PUT, DELETE
│   ├── components/
│   │   ├── layout/Header.tsx
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SceneList.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── CharacterFilter.tsx
│   │   ├── editor/
│   │   │   ├── SceneEditor.tsx    # TipTap 래퍼
│   │   │   ├── Toolbar.tsx
│   │   │   └── MentionList.tsx    # @mention 드롭다운
│   │   └── dashboard/
│   │       ├── StatCard.tsx
│   │       └── CharacterChart.tsx
│   ├── store/
│   │   ├── sceneStore.ts
│   │   └── characterStore.ts
│   └── lib/
│       ├── types.ts
│       ├── tagParser.ts
│       └── dataPath.ts            # /data 경로 상수
├── CLAUDE.md
├── SKILL.md
└── package.json
```

---

## 2. 타입 정의 (`src/lib/types.ts`)

```ts
export type CharacterColor = 'violet' | 'teal' | 'amber' | 'rose' | 'sky' | 'lime';

export interface Character {
  id: string;          // nanoid()
  name: string;
  color: CharacterColor;
  createdAt: string;
}

export interface CharTag {
  charId: string;
  type: 'dialogue' | 'mention';
  // dialogue: <blockquote> 내부 mention
  // mention : 일반 단락 mention
}

export interface Scene {
  id: string;
  title: string;
  content: string;     // TipTap HTML
  tags: CharTag[];     // 저장 시 tagParser로 갱신
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. 파일 저장 레이어 (`src/app/api/`)

### 경로 상수 (`src/lib/dataPath.ts`)
```ts
import path from 'path';

export const DATA_DIR   = path.join(process.cwd(), 'data');
export const SCENES_PATH = path.join(DATA_DIR, 'scenes.json');
export const CHARS_PATH  = path.join(DATA_DIR, 'characters.json');
```

### 씬 API (`src/app/api/scenes/route.ts`)
```ts
import { readFile, writeFile, mkdir } from 'fs/promises';
import { SCENES_PATH, DATA_DIR } from '@/lib/dataPath';
import { Scene } from '@/lib/types';
import { nanoid } from 'nanoid';

async function readScenes(): Promise<Scene[]> {
  try {
    const raw = await readFile(SCENES_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];   // 파일 없으면 빈 배열
  }
}

async function writeScenes(scenes: Scene[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SCENES_PATH, JSON.stringify(scenes, null, 2), 'utf-8');
}

// GET /api/scenes
export async function GET() {
  const scenes = await readScenes();
  return Response.json(scenes);
}

// POST /api/scenes
export async function POST(req: Request) {
  const body = await req.json();
  const scenes = await readScenes();
  const newScene: Scene = {
    id: nanoid(),
    title: body.title ?? '새 씬',
    content: body.content ?? '',
    tags: body.tags ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  scenes.push(newScene);
  await writeScenes(scenes);
  return Response.json(newScene, { status: 201 });
}
```

### 씬 개별 API (`src/app/api/scenes/[id]/route.ts`)
```ts
// PUT /api/scenes/:id — 수정
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const scenes = await readScenes();
  const idx = scenes.findIndex(s => s.id === params.id);
  if (idx === -1) return Response.json({ error: 'not found' }, { status: 404 });

  scenes[idx] = { ...scenes[idx], ...body, updatedAt: new Date().toISOString() };
  await writeScenes(scenes);
  return Response.json(scenes[idx]);
}

// DELETE /api/scenes/:id
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const scenes = await readScenes();
  const filtered = scenes.filter(s => s.id !== params.id);
  await writeScenes(filtered);
  return Response.json({ ok: true });
}
```

> `characters` API도 동일한 패턴으로 구현.

---

## 4. Zustand 스토어 (클라이언트 캐시)

```ts
// sceneStore.ts — API 호출 후 로컬 상태 갱신
interface SceneStore {
  scenes: Scene[];
  activeId: string | null;
  searchQuery: string;
  fetchScenes: () => Promise<void>;
  addScene: () => Promise<void>;
  updateScene: (id: string, patch: Partial<Scene>) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  setActive: (id: string) => void;
  setSearch: (q: string) => void;
  filteredScenes: () => Scene[];
}
```

각 action은 `fetch('/api/scenes', ...)` 호출 후 로컬 상태 갱신.  
`persist` 미들웨어 **불필요** — 서버 파일이 source of truth.

---

## 5. TipTap 에디터 + @mention

### 설치
```bash
npm install @tiptap/react @tiptap/starter-kit \
  @tiptap/extension-mention @tiptap/extension-placeholder \
  @tiptap/extension-blockquote tippy.js
```

### Mention 설정 핵심
```ts
Mention.configure({
  HTMLAttributes: { class: 'char-tag' },
  renderHTML({ node }) {
    return ['span', {
      class: 'char-tag',
      'data-id': node.attrs.id,
      'data-label': node.attrs.label,
      'data-color': characters.find(c => c.id === node.attrs.id)?.color ?? 'gray',
    }, `@${node.attrs.label}`];
  },
  suggestion: {
    items: ({ query }) =>
      characters.filter(c => c.name.includes(query)).slice(0, 8),
    render: () => { /* tippy 드롭다운 */ },
  },
})
```

### 대사 vs 언급 구분
- `<blockquote>` 내부 mention → `type: 'dialogue'`
- 일반 단락 mention → `type: 'mention'`

---

## 6. 태그 파서 (`src/lib/tagParser.ts`)

저장 직전에 HTML에서 CharTag[]를 추출한다:

```ts
export function parseTags(html: string): CharTag[] {
  // 서버사이드에서도 호출되므로 DOMParser 대신 정규식 사용
  const tags: CharTag[] = [];

  // blockquote 내부 추출
  const blockquoteRe = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
  const mentionRe = /class="char-tag"[^>]*data-id="([^"]+)"/g;

  let bqMatch;
  while ((bqMatch = blockquoteRe.exec(html)) !== null) {
    let m;
    const inner = bqMatch[1];
    const re = new RegExp(mentionRe.source, 'gi');
    while ((m = re.exec(inner)) !== null) {
      tags.push({ charId: m[1], type: 'dialogue' });
    }
  }

  // 전체에서 dialogue 제외한 mention 추출
  const usedIds = new Set(
    [...html.matchAll(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi)]
      .flatMap(bq => [...bq[0].matchAll(/data-id="([^"]+)"/gi)].map(m => m[1]))
  );

  let m2;
  const allRe = /class="char-tag"[^>]*data-id="([^"]+)"/gi;
  while ((m2 = allRe.exec(html)) !== null) {
    if (!usedIds.has(m2[1])) {
      tags.push({ charId: m2[1], type: 'mention' });
    }
  }

  return tags;
}
```

---

## 7. 대시보드 집계

```ts
function getCharStats(charId: string, scenes: Scene[]) {
  let sceneCount = 0, dialogueCount = 0, mentionCount = 0;

  for (const scene of scenes) {
    const related = scene.tags.filter(t => t.charId === charId);
    if (related.length > 0) sceneCount++;
    dialogueCount += related.filter(t => t.type === 'dialogue').length;
    mentionCount  += related.filter(t => t.type === 'mention').length;
  }

  return { sceneCount, dialogueCount, mentionCount };
}
```

---

## 8. 인물 검색 → 씬 이동

1. 사이드바에서 인물 선택
2. `scenes.filter(s => s.tags.some(t => t.charId === selectedId))` 로 필터
3. 씬 클릭 → `setActive(id)` → 에디터 로드
4. 해당 인물 첫 태그로 스크롤:
```ts
const el = document.querySelector(`.char-tag[data-id="${selectedId}"]`);
el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
```

---

## 9. 실행

```bash
npx create-next-app@latest scenario-forge \
  --typescript --tailwind --app --src-dir --no-git

cd scenario-forge
npm install zustand nanoid tippy.js recharts \
  @tiptap/react @tiptap/starter-kit \
  @tiptap/extension-mention @tiptap/extension-placeholder

# data 디렉토리 초기화
mkdir data
echo '[]' > data/scenes.json
echo '[]' > data/characters.json

npm run dev
# → http://localhost:3002
```

---

## 10. 구현 순서

1. `types.ts` + `dataPath.ts` + API Route (scenes, characters)
2. Zustand 스토어 (fetch 기반)
3. 레이아웃 뼈대 (Header, Sidebar)
4. TipTap 기본 에디터 + 씬 CRUD
5. Mention 확장 + 인물 관리 UI
6. `tagParser.ts` + 저장 시 tags 갱신
7. 사이드바 인물 필터 + 씬 이동
8. 대시보드 집계 + Recharts 차트
