# RIFTHOUSE

LoL 커뮤니티 내전을 위한 **v0.1.1 Initial Development Version**입니다. 닉네임 입력 → 내 프로필 선택 또는 선수 등록 → 경기 생성 → 참가자 모집 → 팀 편성 → 시리즈 결과 확인을 로컬 브라우저에서 테스트할 수 있습니다. Riot Games 공식 서비스가 아닙니다.

## 시작하기

Node.js 24 LTS와 npm을 권장합니다.

```bash
npm install
npm run dev
```

브라우저에서 http://127.0.0.1:3000 을 엽니다. 샘플 선수·경기·이벤트 없이 시작합니다. 처음에는 롤 닉네임을 입력하고, 기존 선수이면 바로 해당 프로필로 이동합니다. 신규 선수이면 닉네임이 채워진 등록 화면으로 이동합니다. 별도 계정이나 API 키는 필요하지 않습니다.

v0.1.0에서 만든 샘플은 최초 로딩 시 ID 기준으로 한 번 제거합니다. 사용자가 만든 UUID 선수·경기는 보존하며, 제거된 샘플과 연결된 참가 및 팀 참조만 정리합니다. 테스트용 샘플은 `tests/fixtures.ts`에만 있고 앱에는 포함되지 않습니다.

## 닉네임과 레이팅 정책

닉네임 또는 `닉네임#태그`를 입력합니다. 대소문자와 양끝 공백은 무시하고, 같은 닉네임이 여러 명이면 태그가 필요합니다. 선택한 선수 ID는 이 브라우저에 기억되며 상단의 프로필 전환으로 바꿀 수 있습니다. Riot 계정 소유권 인증이나 보안 로그인은 아닙니다.

내부 및 최종 레이팅은 **0~3,000점의 정수**입니다. 정책은 `src/domain/rating.ts`에서 관리합니다.

| 티어 | 최초 등록 점수 |
| --- | ---: |
| IRON | 500 |
| BRONZE | 750 |
| SILVER | 1,000 |
| GOLD | 1,250 |
| PLATINUM | 1,500 |
| EMERALD | 1,750 |
| DIAMOND | 2,000 |
| MASTER | 2,400 |
| GRANDMASTER | 2,700 |
| CHALLENGER | 3,000 |

일반 등록은 레이팅 입력과 운영자 보정 필드를 제공하지 않습니다. 서비스에서도 클라이언트가 보낸 점수를 무시하고 티어 기준 점수와 보정 0을 설정합니다. 등록 후 티어를 수정해도 기존 내부 점수와 보정은 유지합니다. 개발용 운영자 편집은 `/admin/players`로 분리했으며 합산 최종 점수도 상한을 검사합니다. 실제 권한 통제는 아직 없습니다.

```bash
npm test            # 독립 도메인 및 서비스 테스트
npm run lint
npm run typecheck
npm run build      # 프로덕션 빌드
npm run start      # 빌드된 앱 실행
```

브라우저 테스트는 먼저 빌드한 뒤 실행합니다. 테스트 러너가 필요한 경우 로컬 서버를 시작합니다.

```bash
npx playwright install chromium
npx playwright test
```

## 현재 기능

- 홈: 선수/경기 현황, 예정 내전, 최근 결과, 레이팅 랭킹, 이벤트
- 선수: 조회·검색·포지션 필터·생성·수정, Riot ID 중복 검사, 상세 게임 통계 및 레이팅 수정 기록
- 경기: BO1/BO3/BO5 생성, Fearless 설정, 참가자 추가/제거, 중복 및 10명 제한
- 팀: Fisher–Yates 무작위 배정, 결정론적 균형 후보 3개, 모바일에서도 가능한 선수 선택 교환
- 운영: DRAFT → READY → IN_PROGRESS → COMPLETED 상태 전환, 시작 전 CANCELLED 전환
- 결과: 개별 게임 승리 팀 입력, 자동 스코어 계산, 선승 조건 만족 시 종료, 중복 제출 및 추가 게임 차단
- 기록: 게임 시점의 팀·포지션 스냅샷과 선택적 챔피언 기록
- 이벤트: 경기 연결, 참가 신청, 대기·확정·출석 등 기본 상태 관리
- ADMIN: 선수·경기·이벤트 관리 진입점. OWNER: 향후 설정 화면 구조
- 반응형: 데스크톱 테이블, 모바일 선수 카드, 스크롤 가능한 네이티브 모달

