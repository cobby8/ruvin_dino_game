# 작업 스크래치패드

## 현재 작업
- **요청**: 3가지 대규모 기능 추가 (점프 시스템 개편 + 난이도 5단계 + 스테이지 30개)
- **상태**: ✅ 전체 완료 (3페이즈 모두 커밋됨)
- **현재 담당**: pm

## 진행 현황
| 단계 | 상태 | 담당 |
|------|------|------|
| 1. 기획설계 | 완료 | planner-architect |
| 2. 페이즈1 (점프+난이도) | ✅ 커밋됨 | developer+tester |
| 3. 페이즈2 (스테이지+월드) | ✅ 커밋됨 | developer+tester |
| 4. 페이즈3 (씬흐름+저장) | ✅ 커밋됨 | developer+tester |

## 작업 로그
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-03-28 | 페이즈2 빌드+코드검증 (62항목 전수 테스트) | 전체 통과 |
| 2026-03-28 | 페이즈3 구현: 씬흐름+저장 (3신규+5수정, 8파일) | 빌드 통과 |
| 2026-03-28 | 페이즈3 빌드+코드검증 (78항목 전수 테스트) | 전체 통과 |
| 2026-03-28 | 장애물 가시성 긴급 수정: depth 정리 + 외곽선 + 색상 강화 (3파일) | 빌드 통과 |
| 2026-03-28 | 액션 시스템 대규모 설계: 하트+슬라이드+적밟기+아이템+스프링 (4페이즈, 신규9+수정9) | 설계 완료 |
| 2026-03-28 | P1 구현: 하트시스템+슬라이드+피격무적+HeartHUD (1신규+7수정) | 빌드 통과 |
| 2026-03-28 | P2 구현: 적 캐릭터 9종+밟기/슬라이드 공격+이펙트 (3신규+4수정) | 빌드 통과 |
| 2026-03-28 | 월드맵 버그2건 수정: 스테이지 클릭 충돌 해결 + "처음부터" 버튼 추가 (WorldMapScene.js) | 빌드 통과 |

## 구현 기록 (developer)

### 월드맵 버그 2건 수정 (2026-03-28, debugger)

#### 수정 이력
| 회차 | 수정 내용 | 수정 파일 | 비고 |
|------|----------|----------|------|
| 1차 | 스테이지 버튼 pointerdown->pointerup 변경 + 드래그/클릭 구분 로직 추가 | WorldMapScene.js | 드래그 스크롤과 클릭 충돌 해결 |
| 2차 | "처음부터" 버튼 추가 + 확인 다이얼로그 | WorldMapScene.js | localStorage 초기화 + SelectScene 이동 |

### 3단점프 수정 + 점수 시스템 재설계 (2026-03-28)

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/objects/Dino.js | startJump()에 !isDoubleJumpUsed 조건 추가 → 3단 점프 차단 | 수정 |
| src/config.js | STAR.LIFE_BONUS_COUNT:100 추가 (별 100개=목숨+1) | 수정 |
| src/scenes/GameScene.js | this.score → this.clearScore + this.starCount 분리, 별 수집 시 클리어점수 불포함, 100개=목숨+1 | 수정 |
| src/objects/StageHUD.js | 우상단 별 카운터 UI 추가 + updateStarCount() 메서드 | 수정 |
| src/scenes/StageClearScene.js | data.score → data.clearScore/starCount, 별 수집 수 표시 추가 | 수정 |
| src/scenes/GameOverScene.js | data.score → data.clearScore/starCount, 별 수집 수 표시 추가 | 수정 |

tester 참고:
- 3단 점프 테스트: 바닥→점프→공중점프→공중에서 또 누르기 → 3단째는 무반응이어야 함
- 별 수집: 별 먹어도 상단 중앙 "N/목표" 숫자가 안 올라가야 함 (우상단 별 카운터만 증가)
- 장애물 넘기/적 처치만 클리어 점수에 반영
- 별 100개 모으면 목숨+1 + "1UP!" 팝업 + 카운터 리셋
- HUD 배치: 좌상단=하트, 상단중앙=클리어점수/목표, 우상단=난이도별+별카운터
- 클리어/게임오버 화면에 "넘은 장애물: N" + "모은 별: N" 분리 표시

