# sms_kakao_server

플랫큐브(세시아)가 외주사(A, B, C...)에 제공하는 문자/카카오 발송 중계 API 서버입니다.  
실제 발송 주체는 `prcompany`이며, 본 프로젝트는 발송 요청 접수, 재시도, 결과 대사, 정산 기준 데이터 관리를 담당합니다.

## 프로젝트 목적

- 외주사별 발송 API 제공 (`REST API`)
- prcompany 연동을 통한 실제 문자/카카오 발송
- 발송 이력/재시도 이력 관리
- 결과조회 스냅샷 저장(일/월)
- 클라이언트별 정산 기준 데이터(`BillingEvent`) 관리

## 기술 스택

- `TypeScript`
- `Node.js`
- `Express (REST API)`
- `Prisma`
- `MySQL`

## 아키텍처 개요

구조:

`prcompany(발송 주체) <-> 플랫큐브(본 서버) <-> 외주사 클라이언트(A/B/C)`

역할 분리:

- `Message`: 발송 요청 원본 + 현재 상태
- `ProviderDispatch`: prcompany 호출 시도(재시도 포함) 로그
- `MessageEvent`: 상태 변경 이력(append-only)
- `DeliveryResultSnapshot`: prcompany 결과조회 API(일/월 집계) 스냅샷
- `BillingEvent`: 클라이언트 정산 기준 과금 이벤트

## 지원 메시지 유형(도메인 기준)

- `SMS` (단문)
- `LMS` (장문)
- `MMS` (이미지 포함)
- `ALIMTALK` (카카오 알림톡)

## 채널별 발송 정책 (현재 설계)

- 즉시 발송 API: `/api/v1/client/messages/send`
- 예약 발송 API: `/api/v1/client/messages/schedule`
- 위 2개 API에서 `messageType`으로 채널을 분기합니다.
  - `SMS`
  - `LMS`
  - `MMS`
  - `ALIMTALK` (추후 발송 추가)

요청 필드 분기 기준:

- `SMS`
  - `content` 90바이트 이하
- `LMS`
  - `content` 2000바이트 이하
  - `title` 선택 (20바이트 이하)
- `MMS`
  - `content` 2000바이트 이하
  - `fileName` 필수
  - `title` 선택 (20바이트 이하)
- `schedule`
  - 위 채널별 조건 + `reservedTime` 필수

## prcompany 연동 엔드포인트 매핑

- `SMS 즉시`: `POST /sms/send`
- `SMS 예약`: `POST /sms/reserved`
- `LMS 즉시`: `POST /lms/send`
- `LMS 예약`: `POST /lms/reserved`
- `MMS 즉시`: `POST /mms/send`
- `MMS 예약`: `POST /mms/reserved`

공통 응답:

- `Count`
- `ResCd`
- `ResMsg`
- `Mac`

응답코드 처리 원칙:

- `ResCd === 0` -> 접수 성공(`ACCEPTED`)
- `ResCd !== 0` -> 실패 코드 분류 후 `RETRIED` 또는 `FAILED`

## 핵심 플로우

### 1) 발송 요청

1. 외주사 클라이언트가 API 호출
2. 인증/검증 수행
3. `Message` 생성
4. 즉시/예약 분기

### 2) 공급자 발송(prcompany)

1. 워커/스케줄러가 발송 대상 `Message` 조회
2. `ProviderDispatch` 생성 (`attemptNo = 1..N`)
3. prcompany API 호출
4. 응답 저장 (`ResCd`, `ResMsg`, `Count`, `Mac`)
5. `Message.status` 갱신 + `MessageEvent` 기록

### 3) 실패/재시도

1. `ResCd`/오류 유형 기반으로 `isRetryable` 판정
2. 재시도 가능 시 `nextRetryAt` 계산 (백오프 + 지터)
3. 재시도 시 `Message`는 재생성하지 않고 `ProviderDispatch`만 추가
4. 최대 횟수 초과 또는 재시도 불가이면 `FAILED` 종료

### 4) 결과조회(집계 스냅샷)

1. prcompany 결과조회 API(일/월 집계) 호출
2. 응답을 `DeliveryResultSnapshot`에 저장(upsert)
3. `BillingEvent` 집계와 대사(검증)

