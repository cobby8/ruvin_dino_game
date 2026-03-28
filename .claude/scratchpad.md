# 작업 스크래치패드

## 현재 작업
- **요청**: 배경 스크롤링 시스템 (패럴랙스 효과로 달리는 느낌 주기)
- **상태**: 기획설계 완료
- **현재 담당**: planner-architect -> pm

## 진행 현황
| 단계 | 상태 | 담당 |
|------|------|------|
| 1. 배경 스크롤링 기획설계 | 완료 | planner-architect |
| 2. Background.js 수정 구현 | 대기 | developer |
| 3. 빌드 테스트 | 대기 | tester |

## 작업 로그
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-03-28 | 액션 시스템 P1~P4 구현 (하트+슬라이드+적9종+아이템5종+스프링+부스트) | 전체 통과 |
| 2026-03-28 | 종합 개선+페이즈1~4 구현 (콤보+파티클+공룡능력+업적+상점) | 빌드 통과 |
| 2026-03-28 | AI 이미지 적용 + 오브젝트 스케일 조정 (PNG 전체 적용, 3배→1.5배) | 빌드 통과 |
| 2026-03-28 | 점프 밸런스 분석 + 개선 (obstacleScale+독수리높이+2단점프+히트박스) | 빌드 통과 |
| 2026-03-28 | 4가지 개선사항 전체 기획설계 (점프분리+HUD+정지+메뉴) | 설계 완료 |
| 2026-03-28 | 페이즈1: 점프 버튼 분리 (좌우터치+Z/X키+가이드HUD+튜토리얼갱신) | 빌드 통과 |
| 2026-03-28 | 페이즈4: 메뉴 고도화 (Select미리보기+Difficulty성장단계+WorldMap좌우스와이프) | 빌드 통과 |
| 2026-03-28 | 배경 스크롤링 기획설계 (AI이미지 tileSprite 교체 + 패럴랙스) | 설계 완료 |

## 구현 기록 (developer)

### 점프 단순화 + 프테라노 비행 구현 (2026-03-28)

구현한 기능: 점프를 극단 단순화(높은/낮은 구분 제거) + 프테라노 비행 능력(점프 정점에서 3초 체공)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/objects/JumpGuideHUD.js | 버튼 2개 제거, 5초 안내 텍스트로 완전 재작성 | 수정 |
| src/scenes/GameScene.js | _setupInput: 버튼판정+좌우분할 제거, 아무곳터치=점프. _isPointerDown 추가. Z/X/SPACE 모두 동일 점프. update에 isHoldingJump 전달 | 수정 |
| src/objects/Dino.js | startJump: isHigh 무시, 항상 LOW_VELOCITY. 비행속성 추가(isFlying/flyTimer/flyDuration). update: glide로직 제거→비행로직. startFly/endFly 메서드 추가. onLand/fall에 비행종료 | 수정 |

tester 참고:
- 테스트 방법: 화면 아무 곳 터치하면 점프되는지 확인 (좌우 구분 없이)
- 공중에서 한 번 더 터치하면 2단 점프 되는지 확인
- SPACE/Z/X 키 모두 동일하게 점프하는지 확인
- 프테라노 선택 후 점프 → 정점에서 터치 유지 → 3초간 떠있는지 확인
- 프테라노 비행 중 손을 떼면 바로 하강하는지 확인
- 프테라노 비행 중 추가 점프가 안 되는지 확인
- 게임 시작 시 "화면을 터치하면 점프!" 안내가 5초 후 사라지는지 확인

reviewer 참고:
- HIGH_VELOCITY를 사용하는 곳이 완전히 없어져서 높은 장애물 넘기가 어려울 수 있음 (2단 점프로 대체)
- 프테라노 비행 velocity.y 임계값 50이 적절한지 실플레이 확인 필요

### 히트박스 축소 + 적 크기 확대 (2026-03-28)