## 기술 스택

Next.js App Router, TypeScript, React, Tailwind CSS 4, Lucide 아이콘을 사용합니다. 버전은 package.json 및 package-lock.json에 고정합니다. 앱은 기본 CSS 토큰과 Tailwind 유틸리티를 함께 사용합니다. 테스트 의존성은 TypeScript 컴파일러, Node Test Runner, Playwright입니다.

공식 참고: [Next.js 설치](https://nextjs.org/docs/app/getting-started/installation), [Tailwind Next.js 구성](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

## 프로젝트 구조

```text
src/
  app/                    # 페이지와 App Router 경로
  components/             # 재사용 UI, 폼, 팀 및 게임 운영 화면
  domain/types.ts         # Player, Match, Series, Game, Event 등 도메인 타입
  domain/rules.ts         # 레이팅, 스코어, 팀 검증, 게임 통계
  lib/balancing/          # 교체 가능한 결정론적 알고리즘
  services/platform.ts    # 데이터 조작 및 비즈니스 검증
  data/repository.ts      # Repository 계약, Memory/Local 구현
  data/migrations.ts      # 빈 초기 상태와 v0.1 샘플 정리
  data/identity.ts        # 로컬 프로필 선택 저장소
tests/                    # 핵심 로직·서비스 테스트
e2e/                      # 사용자 흐름·6개 화면 폭 브라우저 테스트
.github/workflows/ci.yml   # lint, test, build, e2e
```

UI는 서비스와 데이터 스냅샷만 사용합니다. Mock 데이터를 직접 import하거나 localStorage를 직접 읽지 않습니다. `PlatformProvider`는 로딩·오류·저장 상태와 서비스 구성을 담당합니다. `createServices(repository)`에 다른 저장소를 주입할 수 있습니다.

## 도메인과 계산

Effective Rating = Internal Rating + Admin Adjustment입니다. 최종 레이팅, 팀 평균, 승률, 시리즈 스코어는 저장하지 않고 계산합니다. Riot Tier는 참고 정보이며 초기 실력을 자동 판정하지 않습니다.

균형 알고리즘은 ID 순 정렬 후 좌우 반전을 제외한 126개 5대5 분할을 평가합니다. 각 팀은 120개 포지션 순열 중 최소 비용 배정을 고릅니다. 점수는 평균 레이팅 차이 + 포지션 비용이며, 주 포지션 0 / 부 포지션 35 / 그 외 120의 비용을 사용합니다. 상위 세 개의 서로 다른 팀 조합을 반환합니다. 이 상수와 평가 함수를 향후 확장할 수 있습니다.

Match는 참가 및 운영 상태, Series는 형식·Fearless·게임 목록, Game은 승자·챔피언·당시 로스터를 갖습니다. 모든 관계는 선수 이름 대신 ID를 사용합니다. `positionRatings`, `RatingEvent`, `MatchMembership`, `GlobalRole`은 향후 확장 경계입니다. HOST는 MatchMembership의 경기별 역할이고 ADMIN/OWNER는 전역 역할입니다.

## 로컬 데이터와 현재 한계

- 데이터는 **해당 브라우저·오리진의 개발용 localStorage**에만 저장됩니다. 다른 기기와 공유되지 않으며, 삭제하면 복구되지 않습니다.
- 초기화하려면 개발자 도구의 해당 사이트 저장소에서 `rift-house:development:v1` 키만 삭제한 후 새로고침합니다. 데이터 초기화를 자동 실행하지 않습니다.
- 로컬 저장소는 운영 데이터베이스가 아닙니다. 다중 탭의 동시 쓰기와 신뢰할 수 없는 데이터에 대한 서버 검증은 지원하지 않습니다. 운영 테스트는 한 탭에서 진행하세요.
- 실제 로그인, HOST 인증, ADMIN/OWNER 접근 제어가 없습니다. 모든 관리 화면은 개발용입니다.
- 결과 정정, 취소 경기 복구, 시리즈 중 로스터 변경은 지원하지 않습니다. 결과 입력 시 확인 모달을 제공합니다.
- 경기 승패에 따른 자동 레이팅은 없습니다. 내부 레이팅의 수동 수정만 RatingEvent로 기록합니다.
- 챔피언은 자유 텍스트로 기록하며 Fearless 중복 제한 및 실제 챔피언 검증은 하지 않습니다.
- 이벤트는 기본 컨테이너 및 상태 관리만 구현합니다. 이벤트 생성 편집, 토너먼트, 정원 조정에 따른 자동 승급은 향후 범위입니다.
- 일정 입력은 사용 기기의 현지 시간이며, 표시 시간대는 Asia/Seoul입니다.

## Supabase 전환 계획

v0.3에서 PostgreSQL, 인증, RLS를 도입합니다. 현재 Repository 구현을 바꿀 수 있지만 클라이언트의 전체 JSON을 그대로 원격 저장하는 방식은 사용하지 않습니다. `players`, `matches`, `match_players`, `series`, `games`, `team_players`, `events`, `event_registrations`, `rating_events` 등으로 관계를 분리하고 Domain↔Row 매퍼를 둡니다.

참가자 중복은 `(match_id, player_id)` unique constraint로, 결과 입력과 상태 전환은 트랜잭션/RPC로 옮깁니다. HOST 권한과 ADMIN/OWNER RLS는 서버에서 검증합니다. Recovery Code는 해시만 저장합니다. 현재 `transact` 콜백은 로컬 구현 편의를 위한 것이므로 원격 어댑터에서 서비스 메서드별 원자적 요청으로 대체해야 합니다.

`.env.example`은 향후 공개 설정값 자리만 제공합니다. 실제 Secret은 저장소에 넣지 않으며 서버 전용 환경변수로 관리합니다. AI API는 연결하지 않았습니다. 향후 AI는 결정론적 결과를 설명하는 선택 기능으로만 추가합니다.

## Netlify 배포 계획

현재 실제 배포는 수행하지 않습니다. 향후 저장소를 Netlify에 연결하고 Next.js 지원 런타임으로 `npm run build`를 실행하도록 구성합니다. Node 버전 및 공개/서버 환경변수를 설정하고 Preview에서 검증한 뒤 Production으로 승격합니다. Supabase 연결과 접근 제어 완료 전에는 로컬 개발 데이터 모델을 운영용으로 사용하지 않습니다. 이 프로젝트는 정적 export를 강제하지 않습니다.

## GitHub 개발 워크플로

`node_modules`, `.next`, 환경변수, 캐시, 테스트 산출물은 `.gitignore`로 제외합니다. `.env.example`과 lockfile은 추적합니다. 원격 저장소를 만들거나 push하지 않았습니다.

작은 기능 브랜치 → 의미 있는 commit → PR → CI → merge를 권장합니다. 예: `feat: add player management`, `feat: implement series results`, `fix: validate duplicate participants`, `docs: update roadmap`. GitHub Actions가 설치, 린트, 단위 테스트, 빌드, E2E를 실행합니다.

## 로드맵

| 버전  | 범위                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------ |
| v0.1  | 초기 UI, 선수, 내전, 기본 팀 편성, BO1/3/5, 결과 기록, 반응형                                                            |
| v0.2  | UX 개선, 버그 수정, 고급 경기 관리, HOST UI, 결과 정정                                                                   |
| v0.3  | Supabase, 영속 DB, Authentication, RLS                                                                                   |
| Later | 고급 Rating 및 Balancing, Fearless, 대규모 Event, Tournament, Attendance, Penalty, Audit Log, AI 분석, Netlify 운영 배포 |

구체적인 버전별 범위는 실제 사용 피드백에 따라 조정합니다.
