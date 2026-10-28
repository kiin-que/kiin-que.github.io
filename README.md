# Ki In

Ki In의 편지와 물음표들. Astro가 한국어와 영어 페이지를 별도의 HTML로 생성하고 GitHub Actions가 GitHub Pages에 배포합니다.

- 사이트: https://kiin-que.github.io/
- English: https://kiin-que.github.io/en/
- 배포: main 브랜치에 push하거나 Actions에서 "Run workflow"를 누르면 빌드·검증 후 반영됩니다. PR에서는 배포 없이 빌드와 검증만 실행합니다.
- 글과 이미지·문서 도구 작업의 원본은 이 레포에 없습니다. 빌드할 때 Drive의 `archive/publish/`에서 읽어 옵니다(아래 "콘텐츠").

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

- `publish/notes/{slug}.ko.md`, `{slug}.en.md`: 글. 두 언어가 모두 있어야 발행됩니다. `kind`가 `"letter"`이면 "편지", 없거나 `"reading"`이면 "독서록"으로 표시합니다.
- `publish/works/{slug}.md` + 이미지 파일: 이미지 또는 문서 도구 작업. `kind`가 없거나 `"image"`이면 이미지 작업이며, `"project"`이면 문서 도구 상세 서식을 씁니다. 원본 파일명과 확장자를 보존합니다. 이미지 제목을 지정하지 않으면 '무제'/'Untitled'로 표시하며 임의로 제목을 만들지 않습니다. 생성 시기가 월까지만 확인되면 YYYY-MM을 씁니다.

빌드 순서:

1. `scripts/fetch-publish.mjs`가 원본을 읽어 `.publish/`(글, 작업 목록)와 `public/media/works/`(이미지)에 씁니다. 두 폴더는 커밋하지 않습니다.
   - CI: `PUBLISH_URL`·`PUBLISH_TOKEN`(GitHub secrets)으로 앱스 스크립트 웹 앱에서 받습니다.
   - 로컬: `PUBLISH_DIR` 폴더를 직접 읽습니다.
   - 필수 항목 누락, 한·영 불일치, `visibility: "private"` 표시, 없는 이미지 같은 문제가 있으면 아무것도 만들지 않고 실패합니다. 실패하면 배포되지 않으므로 기존 사이트가 유지됩니다.
2. `src/content.config.ts`가 `.publish/`를 Astro 콘텐츠 컬렉션(notes, works)으로 읽습니다.
3. `scripts/verify.mjs`가 `.publish/manifest.json`을 기준으로 모든 페이지를 검사합니다.

발행 폴더에서 파일을 빼고 다시 빌드하면 그 글은 사이트에서 사라지고, 이 레포에는 원고가 남지 않습니다.

### 문서 도구 작업

프로젝트도 원본은 Drive의 `publish/works/`에서 읽습니다. 설명 파일에는 JSON 값으로 다음 항목을 적습니다.

- 공통: `slug`, `kind: "project"`, `category`, `image`, `width`, `height`, `alt_ko`, `alt_en`
- 문구: `title_ko/en`, `description_ko/en`, `overview_ko/en`
- 선택한 주요 작업: `features_ko/en`에 한영 항목 수가 같은 문자열 배열
- 선택한 출처: `external_url`에 HTTPS 공개 소개 주소. 없으면 출처 상자를 표시하지 않습니다.
- 선택: `created`. 확인된 날짜가 없으면 생략하며 사이트에도 날짜를 표시하지 않습니다.
- 선택한 종류 표시: `label_ko/en`. 두 언어를 함께 지정하며, 없으면 문서 도구 기본 문구를 씁니다.
- 선택한 이미지 모음: `gallery` 배열. 각 항목에 `image`, `width`, `height`, `alt_ko/en`, `caption_ko/en`을 지정합니다. 원본 이미지는 같은 works 폴더에 두며, 각 이미지에 원본 보기 링크가 표시됩니다.
- 여러 출처: `sources` 배열의 각 항목에 `label_ko/en`을 지정합니다. 선택 항목인 `url`이 있으면 HTTPS 링크로, 없으면 일반 텍스트로 표시합니다. 배열이 있으면 기존 `external_url` 대신 표시합니다.
- 갤러리는 빌드 시 최대 2000px의 WebP 미리보기를 생성합니다. 원본 파일과 원본 보기 링크는 그대로 보존합니다.

소개문 `overview_ko/en`은 빈 줄로 문단을 나눌 수 있습니다. 로컬 검토 자료는 archive/web/에 보관하고, 기존 발행 자료와 합친 임시 입력 폴더를 PUBLISH_DIR로 지정해 확인합니다. 승인 전에는 archive/publish/에 넣지 않습니다.

홈 작업 목록은 글·이미지·프로젝트를 합쳐 날짜 내림차순으로 정렬하며, 날짜가 없는 작업은 마지막에 둡니다.

대표 이미지는 기존 이미지 작업과 같은 정사각 영역에 비율을 유지해 넣고, 상세에서는 공통 제목·본문·출처 서식 안에 표시합니다. 코드 PR만으로 Drive의 작업 목록이 바뀌지는 않습니다. 새 작업의 설명 파일과 이미지도 발행 폴더에 있어야 실제 페이지가 생성됩니다. 미리보기 중인 콘텐츠는 발행 폴더 밖에 보관하고, 코드와 콘텐츠를 함께 확인한 뒤 발행합니다.

