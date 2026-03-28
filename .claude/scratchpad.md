# 작업 스크래치패드

## 현재 작업
- **요청**: 4가지 개선사항 (점프 버튼 분리, HUD 가시성, 일시정지, 메뉴 고도화)
- **상태**: 기획설계 완료
- **현재 담당**: planner-architect -> pm

## 진행 현황
| 단계 | 상태 | 담당 |
|------|------|------|
| 1. 4가지 개선사항 기획설계 | 완료 | planner-architect |
| 2. 페이즈1: 점프 버튼 분리 | 구현완료 | developer |
| 3. 페이즈2: HUD 가시성 개선 | 대기 | developer |
| 4. 페이즈3: 일시정지 기능 | 대기 | developer |
| 5. 페이즈4: 메뉴 고도화 | 대기 | developer |

## 작업 로그
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-03-28 | 액션 시스템 P1~P4 구현 (하트+슬라이드+적9종+아이템5종+스프링+부스트) | 전체 통과 |
| 2026-03-28 | 종합 개선+페이즈1~4 구현 (콤보+파티클+공룡능력+업적+상점) | 빌드 통과 |
| 2026-03-28 | AI 이미지 적용 + 오브젝트 스케일 조정 (PNG 전체 적용, 3배→1.5배) | 빌드 통과 |
| 2026-03-28 | 점프 밸런스 분석 + 개선 (obstacleScale+독수리높이+2단점프+히트박스) | 빌드 통과 |
| 2026-03-28 | 4가지 개선사항 전체 기획설계 (점프분리+HUD+정지+메뉴) | 설계 완료 |
| 2026-03-28 | 페이즈1: 점프 버튼 분리 (좌우터치+Z/X키+가이드HUD+튜토리얼갱신) | 빌드 통과 |

## 테스트 결과 (tester)

### 페이즈1: 점프 버튼 분리 빌드 검증 (2026-03-28)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| npx vite build 프로덕션 빌드 | 통과 | 1.30s, 에러 없음 (chunk 크기 경고만 있음 - 기능 무관) |
| config.js HIGH_VELOCITY=-790 | 통과 | LOW(-495)의 160% = -792, 반올림 -790 적용 확인 |
| Dino.js startJump(isHigh) 파라미터 | 통과 | isHigh=true시 HIGH_VELOCITY, false시 LOW_VELOCITY 선택 |
| Dino.js executeJump() 빈 메서드 | 통과 | 의도적 비움 + 주석 설명 있음, 하위 호환 유지 |
| GameScene.js 좌우 터치 분할 | 통과 | pointer.x > cameras.main.width / 2 로 판정 |
| GameScene.js Z키=낮은, X키=높은 점프 | 통과 | keydown-Z, keydown-X 이벤트 등록 확인 |
| GameScene.js SPACE=높은 점프 | 통과 | 기존 SPACE 키가 startJump(true)로 높은 점프 동작 |
| GameScene.js executeJump 호출 제거 | 통과 | pointerup, keyup-SPACE에서 주석으로 제거 명시 |
| GameScene.js JumpGuideHUD import+생성 | 통과 | import 및 create()에서 new JumpGuideHUD(this) 확인 |
| GameScene.js shutdown() Z/X 키 해제 | 통과 | keydown-Z, keyup-Z, keydown-X, keyup-X off 확인 |
| JumpGuideHUD.js 파일 존재+문법 | 통과 | 54줄, Phaser import, 좌우 가이드 텍스트, 5초 페이드아웃 |
| TutorialScene.js 안내 문구 갱신 | 통과 | 슬라이드1=낮은점프(Z키), 슬라이드2=높은점프(X키/SPACE)+2단점프 |

종합: 12개 중 12개 통과 / 0개 실패

## 구현 기록 (developer)

### 페이즈1: 점프 버튼 분리 (2026-03-28)

구현한 기능: 홀드 부스트 방식 -> 좌우 영역 분할 즉시 판정 방식으로 점프 시스템 전면 개편

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/config.js | HIGH_VELOCITY -700 -> -790 (160% 비율), HOLD_THRESHOLD 레거시 주석 | 수정 |
| src/objects/Dino.js | startJump(isHigh) 파라미터 추가, executeJump 빈 메서드화, 상단 주석 갱신 | 수정 |
| src/scenes/GameScene.js | _setupInput() 좌우 터치 분할 + Z/X/SPACE 키 매핑 + import/생성 JumpGuideHUD | 수정 |
| src/objects/JumpGuideHUD.js | 5초간 좌우 점프 가이드 반투명 UI (톡! 낮은점프 / 쑥! 높은점프) | 신규 |
| src/scenes/TutorialScene.js | 튜토리얼 슬라이드 안내 문구를 버튼 분리 방식에 맞게 업데이트 | 수정 |

