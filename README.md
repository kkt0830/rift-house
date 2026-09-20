# RIFTHOUSE

**League of Legends 커뮤니티를 위한 내전 운영 웹 애플리케이션**

선수 등록부터 5대5 팀 편성, BO1·BO3·BO5 경기 진행, 결과 기록과 이벤트 관리까지 한곳에서 처리하는 프로젝트입니다. OpenAI Codex를 활용해 개발하고 있으며, 실제 사용 피드백을 바탕으로 기능과 사용성을 개선합니다.

현재 패키지 버전은 **0.1.1**입니다. 로컬 저장 모드와 Supabase 공유 모드를 지원하는 개발 단계이며, Riot Games의 공식 서비스가 아닙니다.

## 주요 기능

| 영역 | 구현 내용 |
| --- | --- |
| 홈 | 선수·경기 현황, 예정 내전, 최근 결과, 레이팅 랭킹, 이벤트 |
| 선수 | 등록·검색·티어 및 포지션 필터, 프로필 수정, 게임 통계, 내부 레이팅 변경 기록 |
| 일괄 등록 | 엑셀 템플릿 다운로드, 파일 검사와 미리보기, 최대 500명 등록 |
| 팀 편성 | 무작위 편성, 레이팅과 선호 포지션을 반영한 균형 후보 3개, 선수 교환 |
| 경기 | BO1·BO3·BO5, 참가자 관리, 경기 시작·취소, 게임별 승리 팀과 챔피언 기록 |
| 결과 | 시리즈 스코어 계산, 선승 조건 충족 시 자동 종료, 당시 팀·포지션 스냅샷 저장 |
| 이벤트 | 관리자 화면에서 생성, 참가 신청, 정원 초과 시 대기 등록, 참가 상태 관리 |
| 관리자 | 아이디·비밀번호 로그인, 선수 관리, 내전 수동 종료·삭제 UI |
| 데이터 | 브라우저 로컬 저장 또는 Supabase 공유 저장·Realtime 변경 구독 |
| 화면 | 데스크톱·모바일 반응형 UI |

> 관리자 로그인과 화면 제한은 구현되어 있지만, 공용 데이터에 대한 서버 측 권한 통제는 아직 완성되지 않았습니다. 자세한 내용은 아래 **데이터 저장과 권한의 현재 상태**를 확인하세요.

## 빠르게 시작하기

Git, Node.js, npm이 필요합니다. 로컬 개발은 CI와 동일한 **Node.js 24**를 기준으로 합니다.

```bash
git clone https://github.com/kkt0830/rift-house.git
cd rift-house
npm ci
npm run dev
```