### 진행 중인 프로젝트와 추신

홈 왼쪽 위 메모 아이콘은 발행 자료에 진행 중인 프로젝트가 있을 때만 표시됩니다. 아이콘을 누르면 짧은 편지 형식의 왼쪽 서랍이 열립니다. 항목을 누르면 작은 체크와 “그렇군요”가 잠시 나타나며, 완료 여부·공감·카운터를 저장하지 않습니다. 모션을 줄이는 설정에서는 이동과 그리기 효과를 생략합니다.

원본은 `archive/publish/works/{slug}.md`의 앞머리에 둡니다. `kind: "in-progress"`, `slug`, `category`, `created`, `stage`, `title_ko/en`이 필수이며, `stage`는 `idea`·`sketch`·`making` 중 하나입니다. `order`는 선택한 0 이상의 정수로, 작은 값이 먼저 나옵니다. 이 자료는 완성작 수·작업 상세 URL·사이트맵에 포함하지 않습니다. 빌드는 `.publish/in-progress.json`을 생성하고, 실제 내용은 레포에 커밋하지 않습니다.

로컬 시안은 발행 폴더를 복사한 임시 입력에 목업 파일만 추가한 뒤 그 폴더를 `PUBLISH_DIR`로 지정해 확인합니다. 목업은 실제 Drive 발행 원본에 넣지 않습니다. 기존 Apps Script가 works의 Markdown을 읽는 구조를 그대로 사용합니다.

### 앱스 스크립트 (apps-script/)

발행 전용 구글 계정에서 실행합니다. 그 계정은 `archive/publish/` 폴더에 보기 권한만 있으므로, 스크립트가 Drive의 다른 자료를 읽을 수 없습니다. `Code.gs`의 `PUBLISH_FOLDER_ID`에 발행 폴더 ID를 넣고 `setup()`을 한 번 실행하면 폴더 ID와 무작위 토큰이 스크립트 속성에 저장되고, 계정이 상위 폴더까지 볼 수 있으면 경고가 나옵니다. 그다음 웹 앱(실행: 나, 액세스: 모든 사용자)으로 배포합니다. 토큰이 맞지 않는 요청에는 `{"error":"unauthorized"}`만 돌려주고, 계정이 발행 폴더의 상위 폴더까지 볼 수 있으면 발행을 거부합니다.

## 코드와 스타일

- src/data/notes.ts, works.ts: 글과 이미지 작업의 통합 목록, 카테고리·건수, 날짜 표시
- src/data/messages.json: 편지와 메뉴 문구
- src/layouts/DetailPage.astro: 글·이미지·도구 상세의 공통 제목, 본문, 출처, 이동 서식
- public/detail.css: 상세 페이지 공통 서식과 text/image/project 유형별 차이, 한영·모바일 규칙
- src/components/: 홈·글·내비게이션과 유형별 상세 콘텐츠
- public/*.css: 기존 시안의 스타일과 모션
- public/letter.js: 공감, 분류, 연락처 복사, 스크롤 모션
- public/assets/fonts/: 로컬 글꼴과 라이선스

이미지 작업은 /works/<slug>/와 /en/works/<slug>/에서 열립니다. 목록으로 돌아오면 같은 브라우저 탭에서 선택한 카테고리를 복원합니다.

"편지 잘 읽었어요"는 브라우저마다 한 번만 누를 수 있고 취소는 없습니다(localStorage `kiin-letter-liked`). 누적 수는 `apps-script/like-counter/`의 카운터 웹 앱이 저장하며, 그 주소는 `src/data/counter.ts`의 `LIKE_ENDPOINT`에 둡니다. 이 주소는 공개되어도 숫자를 읽거나 1씩 올리는 것만 가능하고, 분당 30회를 넘는 요청은 거절합니다. 주소가 비어 있으면 그 방문 안에서만 셉니다. 미연결 웹·SNS 항목은 준비 안내를 표시합니다.

## 검색과 주소

각 언어 페이지의 본문·제목·설명을 빌드 시 HTML에 넣습니다. canonical, hreflang, Open Graph, JSON-LD, sitemap.xml 및 robots.txt를 생성합니다. 검색 노출 시점은 검색엔진의 수집에 따라 달라집니다.

개인 도메인으로 옮길 때는 astro.config.mjs의 site와 base를 바꾸고 Pages의 도메인 설정을 맞춥니다. 내부 주소는 BASE_URL에서 생성됩니다. scripts/verify.mjs의 검사 대상 주소도 함께 수정하세요.

2026-10-21의 최신 드라이브 시안을 이전했습니다. 기존 원본 폴더와 해움한국어 대표 GitHub Pages 저장소는 그대로 보존합니다. 포트폴리오는 kiin-que 조직의 독립 사이트로 배포하며, 전환을 확인한 뒤 이전 /ki-in/ Pages 배포를 중단합니다. 배포 산출물 dist/는 저장소에 커밋하지 않습니다.