## 기획설계 (planner-architect)

### 액션 시스템 대규모 확장 설계 (2026-03-28)

---

#### [A] 설계 목표

6살 루빈이가 "점프만 하는 게임"에서 "적도 밟고, 아이템도 먹고, 구르기도 하는 게임"으로 업그레이드.
마리오의 "적 밟기 + 코인" + 소닉의 "구르기 + 스프링"을 6살 수준으로 단순화.

핵심 원칙:
- 버튼 2개 이하 (점프 + 슬라이드)
- 한 손 터치로 모든 조작 가능
- 실패해도 바로 죽지 않음 (하트 시스템)
- 시각/청각 피드백이 화려함

---

#### [B] 조작 체계 재설계

현재: 터치/스페이스 = 점프 (짧게/길게/2단)
변경 후:

| 조작 | 터치 | 키보드 | 액션 |
|------|------|--------|------|
| 위로 (기존) | 화면 터치 | 스페이스 | 점프 (짧게=낮게, 길게=높게, 공중=2단) |
| 아래로 (신규) | 아래 스와이프 | 아래 화살표 | 슬라이드 (구르기) |

비유: 지금은 "위로만 움직이는 엘리베이터"인데, "위+아래 두 버튼 엘리베이터"로 바꾸는 것.

슬라이드 상세:
- 아래 버튼 누르면 공룡이 납작하게 엎드림 (높이 절반)
- 0.8초 동안 유지 후 자동으로 일어남
- 슬라이드 중에는 점프 불가
- 공중에서 아래 누르면 "내려찍기" (빠르게 착지 + 적 밟기 강화)
- 쿨타임 없음 (연속 슬라이드 가능)

왜 슬라이드인가:
- 머리 위로 날아오는 장애물(새, 비행 적)을 피할 수 있음
- 소닉의 구르기처럼 땅 위의 적을 파괴 가능
- 점프와 슬라이드 2가지면 충분한 전략성

---

#### [C] 하트(HP) 시스템

현재: 장애물 닿으면 즉시 게임오버
변경 후: 하트가 있으면 1개 소모 + 무적 시간

| 항목 | 값 |
|------|-----|
| 기본 하트 | 난이도별 차등 (아래 표 참조) |
| 피격 시 | 하트 -1 + 2초 무적 (깜빡거림) |
| 하트 0에서 피격 | 게임오버 |
| 하트 회복 | 하트 아이템으로만 회복 (최대값까지) |

난이도별 하트:

| 난이도 | 기본 하트 | 최대 하트 |
|--------|----------|----------|
| 아기공룡 | 5 | 5 |
| 꼬마공룡 | 4 | 4 |
| 씩씩한공룡 | 3 | 3 |
| 용감한공룡 | 2 | 3 |
| 전설의공룡 | 1 | 2 |

피격 연출:
- 공룡 2초간 깜빡깜빡 (투명 <-> 불투명 반복)
- 화면 빨간색 플래시
- "아야!" 효과음
- 하트 UI에서 하트 1개가 깨지는 애니메이션

비유: "게임 목숨"이 여러 개인 것. 마리오에서 버섯 먹으면 한 대 더 맞아도 괜찮은 것처럼.

---

#### [D] 적 캐릭터 시스템

현재 "고정 장애물"과 새로운 "움직이는 적"의 차이:
- 고정 장애물: 바닥에 서있고 왼쪽으로 이동 (기존 선인장, 돌 등)
- 움직이는 적: 자기만의 행동 패턴이 있음 (걸어다니기, 날기, 점프하기)

적 밟기 판정:
- 공룡이 적의 **위쪽 30%** 영역에 닿으면 = 적 처치! (밟기 성공)
- 공룡이 적의 **옆/아래 70%** 영역에 닿으면 = 피격 (하트 -1)
- 슬라이드 중 적에 닿으면 = 적 처치! (구르기 공격)
- 내려찍기로 적 위에 착지 = 적 처치 + 높이 바운스 점프