tester 참고:
- 테스트 방법: 게임 시작 후 화면 왼쪽 터치=낮은 점프, 오른쪽 터치=높은 점프 확인
- 키보드: Z=낮은, X/SPACE=높은 점프 확인
- 정상 동작: 높은 점프가 낮은 점프보다 확연히 높아야 함 (160%)
- 주의: 공중에서는 좌우 구분 없이 2단 점프 발동, 게임 시작 5초간 가이드 표시 확인

reviewer 참고:
- executeJump()는 하위 호환을 위해 빈 메서드로 유지 (다른 곳에서 호출해도 에러 안남)
- shutdown()에 Z/X 키보드 이벤트 해제 추가됨

## 기획설계 (planner-architect)

### 4가지 개선사항 전체 설계 (2026-03-28)

---

#### [개선 1] 점프 시스템 개편: 버튼 2개 분리

**현재 문제 (비유: 에어컨 리모컨)**
현재는 하나의 버튼으로 "짧게 누르면 송풍, 길게 누르면 냉방"처럼 동작합니다.
6살 아이에게는 "이 버튼은 송풍, 저 버튼은 냉방"처럼 완전 분리가 더 쉽습니다.

**현재 구현 분석:**
- Dino.js `startJump()`: pointerdown 시 바닥이면 LOW_VELOCITY(-495)로 즉시 점프
- Dino.js `executeJump()`: pointerup 시 150ms 이상 눌렀으면 HIGH_VELOCITY(-700)로 부스트
- GameScene.js `_setupInput()`: pointerdown=startJump, pointerup=executeJump 또는 slide
- 키보드: SPACE=점프, DOWN=슬라이드
- 터치: 화면 아무 곳 터치=점프, 아래 스와이프(50px+)=슬라이드
- 2단 점프: 공중에서 startJump() 재호출 시 doubleJump()

**요청 수치: 높은 점프 = 낮은 점프의 160%**
- 현재 LOW=-495, HIGH=-700 (HIGH/LOW = 141%)
- 160% 적용: HIGH = -495 x 1.6 = **-792** (반올림 -790)
- 물리 계산: 최대 높이 = 790^2 / (2x800) = **390px** (현재 306px에서 27% 증가)
- 체공 시간 = 2x790/800 = **1.975초**
- 브라키오(x1.2): -948, 최대 562px, 2.37초

**설계안: 화면 좌/우 영역 분할**

```
[화면 구조 - 세로 모바일]
┌────────────────────┐
│     HUD 영역        │
│                    │
│    게임 플레이 영역    │
│                    │
├─────────┬──────────┤  <-- 바닥 아래 영역 (투명 터치존)
│ 낮은점프  │ 높은점프   │
│  (왼쪽)  │  (오른쪽)  │
└─────────┴──────────┘
```

- **왼쪽 절반 터치** = 낮은 점프 (즉시 발동, 누르기만 하면 됨)
- **오른쪽 절반 터치** = 높은 점프 (즉시 발동, 누르기만 하면 됨)
- **아래 스와이프** = 기존 슬라이드 유지
- **공중에서 아무 곳 터치** = 2단 점프 (기존 유지)
- **키보드**: Z=낮은점프, X=높은점프, DOWN=슬라이드 (SPACE는 높은점프와 동일)

**UI 버튼 표시 (반투명 가이드):**
- 게임 화면 하단에 반투명 좌우 화살표 아이콘 표시
- 왼쪽: 작은 위쪽 화살표 + "톡" 글자
- 오른쪽: 큰 위쪽 화살표 + "쑥" 글자
- 첫 플레이 시에만 표시, 5초 후 페이드아웃 (또는 튜토리얼에서 안내)

**2단 점프와의 관계:**
- 바닥: 왼쪽=낮은, 오른쪽=높은
- 공중: 왼쪽이든 오른쪽이든 = 2단 점프 (공중에서는 구분 불필요)
- 이유: 2단 점프는 "추가 한번 더"의 의미이므로 높이 구분이 없음

**공룡 특수능력 호환성:**
- 브라키오(highJump): jumpMulti=1.2는 양쪽 모두에 적용됨 (변경 불필요)
- 프테라노(glide): 하강 중력 감소는 점프 방식과 무관 (변경 불필요)
- 티라노/트리케라: 점프와 무관 (변경 불필요)

**수정할 파일:**

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/config.js | HIGH_VELOCITY -700 -> -790 (160% 비율) | 수정 |
| src/objects/Dino.js | startJump(isHigh) 파라미터 추가, executeJump 홀드 로직 제거 | 수정 |
| src/scenes/GameScene.js | _setupInput() 좌우 영역 분할 로직 | 수정 |
| src/objects/JumpGuideHUD.js | 좌우 점프 가이드 UI (반투명 화살표) | **신규** |

---

