# AGENTS.md

## Purpose

이 저장소에서 AI 에이전트가 안전하고 일관되게 작업하기 위한 규칙.

<!-- ## Architecture Rules
- GraphQL 리졸버는 `src/api/**` 하위에 둔다.
- GraphQL 리졸버는 기능별로 분리되며 기획 및 디자인 문서상의 GNB, SNB를 따라 상위 폴더부터 하위폴더로 점차 재내려산다.
- GNB > SNB로 GNB가 항상 최상위에 위치해 있다.
- 각 기능은 `*.graphql` 과 `*.js`를 함께 관리한다.
- 공통 유틸/인증/미들웨어는 `src/libs/**`에 둔다.
- DB 스키마 변경 시 `prisma/schema.prisma`와 migration을 함께 반영한다.

## Workflow
1. 관련 파일 탐색: `rg`, `find` 우선 사용.
2. 최소 변경 원칙으로 수정.
3. 가능하면 빌드/테스트 실행 후 결과 기록.
4. 결과 보고 시 변경 이유, 영향 범위, 남은 리스크를 명시.

## Guardrails
- 요청 없는 대규모 리팩토링 금지.
- 비밀값/토큰/개인정보 로그 출력 금지.
- deprecated 디렉터리 코드는 신규 기능에 사용 금지.

## Definition of Done
- 빌드 성공.
- 관련 테스트 통과 또는 미실행 사유 명시.
- 문서/스키마/마이그레이션 정합성 확인. -->

## tech stack

- 이번 프로젝트에서는 typescript, nodejs, restApi, prisma, mysql을 사용한다.

## Architecture Rules

- restApi의 각 기능별 폴더는 `src/api/**` 하위에 둔다.
- restApi는 기능별로 분리되며 기획 및 디자인 문서상의 GNB, SNB를 따라 상위 폴더부터 하위폴더로 점차 내려간다.
- GNB > SNB로 GNB가 항상 최상위에 위치해 있다.
- 공통 유틸/인증/미들웨어는 `src/libs/**`에 둔다.
- `src/libs/`에서도 큰 기능별로 분리를 할 수 있다변 나누어서 저장한다.
- 사용자 인증관련 기능은 `src/libs/auth`에 둔다.
- prisma 싱글톤을 위해 prisma client 로딩 파일은 `src/libs/prisma`에 둔다.
- DB 스키마 변경 시 `prisma/schema.prisma`와 migration을 함께 반영한다.
- deprecated 디렉토리는 `src/deprecated`에 두며 사용하지 않는 기능들에 대해서 전부 몰아 넣는다.
- 기능변경 및 리팩토링시 폴더명, api명은 뒤에 version을 올려가며 변경한다. ex) seePosts -> seePosts_v2
- src/api/\*\*/dto에 요청/응답 타입을 명시하여 작성한다.
- 응답 포맷에 대해 {success, data, error}로 응답한다.
- 에러 코드 체계 표준화(AUTH_001, POST_404 등) 한다.
- 환경변수 .env파일은 항상 프로젝트 최상단(루트)에 위치한다.
- 기본 포트는 4000번 부터 진행하되 내가 변경할 수 있기 때문에 초기 설정 이후 변경된 값은 수정하지 않는다.
- 타입선언 및 함수에 이해할 수 있는 주석을 추가한다.

## Validation Rules

- 모든 API는 라우터 진입 시 `params`, `query`, `body`를 각각 검증한다.
- 검증은 런타임 스키마(zod/class-validator) 기반으로 수행하며, 타입 선언만으로 대체하지 않는다.
- 스키마는 기본적으로 strict 모드로 동작하여 정의되지 않은 필드는 거부한다.
- 검증 실패 시 서비스 로직을 실행하지 않고 400을 반환한다.
- 검증 실패 응답은 `{ success: false, data: null, error }` 포맷을 따르며, 에러 코드는 `COMMON_400_VALIDATION`을 사용한다.
- 검증 에러에는 필드 단위 정보(`field`, `reason`)를 포함한다. 단, 민감값은 마스킹 후 반환한다.
- 숫자/불리언/날짜는 명시적으로 파싱/변환하며 암묵적 캐스팅을 금지한다.
- 정렬/필터/검색/페이지네이션은 허용된 필드 화이트리스트만 사용한다.
- 비즈니스 검증(중복, 상태 전이, 권한)은 서비스 레이어에서 수행한다.
- 공통 검증 스키마(페이지네이션, id, dateRange, phone, email)는 `src/libs/validation`에 둔다.

## Masking Rules

- 마스킹할 문자는 \* 로 마스킹을 진행한다.
- 이름의 첫 글자와 마지막 글자를 제외하고 마스킹을 한다.
- 이름이 2자 이하인 경우 마지막 글자만 마스킹한다.
- 휴대폰번호는 한국 번호 기준 가운데 4자리만 마스킹한다. ex) 010-1234-0001 -> 010-\*\*\*\*-0001
- 주민등록번호는 한국 기준 뒤7자리중 첫 자리를 제외한 나머지를 마스킹한다. ex) 260219-1001234 -> 260219-1**\*\***
- 이메일 주소의 경우 아이디의 첫 글자와 마지막글자를 제외하고 모두 마스킹하며 도메인 또한 첫 글자와 마지막 글자를 제외하고 마스킹한다.
- 계정명은 첫 글자와 마지막 글자를 제외하고 마스킹한다.
- 카드번호는 총 12개의 숫자 중 7번째부터 12번째까지 가운데 6자리를 마스킹한다.

## Error Rules

