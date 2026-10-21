# Ki In

Ki In의 편지와 물음표들. Astro가 한국어와 영어 페이지를 별도의 HTML로 생성하고 GitHub Actions가 GitHub Pages에 배포합니다.

- 사이트: https://kiin-que.github.io/
- English: https://kiin-que.github.io/en/
- 배포: main 브랜치에 push하거나 Actions에서 "Run workflow"를 누르면 빌드·검증 후 반영됩니다. PR에서는 배포 없이 빌드와 검증만 실행합니다.
- 글과 이미지 작업은 이 레포에 없습니다. 빌드할 때 Drive의 `archive/publish/`에서 읽어 옵니다(아래 "콘텐츠").

## 로컬 작업

Node.js 24 및 pnpm 11.25.0을 사용합니다.

`.env.example`을 `.env`로 복사하고 `PUBLISH_DIR`에 `archive/publish` 폴더 경로를 적습니다.

~~~sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm verify
pnpm preview
~~~

개발·미리보기의 루트 주소를 엽니다. 한국어는 /, 영어는 /en/입니다. 언어 전환은 같은 페이지의 다른 언어 주소로 이동합니다.

## 콘텐츠

글과 이미지 작업의 원본은 Drive의 `archive/publish/` 한 곳에만 둡니다. 형식은 `archive/_meta/metadata-guide.md`를 따릅니다.

- `publish/notes/{slug}.ko.md`, `{slug}.en.md`: 글. 두 언어가 모두 있어야 발행됩니다.
- `publish/works/{slug}.md` + 이미지 파일: 이미지 작업. 원본 파일명과 확장자를 보존합니다. 사용자가 제목을 지정하지 않으면 '무제'/'Untitled'로 표시하며 임의로 제목을 만들지 않습니다. 생성 시기가 월까지만 확인되면 YYYY-MM을 씁니다.

빌드 순서:

1. `scripts/fetch-publish.mjs`가 원본을 읽어 `.publish/`(글, 작업 목록)와 `public/media/works/`(이미지)에 씁니다. 두 폴더는 커밋하지 않습니다.
   - CI: `PUBLISH_URL`·`PUBLISH_TOKEN`(GitHub secrets)으로 앱스 스크립트 웹 앱에서 받습니다.
   - 로컬: `PUBLISH_DIR` 폴더를 직접 읽습니다.
   - 필수 항목 누락, 한·영 불일치, `visibility: "private"` 표시, 없는 이미지 같은 문제가 있으면 아무것도 만들지 않고 실패합니다. 실패하면 배포되지 않으므로 기존 사이트가 유지됩니다.
2. `src/content.config.ts`가 `.publish/`를 Astro 콘텐츠 컬렉션(notes, works)으로 읽습니다.
3. `scripts/verify.mjs`가 `.publish/manifest.json`을 기준으로 모든 페이지를 검사합니다.

발행 폴더에서 파일을 빼고 다시 빌드하면 그 글은 사이트에서 사라지고, 이 레포에는 원고가 남지 않습니다.

### 앱스 스크립트 (apps-script/)

발행 전용 구글 계정에서 실행합니다. 그 계정은 `archive/publish/` 폴더에 보기 권한만 있으므로, 스크립트가 Drive의 다른 자료를 읽을 수 없습니다. `Code.gs`의 `PUBLISH_FOLDER_ID`에 발행 폴더 ID를 넣고 `setup()`을 한 번 실행하면 폴더 ID와 무작위 토큰이 스크립트 속성에 저장되고, 계정이 상위 폴더까지 볼 수 있으면 경고가 나옵니다. 그다음 웹 앱(실행: 나, 액세스: 모든 사용자)으로 배포합니다. 토큰이 맞지 않는 요청에는 `{"error":"unauthorized"}`만 돌려주고, 계정이 발행 폴더의 상위 폴더까지 볼 수 있으면 발행을 거부합니다.

## 코드와 스타일

- src/data/notes.ts, works.ts: 글과 이미지 작업의 통합 목록, 카테고리·건수, 날짜 표시
- src/data/messages.json: 편지와 메뉴 문구
- src/components/: 홈·글·내비게이션 공통 요소
- public/*.css: 기존 시안의 스타일과 모션
- public/letter.js: 공감, 분류, 연락처 복사, 스크롤 모션
- public/assets/fonts/: 로컬 글꼴과 라이선스

이미지 작업은 /works/<slug>/와 /en/works/<slug>/에서 열립니다. 목록으로 돌아오면 같은 브라우저 탭에서 선택한 카테고리를 복원합니다.

공감은 현재 페이지에서만 0 ↔ 1로 바뀝니다. 서버 저장·누적 집계는 구현하지 않았습니다. 미연결 웹·SNS 항목은 준비 안내를 표시합니다.

## 검색과 주소

각 언어 페이지의 본문·제목·설명을 빌드 시 HTML에 넣습니다. canonical, hreflang, Open Graph, JSON-LD, sitemap.xml 및 robots.txt를 생성합니다. 검색 노출 시점은 검색엔진의 수집에 따라 달라집니다.

개인 도메인으로 옮길 때는 astro.config.mjs의 site와 base를 바꾸고 Pages의 도메인 설정을 맞춥니다. 내부 주소는 BASE_URL에서 생성됩니다. scripts/verify.mjs의 검사 대상 주소도 함께 수정하세요.

2026-10-21의 최신 드라이브 시안을 이전했습니다. 기존 원본 폴더와 해움한국어 대표 GitHub Pages 저장소는 그대로 보존합니다. 포트폴리오는 kiin-que 조직의 독립 사이트로 배포하며, 전환을 확인한 뒤 이전 /ki-in/ Pages 배포를 중단합니다. 배포 산출물 dist/는 저장소에 커밋하지 않습니다.