적 처치 연출:
- 적이 "퍽!" 터지면서 별 파티클 (5~8개)
- 처치 효과음 ("뿅!")
- 점수 +2 (장애물 넘기는 것보다 보상 큼)
- "잘했어!" 텍스트가 잠깐 뜸

월드별 적 종류 (각 월드 2종):

| 월드 | 걸어다니는 적 | 날아다니는 적 | 특징 |
|------|-------------|-------------|------|
| 1. 풀밭 | 무당벌레 (빨강 둥근 벌레) | 나비 (위아래 떠다님) | 느리고 귀여움 |
| 2. 사막 | 전갈 (갈색, 좌우 왕복) | 독수리 (빠르게 돌진) | 중간 속도 |
| 3. 숲 | 다람쥐 (빠르게 뜀) | 올빼미 (위에서 아래로) | 예측 어려움 |
| 4. 화산 | 용암괴물 (느리지만 큼) | 박쥐 (지그재그) | 크고 위협적 |
| 5. 바다 | 게 (좌우 왕복) | 갈매기 (수평 비행) | 물 테마 |
| 6. 하늘 | 구름괴물 (천천히 이동) | 번개새 (빠르게 통과) | 하늘 테마 |

적 행동 패턴:

| 패턴 | 설명 | 사용 적 |
|------|------|---------|
| walk | 바닥에서 일정 속도로 왼쪽 이동 | 무당벌레, 전갈, 다람쥐, 용암괴물, 게, 구름괴물 |
| fly_sine | 공중에서 사인파로 위아래 움직임 | 나비, 올빼미, 박쥐, 갈매기 |
| fly_swoop | 위에서 아래로 급강하 후 다시 올라감 | 독수리, 번개새 |

적 스폰 규칙:
- 스테이지 1~5 (월드1): 적 없음. 기존 장애물만 (입문 단계)
- 스테이지 6~10 (월드2): 걸어다니는 적만 등장 (적 밟기 학습)
- 스테이지 11+ (월드3~6): 걸어다니는 적 + 날아다니는 적 모두 등장
- 적 출현 비율: 장애물 3 : 걸어다니는 적 1 : 날아다니는 적 1 (대략)

---

#### [E] 수집 아이템 시스템

달리면서 닿으면 자동으로 먹는 반짝이는 아이템들.

아이템 종류:

| 아이템 | 모양 | 효과 | 배치 위치 | 출현 빈도 |
|--------|------|------|----------|----------|
| 별 (코인) | 노란 별 (반짝반짝) | 점수 +1 | 공중 (점프해서 먹음) / 바닥 | 매우 자주 |
| 하트 | 빨간 하트 (통통) | 하트 +1 회복 | 공중 (높은 곳) | 드물게 |
| 무적별 | 무지개 큰 별 | 5초 무적 + 빛남 | 공중 (중간 높이) | 매우 드물게 |
| 자석 | 파란 U자석 | 5초간 아이템 자동 흡수 | 바닥 | 드물게 |
| 스프링 | 초록 스프링 | 밟으면 초고점프 | 바닥 (고정) | 스테이지에 1~2개 |

아이템 배치 패턴:
- 별(코인)은 곡선이나 직선으로 3~5개씩 묶어서 배치 (마리오 코인 줄처럼)
- 하트는 높은 곳에 단독 배치 (높은 점프 또는 2단 점프 필요)
- 파워업(무적별, 자석)은 물음표 블록 안에 숨김

물음표 블록:
- 공중에 떠있는 물음표(?) 블록
- 점프해서 머리로 치면 (아래에서 닿으면) 아이템 팝업
- 안에 뭐가 나올지 랜덤 (별x3 60%, 하트 20%, 파워업 20%)
- 월드마다 블록 색상이 테마에 맞게 변경

수집 연출:
- 별: "쨍!" 소리 + 별이 흡수되며 커졌다 사라짐
- 하트: "두근!" 소리 + 하트가 HUD쪽으로 날아감
- 무적별: "짜잔~!" 소리 + 공룡이 무지개색으로 빛남 + 배경 반짝
- 자석: "윙~" 소리 + 주변 아이템이 공룡쪽으로 빨려옴
- 스프링: "보잉!" 소리 + 높이 날아감