#### [개선 2] HUD 가시성 개선

**현재 HUD 분석:**

| HUD | 위치 | 크기 | 문제점 |
|-----|------|------|--------|
| StageHUD 월드명 | 좌상단 (15,10) | 28px | 배경과 겹칠 때 안 보임 |
| StageHUD 점수 | 중상단 | 32px | 괜찮음 |
| StageHUD 난이도별 | 우상단 (w-15,8) | 24px | 별/카운터가 작음 |
| HeartHUD | 좌상단 (20,68) | 22px 하트 | 배경색에 따라 안 보임 |
| PowerUpHUD | 우상단 (w-90,30) | 12px 라벨 | 너무 작고 StageHUD와 겹침 |
| 프로그레스 바 | 중앙 (y=48) | 160x12 | 얇아서 못 봄 |

**설계안:**

1. **반투명 배경 패널 추가** (비유: TV 자막 배경처럼)
   - HUD 전체를 감싸는 반투명 검정 패널 (alpha=0.3)
   - 높이 약 80px, 상단 전체
   - 이렇게 하면 어떤 배경이든 글씨가 잘 보임

2. **하트 크기 확대 + 위치 조정**
   - heartSize: 22 -> 28 (27% 확대)
   - spacing: 48 -> 56
   - 위치: y=68 -> y=72 (배경 패널 안에)

3. **별 카운터 독립 표시**
   - 현재: 난이도 텍스트에 통합 ("별별별 23/100")
   - 변경: 별 아이콘 + 큰 숫자로 독립 ("별 23" 형태, 24px)
   - 위치: 하트 오른쪽에 배치

4. **프로그레스 바 확대**
   - barWidth: 160 -> 200
   - barHeight: 12 -> 16
   - 바 양쪽에 현재/목표 숫자 표시

5. **PowerUpHUD 위치 이동**
   - 현재: 우상단 (StageHUD와 겹침)
   - 변경: 공룡 머리 위 (dino.x, dino.y - 60)
   - 공룡을 따라다니므로 항상 눈에 들어옴

**수정할 파일:**

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/objects/StageHUD.js | 반투명 배경 + 프로그레스 바 확대 + 별 카운터 독립 | 수정 |
| src/objects/HeartHUD.js | 하트 크기 확대 + 위치 조정 | 수정 |
| src/objects/PowerUpHUD.js | 위치를 공룡 머리 위로 변경 | 수정 |
| src/scenes/GameScene.js | HUD 초기화 위치값 조정 | 수정 |

---

#### [개선 3] 게임 일시정지 (Pause) 기능

**비유: 영화 보다가 화장실 갈 때 리모컨의 일시정지 버튼**

**Phaser에서 일시정지하는 방법:**
- `this.scene.pause('GameScene')` = 해당 씬의 update() 호출 중지 + 물리 엔진 정지
- `this.scene.resume('GameScene')` = 다시 시작
- 별도의 PauseScene을 GameScene 위에 overlay로 실행하는 방식이 가장 깔끔

**설계안:**

```
[일시정지 화면 구조]
┌────────────────────┐
│    ██████████████   │  <-- 반투명 어두운 오버레이
│                    │
│    ⏸ 일시정지       │  <-- 큰 텍스트
│                    │
│   [▶ 계속하기]      │  <-- 버튼 1
│   [🔄 다시하기]     │  <-- 버튼 2
│   [🏠 나가기]      │  <-- 버튼 3
│                    │
└────────────────────┘
```

**일시정지 진입 방법:**
- 화면 우상단 일시정지 아이콘 터치 (항상 표시)
- 키보드 ESC 키
- 키보드 P 키

**버튼 기능:**
- "계속하기": scene.resume('GameScene') + PauseScene 종료
- "다시하기": GameScene 재시작 (현재 스테이지 처음부터)
- "나가기": WorldMapScene으로 이동 (진행 중 데이터 저장 안 함)

**구현 핵심:**
- PauseScene은 GameScene 위에 launch()로 실행 (start가 아님!)
- launch = "덮어서 실행" (아래 씬이 살아있음)
- start = "교체" (아래 씬이 사라짐)

**수정할 파일:**

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/scenes/PauseScene.js | 일시정지 오버레이 씬 (반투명 배경 + 3개 버튼) | **신규** |
| src/scenes/GameScene.js | 일시정지 버튼 추가 + ESC/P 키 이벤트 | 수정 |
| src/main.js | PauseScene 등록 | 수정 |

---

#### [개선 4] 메뉴 고도화

**현재 메뉴 흐름 분석:**

```
BootScene(로딩) -> SelectScene(공룡4종) -> DifficultyScene(난이도5단계)
  -> TutorialScene(첫회만) -> WorldMapScene(월드맵) -> GameScene
```

**각 씬 현재 상태 평가:**