📝 구현한 기능: 모든 오브젝트 히트박스를 더 관대하게 축소 + 적 이미지를 장애물 수준으로 확대

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/objects/Obstacle.js | 히트박스 0.65x0.75 -> 0.45x0.55, offset 0.6 -> 0.7 | 수정 |
| src/objects/Enemy.js | 이미지 스케일 0.12 고정, Graphics 1.5->2.5배, 히트박스 0.6->0.4 | 수정 |
| src/objects/Dino.js | constructor 히트박스 0.55x0.65->0.4x0.5, 슬라이드 0.6x0.3->0.45x0.25, endSlide 동일 | 수정 |

💡 tester 참고:
- 테스트 방법: 게임 실행 후 장애물/적에 가까이 스쳐 지나가도 안 맞는지 확인
- 정상 동작: 그래픽의 가장자리에 닿아도 피격 안 됨 (중심부만 판정)
- 적 크기가 장애물과 비슷한 수준으로 커졌는지 확인
- 슬라이드 시에도 히트박스가 더 작아졌는지 확인

⚠️ reviewer 참고:
- 히트박스가 너무 작으면 밟기 판정도 어려워질 수 있음 (적 위에서 밟는 것)
- 적 0.12 스케일이 실제 화면에서 적절한지 시각적 확인 필요

### 배경 스크롤링 시스템 구현 (2026-03-28)

📝 구현한 기능: AI 배경 이미지를 tileSprite로 교체하여 게임 속도에 비례하는 무한 스크롤 적용

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/objects/Background.js | _setupBgImage: add.image() -> add.tileSprite() 교체 | 수정 |
| src/objects/Background.js | update(): bgImage.tilePositionX 스크롤 추가 (speed * 0.15) | 수정 |
| src/objects/Background.js | setWorld(): tileSprite 텍스처 교체 + tilePositionX 리셋 | 수정 |
| src/objects/Background.js | resize(): setPosition+setDisplaySize -> width/height 직접 변경 | 수정 |

💡 tester 참고:
- 테스트 방법: 게임을 실행하고 배경이 왼쪽으로 천천히 흘러가는지 확인
- 정상 동작: 공룡이 달릴 때 AI 배경 이미지가 게임 속도의 15%로 느리게 스크롤됨
- 월드 전환 시 새 배경이 처음부터 스크롤 시작되는지 확인
- 화면 리사이즈 시 배경이 정상적으로 채워지는지 확인

⚠️ reviewer 참고:
- tileSprite 이음새: AI 생성 이미지라 좌우 끝이 매끄럽지 않을 수 있으나, 0.15배속이라 눈에 잘 안 띔
- GameScene.js는 수정 불필요 (이미 background.update(speed, delta) 호출 중)

## 기획설계 (planner-architect)

### 배경 스크롤링 시스템 설계 (2026-03-28)

**목표: 배경이 왼쪽으로 흘러가서 공룡이 달리는 느낌을 주기**

**비유: 자동차 타고 달릴 때 창밖 풍경**
자동차를 타고 고속도로를 달리면, 먼 산은 거의 안 움직이는 것처럼 보이고,
길가 가로수는 쌩쌩 지나가잖아요? 이것이 "패럴랙스(시차) 효과"입니다.
지금 게임은 자동차 안에서 창문 사진을 벽에 붙여놓은 것처럼 배경이 꼼짝도 안 해요.

---

**현재 문제 분석:**

| 상황 | 현재 동작 | 문제 |
|------|----------|------|
| AI 이미지 있는 월드 (6개 전부) | `add.image()`로 고정 배치 | 배경이 1px도 안 움직임 |
| 코드 생성 배경 (AI 없을 때 대비) | `tileSprite`로 패럴랙스 스크롤 | 정상 동작하지만 AI 있으면 숨겨짐 |
| update() 호출 시 | `background.update(speed, delta)` | AI 이미지에는 아무 효과 없음 |

**핵심 원인:** AI 배경 이미지가 `scene.add.image()`(일반 이미지)로 만들어져서 스크롤이 안 됨.
`tileSprite`(타일 반복 이미지)로 바꿔야 무한 스크롤이 가능함.

---

**설계안: AI 배경을 tileSprite로 교체 + 패럴랙스 적용**