---

#### [F] 파워업 시스템

| 파워업 | 지속시간 | 효과 | 시각 효과 |
|--------|---------|------|----------|
| 무적별 | 5초 | 적/장애물에 닿아도 안 죽음 + 닿으면 파괴 | 공룡 무지개색 깜빡 + 별 파티클 |
| 자석 | 5초 | 화면 내 모든 별(코인)이 공룡쪽으로 자동 흡수 | 공룡 주변 파란 원형 필드 |
| 방어막 | 1회 | 다음 1번 피격 무시 (하트 대신 방어막이 깨짐) | 공룡 주변 반투명 버블 |

파워업 HUD 표시:
- 화면 우측 상단에 현재 활성 파워업 아이콘 + 남은 시간 바
- 시간이 2초 남으면 아이콘 깜빡 (곧 끝난다는 경고)

---

#### [G] 스프링 점프대 + 특수 오브젝트

스프링:
- 바닥에 놓인 초록색 스프링 (눌렸다 펴지는 애니메이션)
- 공룡이 밟으면 점프력 x2.5 (평소보다 훨씬 높이 뜀)
- 높은 곳에 있는 보너스 별 줄을 먹을 수 있는 기회
- 스프링 점프 중에는 2단 점프 불가 (너무 높이 뜨니까)

부스트 구간:
- 바닥에 화살표 줄 (>>>>) 표시
- 밟으면 2초간 속도 x1.5 + 무적 (소닉 부스트 느낌)
- 화면이 살짝 흔들리고 속도선 이펙트
- 스테이지 후반부에 1~2회 등장

---

#### [H] 난이도별 차이 (확장)

| 항목 | 아기(1) | 꼬마(2) | 씩씩(3) | 용감(4) | 전설(5) |
|------|---------|---------|---------|---------|---------|
| 하트 | 5 | 4 | 3 | 2 | 1 |
| 적 속도 | x0.7 | x0.85 | x1.0 | x1.2 | x1.5 |
| 적 출현비율 | 장5:적1 | 장4:적1 | 장3:적1 | 장2:적1 | 장1:적1 |
| 아이템 빈도 | 매우 많음 | 많음 | 보통 | 적음 | 매우 적음 |
| 하트아이템 | 자주 | 가끔 | 보통 | 드물게 | 매우 드물게 |
| 무적시간 | 7초 | 6초 | 5초 | 4초 | 3초 |
| 물음표블록 | 많음 | 보통 | 보통 | 적음 | 매우 적음 |
| 피격 무적시간 | 3초 | 2.5초 | 2초 | 1.5초 | 1초 |

---

#### [I] 점수 시스템 변경

| 행동 | 현재 점수 | 변경 후 |
|------|----------|---------|
| 장애물 넘기 | +1 | +1 (유지) |
| 적 밟기 처치 | 없음 | +2 |
| 적 슬라이드 처치 | 없음 | +2 |
| 별(코인) 수집 | 없음 | +1 |
| 물음표 블록 열기 | 없음 | +1 |

스테이지 목표는 기존과 동일 (장애물+적 넘긴/처치 수 기준).
별 수집은 보너스 점수 (목표와 별개).

---

#### [J] 파일 구조 변경 계획