브라우저에서 [https://rift-house.netlify.app/](https://rift-house.netlify.app/)을 엽니다.

Supabase 환경변수를 설정하지 않으면 API 키 없이 로컬 모드로 실행됩니다. 초기 데이터는 비어 있으며, 직접 선수를 등록해 시작합니다. 관리자 로그인은 Supabase 연결과 별도로 등록된 관리자 계정이 필요합니다.

### 기본 사용 흐름

1. 롤 닉네임 또는 `닉네임#태그`를 입력합니다.
2. 기존 선수 프로필을 선택하거나 신규 선수를 등록합니다.
3. 경기 이름, 일정, BO 형식을 지정해 내전을 생성합니다.
4. 참가자 10명을 모아 무작위 또는 균형 편성으로 팀을 구성합니다.
5. 필요하면 선수를 교환하고 경기를 시작합니다.
6. 게임별 승리 팀과 선택적인 챔피언 기록을 입력합니다.
7. 시리즈 결과와 선수별 통계를 확인합니다.

닉네임 선택은 **Riot 계정 소유권 인증이 아닙니다**. 대소문자와 양끝 공백을 무시해 찾으며, 같은 닉네임이 여러 명이면 태그를 입력해야 합니다. 선택한 프로필은 해당 브라우저에 기억됩니다.

## 레이팅과 팀 편성

최종 레이팅은 `내부 레이팅 + 운영자 보정`으로 계산합니다. 내부 레이팅과 최종 레이팅은 모두 **0~3,000점의 정수**여야 합니다.

일반 선수 등록과 엑셀 등록에서는 아래 티어별 초기 점수를 적용하고 운영자 보정은 0으로 시작합니다. 이 점수는 프로젝트의 자체 기준이며 Riot의 공식 MMR이 아닙니다.

| 티어 | IV | III | II | I |
| --- | ---: | ---: | ---: | ---: |
| IRON | 500 | 560 | 620 | 680 |
| BRONZE | 750 | 810 | 870 | 930 |
| SILVER | 1,000 | 1,060 | 1,120 | 1,180 |
| GOLD | 1,250 | 1,310 | 1,370 | 1,430 |
| PLATINUM | 1,500 | 1,560 | 1,620 | 1,680 |
| EMERALD | 1,750 | 1,810 | 1,870 | 1,930 |
| DIAMOND | 2,000 | 2,100 | 2,200 | 2,300 |

| 티어 | 초기 점수 |
| --- | ---: |
| MASTER | 2,400 |
| GRANDMASTER | 2,700 |
| CHALLENGER | 3,000 |

- 등록 후 프로필에서 티어를 바꿔도 기존 내부 레이팅과 보정은 유지됩니다.
- 경기 승패에 따른 자동 레이팅 변경은 아직 없습니다.
- 운영자 수정으로 내부 레이팅이 바뀌면 `RatingEvent`가 기록됩니다. 모든 관리 작업을 기록하는 감사 로그는 아닙니다.
- 정책의 기준 파일은 [src/domain/rating.ts](src/domain/rating.ts)입니다.

균형 편성은 좌우 반전을 제외한 126개 팀 조합을 평가합니다. 각 팀의 포지션 배정 비용과 평균 레이팅 차이를 합산해 상위 3개 후보를 반환합니다. 포지션 비용은 주 포지션 0, 부 포지션 35, 나머지 120이며, AI API 없이 계산합니다.

## 엑셀 선수 등록

관리자 선수 화면에서 [엑셀 템플릿](public/templates/rift-house-player-import-template.xlsx)을 내려받아 첫 번째 시트에 입력합니다.

| 열 | 입력 예시 |
| --- | --- |
| 선수 이름 | 협곡친구 |
| Riot ID | RiftPlayer |
| Riot Tag | KR1 |
| 티어 | GOLD 2 |
| 주 포지션 | MID |
| 부 포지션 | SUPPORT |

`.xlsx` 파일을 지원합니다. 티어는 `IRON 4`부터 `DIAMOND 1`까지, 상위 티어는 `MASTER`, `GRANDMASTER`, `CHALLENGER`로 입력합니다. 포지션은 `TOP / JUNGLE / MID / ADC / SUPPORT` 중 선택하며 주·부 포지션은 달라야 합니다. 레이팅 열은 필요하지 않습니다.

파일 선택 후 검사 결과와 미리보기를 확인하고 등록합니다. 필수 값, 티어·포지션, Riot ID 중복을 검사하며 한 번에 최대 500명을 처리합니다.

## 데이터 저장과 권한의 현재 상태

### 로컬 모드

Supabase 설정이 없으면 `LocalRepository`를 사용합니다.

- 선수·경기·이벤트는 해당 브라우저와 오리진의 `localStorage`에 저장됩니다.
- 다른 기기와 공유되지 않으며 브라우저 데이터 삭제 시 사라집니다.
- 로컬 데이터를 초기화할 때만 개발자 도구에서 `rift-house:development:v1` 키를 삭제하고 새로고침합니다. 복구 기능은 없습니다.
- 탭 간 저장 변경을 감지해 다시 읽지만, 동시 쓰기에 대한 충돌 제어는 없습니다.

### Supabase 공유 모드

프로젝트 루트에 `.env.local`을 만들고 다음 두 값을 설정하면 `SupabaseRepository`를 사용합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

두 값은 모두 있어야 합니다. `.env.example`의 “v0.3 예약” 주석과 달리 현재 코드에서 이미 사용합니다. `NEXT_PUBLIC_` 값은 브라우저에 전달되므로 service role 또는 서버 전용 secret을 넣지 않습니다. 환경변수 변경 후 개발 서버를 다시 시작합니다.

저장소에는 다음 마이그레이션이 순서대로 포함되어 있습니다.

1. [공유 상태 테이블과 Realtime](supabase/migrations/202609190001_shared_platform.sql)
2. [이메일 기반 관리자 허용 목록](supabase/migrations/202609190002_admin_allowlist.sql)
3. [아이디·비밀번호 기반 관리자 세션](supabase/migrations/202609190003_username_admin_auth.sql)

연결 대상 DB에는 이 스키마와 함수가 준비되어 있어야 합니다. 마이그레이션 파일이 있다는 사실만으로 실제 DB에 적용됐음을 뜻하지는 않습니다.

현재 공유 데이터는 개별 관계형 테이블 대신 `app_state`의 `global` 행에 JSON으로 저장됩니다. 갱신 시 `revision`을 비교하고 충돌하면 최대 5회 시도하며, Realtime 변경을 구독해 다시 읽습니다. 로컬 데이터를 원격 DB로 자동 이전하는 기능은 없습니다.

### 관리자 인증과 권한 한계

현재 UI는 `admin_login`, `admin_session_role`, `admin_logout` RPC를 사용합니다. SQL에는 비밀번호 해시와 12시간 만료 세션 구조가 있으며, 브라우저는 세션 토큰을 로컬 저장소에 보관합니다. 관리자 계정 생성 UI와 기본 계정은 제공하지 않습니다.

**현재 포함된 RLS 정책은 익명 사용자에게도 공용 상태의 조회·수정을 허용합니다.** 관리자 세션은 `app_state` 갱신 요청의 권한 검증에 연결되어 있지 않습니다. 따라서 관리자 버튼을 숨기거나 페이지 접근을 제한하는 것만으로 데이터 변경이 보호되지는 않습니다.

공개 운영에 앞서 서버 측 작업별 권한 검증, 데이터 검증, 관리자 세션과 쓰기 권한의 연계가 필요합니다. HOST·ADMIN·OWNER 역할 구분도 전체 운영 권한 체계로 완성된 상태는 아닙니다.

## 개발 명령어와 검증

| 명령어 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm test` | 테스트 코드 컴파일 후 Node Test Runner 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드된 앱 실행 |

브라우저 E2E 테스트는 먼저 빌드한 뒤 실행합니다.

```bash
npm run build
npx playwright install chromium
npx playwright test
```

Playwright는 필요하면 `npm run start`로 서버를 시작하며, 동일 주소에 실행 중인 서버가 있으면 재사용합니다. 로컬 모드 검증에는 실제 공유 DB 환경변수를 사용하지 않는 별도 테스트 환경을 사용하세요.

[GitHub Actions](.github/workflows/ci.yml)는 push와 PR에서 `npm ci`, 린트, 단위 테스트, 빌드, Playwright 테스트를 실행하도록 구성되어 있습니다. 독립적인 `typecheck` 단계는 현재 CI에 없습니다. 테스트 구성의 존재와 실제 실행 성공 여부는 구분해야 합니다.

## 기술 스택과 구조

Next.js App Router, React, TypeScript, Tailwind CSS, Lucide, Supabase JavaScript SDK, read-excel-file을 사용합니다. 테스트 도구는 Node Test Runner와 Playwright입니다. 정확한 의존성 버전은 [package.json](package.json)과 [package-lock.json](package-lock.json)을 기준으로 합니다.

```text
src/
  app/                  # 홈, 선수, 경기, 이벤트, 랭킹, 관리자 페이지
  components/           # 폼, 팀 편성, 결과 입력, 인증 UI, Provider
  domain/               # 도메인 타입, 레이팅 정책, 검증·통계 규칙
  data/                 # Memory / Local / Supabase 저장소, 프로필, 마이그레이션
  lib/balancing/        # 무작위·균형 팀 편성
  lib/supabase.ts       # 환경변수 기반 Supabase 클라이언트
  services/platform.ts  # 선수·경기·이벤트 서비스
supabase/migrations/    # 공유 데이터 및 관리자 인증 SQL
public/templates/      # 선수 등록 엑셀 템플릿
tests/                 # 도메인·서비스 테스트
e2e/                   # 브라우저 사용자 흐름 테스트
.github/workflows/     # CI
netlify.toml           # Netlify 빌드 설정
```

UI는 Provider와 서비스 계층을 통해 데이터를 사용하고, `createServices(repository)`에 저장소 구현을 주입합니다. 최종 레이팅, 팀 평균, 승률과 시리즈 스코어는 저장된 원본 데이터에서 계산합니다.

## 배포 설정

[netlify.toml](netlify.toml)에 빌드 명령 `npm run build`, 게시 디렉터리 `.next`, Next.js 플러그인이 구성되어 있습니다. 현재 Netlify 설정의 Node 버전은 **22**, GitHub Actions는 **24**이므로 배포 환경을 점검할 때 이 차이를 함께 확인해야 합니다.

Supabase 공유 모드를 배포하려면 빌드 환경에도 위의 두 공개 환경변수가 필요합니다. 실제 배포 URL, 배포 성공 여부와 원격 DB 적용 상태는 저장소 설정만으로 확인할 수 없습니다.

## 현재 제한과 다음 개선 사항

- Riot 계정 인증, Riot API 기반 티어·전적 조회는 없습니다.
- Fearless 설정과 챔피언 기록은 있지만 중복 선택 제한과 실제 챔피언 검증은 없습니다.
- 결과 정정, 취소 경기 복구, 경기 진행 중 일반적인 로스터 교체는 지원하지 않습니다.
- 관리자 수동 종료는 최소 한 게임 결과가 있는 진행 중 경기에서 가능합니다.
- 선수 삭제는 연결된 참가·로스터·레이팅 기록에도 영향을 주며, 참가 중인 경기를 취소할 수 있습니다. 삭제 복구 기능은 없습니다.
- 이벤트 수정, 토너먼트, 대기자의 자동 승급은 향후 개선 범위입니다.
- 일정 입력은 기기의 현지 시간을 사용하고 표시 시간대는 Asia/Seoul입니다.

앞으로는 서버 권한 검증과 데이터 구조 개선을 우선하고, HOST 권한, 결과 정정·감사 로그, 자동 레이팅, Fearless 검증과 이벤트 운영을 단계적으로 확장합니다. 구체적인 범위와 버전은 실제 피드백에 따라 조정합니다.

## 개발 방식

기능 브랜치에서 변경하고, 의미 있는 커밋과 PR을 통해 검토한 뒤 CI 결과를 확인하고 병합하는 흐름을 권장합니다. 예: `feat: add match host controls`, `fix: validate series results`, `docs: update README`.

환경변수 파일과 비밀값은 커밋하지 않습니다. 의존성을 변경하면 lockfile도 함께 관리합니다.