```
[레이어 구조 - 뒤에서 앞으로]
┌──────────────────────────────────────┐
│ depth -1: AI 배경 이미지 (tileSprite) │ <-- 가장 느리게 (0.15배속)
│ depth  0: 하늘 그라디언트             │ <-- AI 있으면 숨김
│ depth  1: 구름/원경                  │ <-- AI 있으면 숨김
│ depth  2: 산                        │ <-- AI 있으면 숨김
│ depth  3: 바닥                      │ <-- AI 있으면 숨김
│ depth  5: 장애물/적                  │
│ depth  6: 공룡                      │
│ depth 10+: HUD                     │
└──────────────────────────────────────┘
```

**방법: add.image() -> add.tileSprite() 교체**

tileSprite는 "벽지처럼 같은 이미지를 옆으로 계속 이어붙여주는" Phaser 기능입니다.
매 프레임 `tilePositionX`를 조금씩 늘리면 배경이 왼쪽으로 흘러가는 효과가 생깁니다.

- AI 배경 이미지를 `tileSprite`로 교체
- `update()`에서 `bgImage.tilePositionX += speed * 0.15 * dt`
- 속도 0.15배 = 먼 배경이므로 아주 천천히 움직임 (게임 속도의 15%)
- 이미지가 가로로 반복되면서 무한 스크롤 효과

**이미지 반복 이음새 문제 대응:**
- 현재 배경 이미지(world1~6.jpg)는 AI 생성이라 좌우 끝이 매끄럽게 이어지지 않을 수 있음
- 해결 방법 1: 스크롤 속도를 매우 느리게 (0.15배) -> 이음새가 잘 안 보임
- 해결 방법 2: 이미지 가로 크기가 화면보다 크면 이음새가 화면 밖에서 발생
- 최악의 경우에도 "고정 배경"보다는 훨씬 나은 체험

---

**수정할 파일:**

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/objects/Background.js | _setupBgImage를 tileSprite로 교체 + update에 bgImage 스크롤 추가 + setWorld에서도 tileSprite 교체 | 수정 |

**수정 범위: Background.js 1개 파일만 수정 (매우 작은 작업)**

---

**구체적 변경 내용:**

1. `_setupBgImage()` 메서드 (396~405행):
   - `scene.add.image()` -> `scene.add.tileSprite(0, 0, width, height, imgKey)`
   - `setOrigin(0, 0)` 설정 (tileSprite는 원점 기준이 다름)
   - `setDisplaySize` 대신 tileSprite 크기 직접 지정

2. `update()` 메서드 (457~471행):
   - AI 배경 이미지가 있으면 `this.bgImage.tilePositionX += speed * 0.15 * dt` 추가
   - 기존 패럴랙스 레이어는 그대로 유지 (AI 없을 때 사용)

3. `setWorld()` 메서드 (411~449행):
   - 월드 교체 시 기존 bgImage를 destroy하고 새로 tileSprite 생성
   - 또는 setTexture()로 텍스처만 교체 (tileSprite도 setTexture 가능)

4. `resize()` 메서드 (476~492행):
   - bgImage가 tileSprite일 때 width/height 재설정 방식 변경

---

**실행 계획:**

| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|----------|
| 1 | Background.js 수정 (image->tileSprite + update 스크롤) | developer | 없음 |
| 2 | 빌드 테스트 (vite build) | tester | 1 |

**developer 주의사항:**
- `add.tileSprite(x, y, width, height, textureKey)` 형식. add.image와 파라미터가 다름
- tileSprite는 `setOrigin(0, 0)`을 해야 좌상단 기준 배치됨 (기본은 0.5, 0.5)
- `setDisplaySize()` 대신 생성자에서 width, height를 직접 지정
- `tilePositionX`를 증가시키면 이미지가 왼쪽으로 흘러감 (양수 = 왼쪽 스크롤)
- bgImage.tilePositionX 스크롤은 기존 sky/clouds/mountains/grass 스크롤과 동일한 패턴
- resize() 시 tileSprite는 `bgImage.width = newWidth; bgImage.height = newHeight` 로 조정
- setWorld() 시 tileSprite의 setTexture()는 동작하지만 tilePositionX는 리셋해줘야 자연스러움