만들 위치와 구조:

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/objects/Enemy.js | 적 캐릭터 클래스 + EnemyManager (행동패턴, 밟기판정) | 신규 |
| src/objects/Item.js | 수집 아이템 클래스 + ItemManager (별, 하트, 파워업) | 신규 |
| src/objects/Spring.js | 스프링 점프대 + 부스트 구간 | 신규 |
| src/objects/QuestionBlock.js | 물음표 블록 (치면 아이템 나옴) | 신규 |
| src/objects/EffectManager.js | 파티클/이펙트 통합 관리 (밟기 퍽!, 수집 반짝, 무적 등) | 신규 |
| src/objects/HeartHUD.js | 하트 표시 UI (화면 좌측 상단) | 신규 |
| src/objects/PowerUpHUD.js | 활성 파워업 표시 UI (화면 우측 상단) | 신규 |
| src/data/enemies.js | 월드별 적 데이터 (종류, 크기, 패턴, 속도) | 신규 |
| src/data/items.js | 아이템 데이터 (종류, 효과, 출현 확률) | 신규 |
| src/objects/Dino.js | 슬라이드 + 하트 + 무적 + 적밟기 바운스 추가 | 수정 |
| src/objects/Obstacle.js | 적/아이템과의 공존 (스폰 타이밍 조율) | 수정 |
| src/scenes/GameScene.js | 적/아이템/스프링/블록 생성 + 충돌 로직 전면 확장 | 수정 |
| src/scenes/BootScene.js | 적/아이템/스프링/블록 텍스처 생성 추가 | 수정 |
| src/config.js | 하트, 무적시간, 슬라이드 관련 상수 추가 | 수정 |
| src/data/difficulties.js | 하트/적속도/아이템빈도 등 확장 파라미터 추가 | 수정 |
| src/data/stages.js | 스테이지별 적/아이템/스프링 출현 규칙 추가 | 수정 |
| src/objects/StageHUD.js | 별 수집 카운트 표시 추가 | 수정 |
| src/utils/SoundGenerator.js | 적 처치, 아이템 수집, 피격, 스프링 효과음 추가 | 수정 |

기존 코드 연결:
- Enemy.js는 Obstacle.js와 같은 물리 그룹 패턴 (오브젝트 풀링)
- Item.js도 동일한 풀링 패턴 (spawn/cleanup)
- GameScene에서 dino vs enemies overlap, dino vs items overlap 추가
- BootScene에서 적/아이템 텍스처를 기존 장애물처럼 Graphics로 생성
- difficulties.js에 hearts/enemySpeed/itemFrequency 속성 추가

---

#### [K] 구현 순서 (4페이즈)

| 순서 | 페이즈 | 작업 내용 | 담당 | 예상 파일 |
|------|--------|----------|------|----------|
| 1 | P1: 하트 + 슬라이드 | 하트 시스템 + 슬라이드 액션 + HeartHUD + 피격 무적 | developer | Dino.js, GameScene.js, config.js, difficulties.js, HeartHUD.js, SoundGenerator.js |
| 2 | P1 테스트 | 빌드 + 동작 검증 | tester + reviewer (병렬) | - |
| 3 | P2: 적 + 밟기 | 적 캐릭터 12종 + 행동패턴 3종 + 밟기판정 + 처치연출 | developer | Enemy.js, enemies.js, BootScene.js, GameScene.js, EffectManager.js |
| 4 | P2 테스트 | 빌드 + 동작 검증 | tester + reviewer (병렬) | - |
| 5 | P3: 아이템 + 블록 | 별/하트/파워업 아이템 + 물음표 블록 + 자석/무적 효과 | developer | Item.js, items.js, QuestionBlock.js, PowerUpHUD.js, BootScene.js, GameScene.js |
| 6 | P3 테스트 | 빌드 + 동작 검증 | tester + reviewer (병렬) | - |
| 7 | P4: 스프링 + 밸런스 | 스프링/부스트 + stages.js 확장 + 전체 밸런스 조정 | developer | Spring.js, stages.js, StageHUD.js |

선행 조건:
- P1 완료 -> P2 시작 (하트가 있어야 적 피격이 의미 있음)
- P2 완료 -> P3 시작 (적이 있어야 아이템 밸런스 잡기 가능)
- P3 완료 -> P4 시작 (기본 시스템 완성 후 밸런스 + 추가 기믹)

---

#### [L] developer 주의사항

1. **밟기 판정이 핵심**: 적의 위 30%에 닿으면 공격, 나머지는 피격. Phaser overlap 콜백에서 공룡 y 위치와 적 y 위치를 비교하여 판정. 반드시 `dino.body.velocity.y > 0` (낙하 중)인지도 체크할 것.

