# SoonSoo Discord Bot (Cloudflare Worker)

SoonSoo 디스코드 서버를 위한 서버리스 Discord Bot 프로젝트입니다.

## 기능 구성 및 모듈

1. **알림 설정 패널**
   - 채널 ID: `1464739174639861931`
   - 역할 선택 시 이미 보유 중이면 삭제, 없으면 부여하는 토글 방식.
   - 대상 역할:
     - 🔔SoonSoo Casino (`1464717746938843216`)
     - 🔔SoonSoo Gallery (`1464718508100419584`)
     - 🔔This is eat (`1464719545708318814`)
     - 🔔SoonSoo Modeling (`1533616152087887892`)
     - 🔔Double S Pacific (`1533616627764166797`)

2. **The Platinum 딜러 호출**
   - 채널 ID: `1533432137934442496`
   - `@SOON SOO CASINO THE PLATINUM` 회원(`1532447800326095028`)만 딜러 호출 버튼 이용 가능.
   - 호출 시 `@순수카지노 공식 딜러` (`1464720099339534438`) 팀에게 DM 발송 + `:white_check_mark:` 리액션 및 `[✅ 출동 / 방문 예정 승인]` 버튼 첨부.
   - 딜러가 승인 버튼 클릭 시, 호출한 회원 및 전체 딜러에게 방문 예정 DM 통보.

3. **SoonSoo Gallery 작품 의뢰**
   - 채널 ID: `1533531895873405081`
   - 차트 작성 버튼 클릭 시 모달창(닉네임, 사이즈, 요청사항, 사진 첨부 안내) 팝업.
   - 제출 시 "작품 의뢰" 카테고리(`1533615867529658389`) 내에 `작품-의뢰-001-닉네임` 채널 생성.
   - 권한자(`@대표`, `@그룹 관계자`, `@순수갤러리 아티스트`, `@갤러리 매니저`)가 `[🔒 의뢰 종료]` 클릭 시 `의뢰-종료-001-닉네임`으로 변경 및 "작품 의뢰 종료" 카테고리(`1533615593637281892`)로 이동.

4. **SoonSoo Modeling 의뢰 예약**
   - 채널 ID: `1532463261252063283`
   - 차트 작성 버튼 클릭 시 모달창(닉네임, 지정 아티스트, 부동산 종류, 부동산 주소, 요청 테마) 팝업.
   - 제출 시 "인테리어 의뢰" 카테고리(`1533616052964163714`) 내에 `인테리어-의뢰-001-닉네임` 채널 생성.
   - 권한자(`@순수모델링 디자이너`, `@대표`, `@그룹 관계자`)가 `[🔒 의뢰 종료]` 클릭 시 `의뢰-종료-001-닉네임`으로 변경 및 "인테리어 의뢰 종료" 카테고리(`1533615709500866612`)로 이동.

5. **커맨드 및 관리 기능**
   - `/기모찌` -> `기모찌` 메시지 출력
   - `/setup-panels` -> 알림, 딜러 호출, 갤러리/모델링 의뢰 패널 Embed 및 버튼을 각 채널에 자동으로 일괄 배치

---

## 환경 변수 (Secrets) 설정 & 배포 가이드

### 1. Cloudflare KV 생성 (최초 1회)
```bash
npx wrangler kv:namespace create TICKET_KV
```
출력된 KV ID를 `wrangler.toml`의 `id` 부분에 업데이터 해주세요.

### 2. Bot Secret 설정
```bash
npx wrangler secret put BOT_TOKEN
```
입력 요청 시 토큰 값(`MTUzMzYy...`)을 입력합니다.

### 3. Cloudflare Workers 배포
```bash
npx wrangler deploy
```

### 4. Discord Application 설정
1. [Discord Developer Portal](https://discord.com/developers/applications) 접속 -> 해당 앱 선택.
2. **General Information** -> **INTERACTIONS ENDPOINT URL**에 배포된 Cloudflare Worker URL 입력 (예: `https://soonsoo-bot.<your-subdomain>.workers.dev`).
3. Save Changes 클릭하여 검증 성공(Ping-Pong) 확인.

### 5. 초기 패널 및 슬래시 커맨드 등록
디스코드 서버의 아무 채널에서 `/setup-panels` 슬래시 커맨드를 실행하면 모든 지정된 채널에 알림/호출/의뢰 버튼 Embed 패널이 자동배치됩니다.