| 씬 | 현재 상태 | 개선 포인트 |
|----|----------|-----------|
| SelectScene | 2x2 카드, 능력 텍스트 작음 | 카드 크기 확대, 능력 아이콘 추가, 미리보기 애니메이션 |
| DifficultyScene | 5개 세로 카드 | 설명이 짧음, 각 난이도 차이 시각화 부족 |
| WorldMapScene | 6개 월드 카드+스테이지 버튼 | 스크롤이 필요하여 전체 파악 어려움 |

**설계안:**

A. **SelectScene 개선**
- 카드 선택 시 공룡이 가운데서 달리기 애니메이션 (미리보기)
- 능력 설명을 아이콘+큰 텍스트로 변경
- "이 공룡은 높이 뛸 수 있어요!" 같은 한 줄 설명 추가

B. **DifficultyScene 개선**
- 각 난이도별 아이콘 크게 표시 (알, 아기공룡, 꼬마공룡 등 성장 단계)
- 현재 진행도 표시 ("이 난이도로 3스테이지까지 클리어했어요")
- 하단에 "자유 모드" 버튼 추가 (스테이지 없이 무한 러닝)

C. **WorldMapScene 개선**
- 현재 월드를 크게, 나머지는 작게 (포커스 모드)
- 좌우 스와이프로 월드 전환 (현재는 세로 스크롤)
- 각 월드 카드에 배경 이미지 미리보기 추가

**수정할 파일:**

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/scenes/SelectScene.js | 카드 확대 + 미리보기 + 능력 강조 | 수정 |
| src/scenes/DifficultyScene.js | 아이콘 + 진행도 + 자유모드 버튼 | 수정 |
| src/scenes/WorldMapScene.js | 좌우 스와이프 + 포커스 모드 | 수정 |

---

### 전체 로드맵 (우선순위 + 의존관계)

**페이즈 분배 기준:** 독립적이고 체감이 큰 것 먼저

| 페이즈 | 작업 | 파일 수 | 예상 시간 | 의존관계 |
|--------|------|--------|----------|---------|
| **P1** | 점프 버튼 분리 | 4 (신규1+수정3) | 15분 | 없음 |
| **P2** | HUD 가시성 개선 | 4 (수정4) | 15분 | 없음 |
| **P3** | 일시정지 기능 | 3 (신규1+수정2) | 10분 | 없음 |
| **P4** | 메뉴 고도화 | 3 (수정3) | 20분 | 없음 |

P1~P3은 서로 독립적이므로 병렬 가능하지만, 한 번에 하나씩 진행 권장.
P4는 게임플레이와 무관하므로 가장 나중에.

### 실행 계획

| 순서 | 작업 | 담당 | 선행 조건 | 수정 파일 |
|------|------|------|----------|----------|
| 1 | config.js HIGH_VELOCITY 변경 (-700 -> -790) | developer | 없음 | config.js |
| 2 | Dino.js startJump(isHigh) 분기 + executeJump 홀드 제거 | developer | 1 | Dino.js |
| 3 | GameScene.js 좌우 터치 분할 + 키보드 Z/X 매핑 | developer | 2 | GameScene.js |
| 4 | JumpGuideHUD.js 신규 생성 (반투명 가이드) | developer | 3 | JumpGuideHUD.js (신규) |
| 5 | 빌드 테스트 | tester | 1~4 | - |
| 6 | HUD 4파일 수정 (StageHUD+HeartHUD+PowerUpHUD+GameScene) | developer | 5 통과 | 4파일 |
| 7 | 빌드 테스트 | tester | 6 | - |
| 8 | PauseScene.js 신규 + GameScene/main.js 수정 | developer | 7 통과 | 3파일 |
| 9 | 빌드 테스트 | tester | 8 | - |
| 10 | 메뉴 3씬 수정 (Select+Difficulty+WorldMap) | developer | 9 통과 | 3파일 |
| 11 | 최종 빌드 테스트 | tester | 10 | - |

**developer 주의사항:**
- P1: startJump()의 기존 홀드 부스트(jumpStartTime, isJumpHeld, executeJump) 로직을 완전 제거해야 함
- P1: 좌우 영역 판정은 `pointer.x < width / 2`로 간단히 구분
- P1: 공중에서는 좌우 구분 없이 무조건 doubleJump() 호출 (기존과 동일)
- P2: StageHUD 반투명 배경은 `fillStyle(0x000000, 0.3)` + `fillRect(0, 0, width, 80)` 으로 처리
- P3: PauseScene에서 scene.pause/resume 사용 시 BGM도 일시정지해야 함 (soundGenerator)
- P3: launch() 사용 시 PauseScene은 별도 카메라가 필요하지 않음 (전체화면 오버레이)
- P4: WorldMapScene 좌우 스와이프는 기존 세로 스크롤 코드를 교체하는 방식