## DB 핵심 테이블 (요약)

- `Client`
  - 외주사 식별/인증 정보 (`clientCode`, `apiKeyHash`, 상태)
- `Message`
  - 발송 요청 단위 레코드
- `ProviderDispatch`
  - 공급자 호출 시도 이력 (`attemptNo`, `responseCode`, `dispatchedAt`, `respondedAt`)
- `MessageEvent`
  - 이벤트 이력 (`REQUESTED`, `DISPATCH_ATTEMPTED`, `ACCEPTED`, `FAILED`, ...)
- `DeliveryResultSnapshot`
  - prcompany 결과조회 일/월 집계 스냅샷 (`periodType`, `periodStart`)
- `BillingEvent`
  - 클라이언트 정산 기준 과금 이벤트 (`billingMonth`, `unitPrice`, `costPrice`)
- `ApiRequestLog`
  - API 접근 로그 및 client IP 기록

## 상태 / 이벤트 개념

- `Message.status`
  - 현재 상태 스냅샷 (조회/운영용)
- `MessageEvent`
  - 상태/행동 이력 로그 (감사/디버깅용)

예시 흐름:

- 즉시 발송 성공:
  - `REQUESTED -> DISPATCH_ATTEMPTED -> ACCEPTED -> DELIVERED`
- 재시도 후 성공:
  - `REQUESTED -> DISPATCH_ATTEMPTED -> RETRIED -> DISPATCH_ATTEMPTED -> ACCEPTED -> DELIVERED`

## 상태 전이 다이어그램

```mermaid
stateDiagram-v2
  [*] --> PENDING: 즉시 발송 요청
  [*] --> SCHEDULED: 예약 발송 요청

  SCHEDULED --> DISPATCHING: 예약 시각 도달/워커 처리
  PENDING --> DISPATCHING: 워커 처리 시작

  DISPATCHING --> ACCEPTED: prcompany 접수 성공 (ResCd=0)
  DISPATCHING --> PENDING: 재시도 가능 실패 (nextRetryAt 설정)
  DISPATCHING --> FAILED: 재시도 불가 실패 / 최대 재시도 초과

  ACCEPTED --> DELIVERED: 결과조회 배치에서 최종 성공 확인
  ACCEPTED --> FAILED: 결과조회 배치에서 최종 실패 확인

  SCHEDULED --> CANCELED: 예약 취소
```

## API 엔드포인트 초안

아래는 초기 설계 기준의 초안이며, 실제 구현 시 버전(prefix)과 인증 방식에 맞춰 조정합니다.

### Client(외주사) 발송 API

- `POST /api/v1/messages/send`
  - 단건 즉시 발송 요청 (`SMS`, `LMS`, `MMS`, `ALIMTALK`)
- `POST /api/v1/messages/schedule`
  - 단건 예약 발송 요청
- `POST /api/v1/messages/:messageId/cancel`
  - 예약 발송 취소 (`SCHEDULED` 상태만 허용)
- `GET /api/v1/messages/:messageId`
  - 메시지 현재 상태 조회 (`Message.status`)
- `GET /api/v1/messages/:messageId/events`
  - 메시지 이벤트 이력 조회 (`MessageEvent`)
- `GET /api/v1/messages`
  - 클라이언트 기준 메시지 목록 조회 (기간/상태/유형 필터)

### Client(외주사) 카카오 조회 API

- `GET /api/v1/client/kakao/profile`
  - 카카오 발신프로필 키 조회
- `GET /api/v1/client/kakao/templates`
  - 카카오 알림톡 템플릿 목록 조회
- `GET /api/v1/client/kakao/templates/:templateCode`
  - 카카오 알림톡 템플릿 내용 조회
- `GET /api/v1/client/kakao/templates/:templateCode/button1`
  - 카카오 알림톡 템플릿 버튼1 조회
- `GET /api/v1/client/kakao/templates/:templateCode/button2`
  - 카카오 알림톡 템플릿 버튼2 조회

설계 기준:

- 카카오 발송은 `messages/send`, `messages/schedule`에서 `messageType=ALIMTALK`으로 처리
- 카카오 조회성 기능은 `/client/kakao/*`로 분리