2. **슬라이드 = 히트박스 변경**: 슬라이드 중에는 Dino의 물리 바디 높이를 절반으로 줄이고, 원래로 복원할 때 천장에 끼지 않도록 주의.

3. **오브젝트 풀링 유지**: 적, 아이템 모두 기존 Obstacle.js와 같은 pooling 패턴을 써야 함. create/getFirstDead 패턴.

4. **depth 규칙 엄수**: 배경(0-3) < 아이템(4) < 장애물(5) < 적(5) < 공룡(6) < 이펙트(7) < HUD(10)

5. **기존 장애물과 공존**: 적과 장애물이 동시에 나올 수 있음. 같은 타이밍에 겹치지 않도록 스폰 간격 조율 필요. GameScene의 스폰 로직을 통합 타이머로 관리.

6. **무적 상태 관리**: Dino에 `isInvincible` 플래그 추가. 피격 무적(2초), 파워업 무적(5초) 둘 다 이 플래그 사용. 무적 중 overlap 콜백에서 early return.

7. **Graphics 텍스처 생성**: 적과 아이템 모두 외부 이미지 없이 Phaser Graphics로 그릴 것. 기존 장애물 패턴 그대로 따라갈 것. 귀여운 느낌으로 (둥글둥글, 눈 달린).

## 테스트 결과 (tester)

### 버그 수정 (debugger)
| 버그 | 원인 | 수정 파일 | 수정 내용 |
|------|------|----------|----------|
| 공룡 바닥 아래 떨어짐 | body offsetY 불일치 (0.35 -> 0.4 필요) + setCollideWorldBounds 간섭 | Dino.js | offsetY 0.35->0.4 수정, setCollideWorldBounds(true) 제거 |
| 스테이지 클리어 안됨 | _onStageClear 중복 호출 + forEach 내 break 불가 | GameScene.js | _onStageClear에 가드 추가, forEach->for+break 변환, _onCollectItem에 가드 추가 |
| 2단 점프 안됨 | setCollideWorldBounds와 ground collider 간섭으로 blocked.down 불안정 | Dino.js | setCollideWorldBounds(true) 제거로 해결 (ground collider만 사용) |

### P4 스프링+부스트+밸런스 빌드/코드 검증 (2026-03-28)