- 공통 에러 핸들러는 `src/libs/error`에 둔다.
- 모든 에러 응답은 `{ success: false, data: null, error }` 포맷을 사용한다.
- `error`는 최소 `code`, `message`를 포함하고, 필요 시 `details`, `traceId`를 포함한다.
- 에러 코드는 도메인별 prefix를 사용해 표준화한다. (예: `COMMON_400_VALIDATION`, `AUTH_401_UNAUTHORIZED`, `POST_404_NOT_FOUND`)
- 예상 가능한 비즈니스 에러는 커스텀 에러 클래스로 throw하고, 공통 핸들러에서 HTTP status/code로 매핑한다.
- 처리되지 않은 예외는 `COMMON_500_INTERNAL`로 응답하고 상세 스택은 외부로 노출하지 않는다.
- 검증 실패는 항상 400, 인증 실패 401, 권한 없음 403, 리소스 없음 404, 충돌 409로 통일한다.
- 로그 레벨은 `debug/info/warn/error`를 사용하며 환경별로 출력 정책을 분리한다.
- `error` 로그에는 원인/스택/traceId를 남기되, 응답 본문에는 민감정보와 내부 구현 정보를 포함하지 않는다.
- 민감정보(토큰, 비밀번호, 주민번호, 카드번호, 이메일 등)는 로그 저장 전 마스킹 규칙을 적용한다.

## prisma Rules

- 응답 Type별로 N+1 방지를 위해 select를 기준으로 사용하나 include를 사용하는 경우는 테이블의 모든 데이터가 필요하는경우 사용한다.
- 트랜잭션의 경우 2개 이상의 연관된 테이블 생성 및 외부 API연동으로 인한 CUD(Create, Update, Delete) 작업이 필요한 경우 사용한다.
- 트랜잭션을 사용하는데 외부 api와 연동하여 사용하게되는 경우(결제) prisma로 CUD를 진행하는데 에러 발생시 외부 api도 취소 할 수 있도록 진행한다.
- migration은 yyyyMMdd_table_text 형태로 진행한다.
- Table명은 대문자로 시작한다.
- @@map을 별도로 사용하지 않고 mysql에서 자동 매칭할 수 있도록 진행한다.
- Database의 주소는 .env의 DATABASE_URL를 참고한다.

## Test Rules

- 테스트는 `unit`(순수 로직)과 `integration`(API + DB/모킹)으로 분리한다.
- 테스트 파일은 기능 기준으로 배치한다. (예: `src/api/post/__tests__/*.spec.ts`)
- 신규 API는 최소 3가지 케이스를 포함한다.
  - 성공 케이스 (200/201)
  - 검증 실패 케이스 (400)
  - 인증/인가 실패 케이스 (401/403)
- 조회성 API는 리소스 없음 케이스(404), 수정/삭제 API는 충돌/상태오류 케이스(409)도 포함한다.
- 에러 응답 포맷(`{success:false,data:null,error}`)과 에러 코드값을 테스트에서 검증한다.
- 마스킹 대상 필드는 응답/로그 테스트에서 마스킹 적용 여부를 검증한다.
- Prisma 연동 테스트는 테스트 DB를 분리해 실행하고, 테스트 간 데이터 격리를 보장한다.
- 외부 API 연동은 기본적으로 mock 처리하고, 실제 연동 테스트는 별도 시나리오로 분리한다.
- PR 전 최소 실행 기준:
  - `npm run test`
  - `npm run build`
- 테스트를 실행하지 못한 경우 사유와 영향 범위를 PR/작업 결과에 명시한다.

## Git Rules

- 원격 저장소는 `origin`으로 고정하며 URL은 `https://github.com/Ms-sesia/ts-node-server_codex.git`를 사용한다.
- 기본 브랜치는 `main`이며, 직접 개발/커밋은 금지한다.
- 통합 개발 브랜치는 `dev`를 사용하며, 기능 브랜치는 반드시 `dev`에서 분기한다.
- 기능 브랜치 네이밍은 `feature/<domain>` 형식을 사용한다. (예: `feature/sms`, `feature/kakao`)
- 버그 수정 브랜치 네이밍은 `fix/<domain>` 형식을 사용한다. (예: `fix/auth-token`)
- 핫픽스가 필요한 경우에만 `hotfix/<domain>`을 사용하며 `main`에서 분기 후 `main`과 `dev`에 모두 반영한다.
- 브랜치 병합 방향은 `feature/* -> dev`, `dev -> main` 순서를 따른다.
- `main`, `dev`에는 직접 push하지 않고 PR로만 병합한다.
- PR 생성 전 최소 실행: `npm run build`, `npm run test` (테스트 미구성 시 사유 명시)
- 커밋 메시지는 Conventional Commits를 사용한다. (예: `feat: add sms send api`, `fix: handle kakao token error`)
- DB 스키마 변경 PR은 `prisma/schema.prisma`, migration 파일, 적용/롤백 방법을 반드시 함께 포함한다.
- 강제 푸시(`push --force`)는 공유 브랜치(`main`, `dev`)에서 금지한다.

## Security Rules

- .env에 사용하는 변수들은 대문자+스네이크로 사용하며 값은 ""를 붙이지 않는다.

## Workflow

1. 관련 파일 탐색: `rg`, `find` 우선 사용.
2. 최소 변경 원칙으로 수정.
3. 가능하면 빌드/테스트 실행 후 결과 기록.
4. 결과 보고 시 변경 이유, 영향 범위, 남은 리스크를 명시.

## Guardrails

- 요청 없는 대규모 리팩토링 금지.
- 비밀값/토큰/개인정보 로그 출력 금지.
- deprecated 디렉터리 코드는 신규 기능에 사용 금지.

## Definition of Done

- 빌드 성공.
- 관련 테스트 통과 또는 미실행 사유 명시.
- 문서/스키마/마이그레이션 정합성 확인.