### 운영/관리 API (내부용)

- `POST /api/v1/internal/provider/prcompany/dispatch/retry`
  - 수동 재시도 트리거(운영자/배치용)
- `POST /api/v1/internal/reports/delivery-sync/day`
  - prcompany 일 단위 결과조회 동기화 실행
- `POST /api/v1/internal/reports/delivery-sync/month`
  - prcompany 월 단위 결과조회 동기화 실행
- `GET /api/v1/internal/reports/delivery-snapshots`
  - `DeliveryResultSnapshot` 조회
- `GET /api/v1/internal/billing-events`
  - `BillingEvent` 조회/검증
- `POST /api/v1/internal/billing/close-month`
  - 월 정산 마감 처리(정책 확정 후)

### 헬스체크

- `GET /api/v1/system/health`
  - 서버 상태 확인 (`HealthLog` 기록 여부는 구현 정책에 따름)

## 결과조회 / 스케줄러 운영 권장안

- `DAY` 결과조회: 매일 새벽 + 당일 재조회(여러 번)
- 최근 `3~7일` 백필 재조회: 공급자 지연 반영 보정
- `MONTH` 결과조회: 정산 검증/대사 용도
- `DeliveryResultSnapshot`는 `(periodType, periodStart)` 유니크로 관리

## 정산 기준

- 클라이언트 청구 기준 테이블은 `BillingEvent`
- `DeliveryResultSnapshot`는 공급자 수치 대사(검증) 용도
- 과금 기준 시점(예: `ACCEPTED` 기준 / `DELIVERED` 기준)은 정책으로 고정해서 혼용 금지

## 개발 환경 설정

### 1) 환경변수

루트의 `.env` 파일 사용:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/DB_NAME
SHADOW_DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/DB_NAME_shadow
```

### 2) 설치

```bash
npm install
```

### 3) Prisma

```bash
npm run prisma:migrate:dev
npm run prisma:generate
npm run prisma:deploy
```

### 4) 실행

개발 서버:

```bash
npm run dev
```

빌드:

```bash
npm run build
```

프로덕션 실행:

```bash
npm run start
```

## 현재 디렉토리 구조(요약)

```text
src/
  api/
    system/health/
  libs/
    error/
    prisma/
    validation/
prisma/
  schema.prisma
AGENT.md
```

## 운영 구현 시 추가 권장 사항

- API Key는 평문 저장 금지 (`sha256` + 서버측 비밀값 조합 권장)
- 공급자 요청/응답 원문 저장 시 민감정보 마스킹 적용
- 재시도 정책(횟수/간격)은 환경변수 또는 설정 파일로 관리
- `traceId` 기반 요청 추적 로그 통일
- 정산 중복 방지용 유니크 키/정책은 추후 확정

## Swagger 작업 플로우 (YAML 기반)

현재 `swagger-jsdoc`, `swagger-ui-express`는 설치된 상태를 기준으로 진행합니다.

1. 문서 구조 생성
- `docs/swagger/openapi.yaml`
- `docs/swagger/paths/**`
- `docs/swagger/components/**`

2. 루트 OpenAPI 작성
- `openapi`, `info`, `servers`, `tags` 정의
- `components.securitySchemes.bearerAuth` 정의
- `paths`에 `$ref` 연결

3. 공통 컴포넌트 작성
- 공통 응답 포맷(`{success,data,error}`)
- 에러 응답(`400/401/404/500`)
- 공통 스키마(`reason`, `pagination` 등)

4. 1차 문서 대상 API 고정
- `POST /api/v1/client/messages/send`
- `POST /api/v1/client/messages/schedule`
- `GET /api/v1/client/kakao/profile`
- `GET /api/v1/client/kakao/templates`

5. 앱에 Swagger 라우트 연결
- `src/docs/swagger.ts`에서 `swagger-jsdoc` 초기화
- `swagger-ui-express`로 `/docs` 서빙
- `app.ts`에 `app.use("/docs", swaggerRouter)` 연결

6. 동기화 규칙 적용
- DTO/검증 스키마 변경 시 Swagger YAML 동시 수정
- PR 체크리스트에 문서 반영 여부 포함
