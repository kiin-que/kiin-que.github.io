# Ki In

Ki In의 편지와 물음표들. Astro가 한국어와 영어 페이지를 별도의 HTML로 생성하고 GitHub Actions가 GitHub Pages에 배포합니다.

- 사이트: https://kiin-que.github.io/
- English: https://kiin-que.github.io/en/
- 배포: main 브랜치에 push하면 빌드·검증 후 자동 반영됩니다. PR에서는 배포 없이 빌드와 검증만 실행합니다.

## 로컬 작업

Node.js 24 및 pnpm 11.25.0을 사용합니다.

~~~sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm verify
pnpm preview
~~~

개발·미리보기의 루트 주소를 엽니다. 한국어는 /, 영어는 /en/입니다. 언어 전환은 같은 페이지의 다른 언어 주소로 이동합니다.

## 콘텐츠와 스타일

- src/content/notes/: 한영 Markdown 글과 제목·설명·출처 등의 frontmatter
- src/data/notes.ts: 글 목록과 언어별 Markdown 등록
- src/data/works.ts: 글과 이미지 작업의 통합 목록, 카테고리·건수, 이미지 작업 정보
- src/data/messages.json: 편지와 메뉴 문구
- src/components/: 홈·글·내비게이션 공통 요소
- public/*.css: 기존 시안의 스타일과 모션
- public/letter.js: 공감, 분류, 연락처 복사, 스크롤 모션
- public/assets/fonts/: 로컬 글꼴과 라이선스

새 글은 같은 slug의 .ko.md와 .en.md를 만들고 notes.ts에 등록합니다. 기록 날짜는 ISO 형식이며 목록·본문 표시 날짜도 함께 확인하세요.

이미지 작업은 works.ts의 imageWorks에 등록합니다. 카테고리는 작업 주제로 정하고, 생성 도구와 형식은 별도 정보로 표시합니다. 사용자가 제목을 지정하지 않으면 한국어는 ‘무제’, 영어는 ‘Untitled’를 기본값으로 사용하며 임의로 제목을 만들지 않습니다. 원본 파일명과 확장자를 보존합니다. 생성 시기가 월까지만 확인되면 YYYY-MM을 사용하고 임의의 날짜를 붙이지 않습니다. 여러 이미지로 이루어진 한 작업도 작업 한 건으로 집계합니다.

이미지 작업은 /works/<slug>/와 /en/works/<slug>/에서 열립니다. 목록으로 돌아오면 같은 브라우저 탭에서 선택한 카테고리를 복원합니다.

공감은 현재 페이지에서만 0 ↔ 1로 바뀝니다. 서버 저장·누적 집계는 구현하지 않았습니다. 미연결 웹·SNS 항목은 준비 안내를 표시합니다.

## 검색과 주소

각 언어 페이지의 본문·제목·설명을 빌드 시 HTML에 넣습니다. canonical, hreflang, Open Graph, JSON-LD, sitemap.xml 및 robots.txt를 생성합니다. 검색 노출 시점은 검색엔진의 수집에 따라 달라집니다.

개인 도메인으로 옮길 때는 astro.config.mjs의 site와 base를 바꾸고 Pages의 도메인 설정을 맞춥니다. 내부 주소는 BASE_URL에서 생성됩니다. scripts/verify.mjs의 검사 대상 주소도 함께 수정하세요.

2026-10-21의 최신 드라이브 시안을 이전했습니다. 기존 원본 폴더와 해움한국어 대표 GitHub Pages 저장소는 그대로 보존합니다. 포트폴리오는 kiin-que 조직의 독립 사이트로 배포하며, 전환을 확인한 뒤 이전 /ki-in/ Pages 배포를 중단합니다. 배포 산출물 dist/는 저장소에 커밋하지 않습니다.