| # | 테스트 항목 | 결과 | 비고 |
|---|-----------|------|------|
| 1 | npm run build | PASS | 33 modules, 673ms, chunk 1300KB |
| 2 | Spring.js: 텍스처 생성 | PASS | 40x35, 파란받침대+빨간코일(지그재그5단)+상단캡, generateTexture('spring') |
| 2a | Spring.js: Spring 클래스 | PASS | Arcade.Sprite 상속, allowGravity=false, immovable=true, depth=5, hitbox 30x15(윗부분) |
| 2b | Spring.js: setup() | PASS | 풀링 재활용, y-17 바닥맞춤, velocityX=-speed, isUsed=false |
| 2c | Spring.js: activate() | PASS | isUsed 중복방지, scaleY 0.4 압축+yoyo Bounce, 1초후 재사용가능 |
| 2d | Spring.js: deactivate() | PASS | 비활성화+velocity리셋+isUsed리셋 |
| 2e | SpringManager: 풀링 | PASS | physics.add.group maxSize=5, 미리5개 생성, spawn/cleanup(x<-60) |
| 3 | BoostPad.js: 텍스처 생성 | PASS | 60x15 납작패드, 주황배경+노랑상반+화살표4개+흰테두리, generateTexture('boostpad') |
| 3a | BoostPad.js: BoostPad 클래스 | PASS | allowGravity=false, immovable=true, depth=3, hitbox 55x12 |
| 3b | BoostPad.js: setup() | PASS | y-7 바닥맞춤, velocityX=-speed, isUsed=false |
| 3c | BoostPad.js: activate() | PASS | isUsed 중복방지, alpha 0.3+scaleX 1.2 트윈 300ms |
| 3d | BoostPad.js: deactivate() | PASS | 비활성화+velocity리셋+scale리셋 |
| 3e | BoostPadManager: 풀링 | PASS | maxSize=5, spawn/cleanup(x<-80) |
| 4 | config.js: SPRING 상수 | PASS | VELOCITY=-900, SPAWN_CHANCE=0.08 |
| 4a | config.js: BOOST 상수 | PASS | SPEED_MULTIPLIER=2.0, DURATION=2000, SPAWN_CHANCE=0.06 |
| 5 | stages.js: 30개 밸런스 속성 | PASS | 모든 스테이지에 enemyChance/itemChance/springChance/boostChance 4속성 존재 |
| 5a | stages.js: 월드1 격리 | PASS | 5개 스테이지 모두 enemyChance=0, springChance=0, boostChance=0 |
| 5b | stages.js: 점진적 상승 | PASS | 적:0->50%, 아이템:50->25%, 스프링:0->10%, 부스트:0->8% 확인 |
| 6 | GameScene.js: 매니저 생성 | PASS | SpringManager+BoostPadManager 생성, isBoosting/speedLines/boostTimer 초기화 |
| 6a | GameScene.js: 충돌 등록 | PASS | dino vs springManager.group->_onHitSpring, dino vs boostPadManager.group->_onHitBoostPad |
| 6b | GameScene.js: _onHitSpring | PASS | 하강중(velocity.y>0)에만 발동, SPRING.VELOCITY적용, 카메라흔들림, playSpring |
| 6c | GameScene.js: _onHitBoostPad | PASS | 바닥(blocked.down)에서만, pad.activate()+중복부스트방지, playBoost |
| 6d | GameScene.js: _startBoost | PASS | isBoosting=true, 무적, 속도x2, 주황틴트, 속도선, 노란플래시, 2초타이머 |
| 6e | GameScene.js: _endBoost | PASS | isBoosting=false, 무적해제(피격/파워업 무적 구분), 속도/2, 파워업별 색상복귀, 속도선제거 |
| 6f | GameScene.js: _showSpeedLines | PASS | Rectangle 6개, 랜덤위치, repeat:-1 트윈, depth=15 |
| 6g | GameScene.js: _hideSpeedLines | PASS | killTweensOf+destroy, 배열 초기화 |
| 6h | GameScene.js: 스폰 연동 | PASS | stageData.springChance||config 기본값, 스프링 성공시 별아치 배치, boostChance 동일패턴 |
| 6i | GameScene.js: cleanup 호출 | PASS | update에서 springManager.cleanup()+boostPadManager.cleanup() |
| 6j | GameScene.js: shutdown 정리 | PASS | isBoosting시 _endBoost, boostTimer.destroy, _hideSpeedLines |
| 7 | BootScene.js: 텍스처 로딩 | PASS | import 2개(createSpringTextures, createBoostPadTextures), 로딩단계에 합쳐서 호출 |
| 8 | SoundGenerator.js: playSpring | PASS | 200->800Hz 상승음 0.15s + 1000->1200Hz 띵 0.1s |
| 8a | SoundGenerator.js: playBoost | PASS | ctx null체크, 300->600Hz sawtooth 0.3s + 800->1000Hz sine 0.2s |
| 9 | import/export 정합성 | PASS | 빌드 33모듈 성공, 신규2파일 export + 수정5파일 import 모두 정상 |

### 종합

총 **33개** 항목 중 **33개 통과 / 0개 실패**

빌드 성공. P4(스프링+부스트+밸런스) 7파일 모두 코드상 정상.
- Spring.js: 텍스처(코일+받침대) + Spring(밟기압축+재사용) + SpringManager(풀링5개)
- BoostPad.js: 텍스처(화살표패드) + BoostPad(밟기+투명화) + BoostPadManager(풀링5개)
- config.js: SPRING(VELOCITY:-900, 8%) + BOOST(2배속, 2초, 6%)
- stages.js: 30개 스테이지 4속성 밸런스 (월드1 격리, 점진적 상승)
- GameScene.js: 충돌2건 + 부스트모드(속도2배+무적+속도선) + 무적해제 분기 + shutdown정리
- BootScene.js/SoundGenerator.js: 텍스처로딩+효과음 2개 정상 추가
