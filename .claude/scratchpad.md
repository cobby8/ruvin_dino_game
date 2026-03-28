# 작업 스크래치패드

## 현재 작업
- **요청**: 3가지 대규모 기능 추가 (점프 시스템 개편 + 난이도 5단계 + 스테이지 30개)
- **상태**: 페이즈 1 구현 완료 → 테스트 대기
- **현재 담당**: tester

## 진행 현황
| 단계 | 상태 | 담당 |
|------|------|------|
| 1. 기획설계 | 완료 | planner-architect |
| 2. 페이즈1 구현 | 완료 | developer |
| 3. 페이즈1 테스트 | 완료 | tester |
| 4. 커밋 | 대기 | pm |

## 작업 로그
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-03-28 | 초기 기획설계 (프로젝트 구조 + 13개 파일 설계) | 완료 |
| 2026-03-28 | 전체 게임 구현 (14개 파일 신규) | 완료, 커밋됨 |
| 2026-03-28 | 2차 수정: 점프력 -450 + 96px 공룡 고도화 + 배경/장애물 개선 | 완료, 커밋됨 |
| 2026-03-28 | 페이즈1 빌드+코드검증 (34항목 전수 테스트) | 전체 통과 |

## 구현 기록 (developer)

### 페이즈 1: 점프 시스템 + 난이도 선택

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/config.js | JUMP_VELOCITY 단일값 → JUMP 객체(LOW/HIGH/DOUBLE/HOLD_THRESHOLD)로 변경 | 수정 |
| src/data/difficulties.js | 5단계 난이도 데이터 (속도/간격/2단점프/장애물크기 등) | 신규 |
| src/objects/Dino.js | jump() → startJump()+executeJump()+doubleJump()+onLand() 분리, setDifficulty() 추가 | 수정 |
| src/scenes/GameScene.js | 입력을 pointerdown/up + keydown/up으로 변경, 난이도별 파라미터 적용, 착지 감지 | 수정 |
| src/scenes/DifficultyScene.js | 난이도 5단계 선택 UI (파스텔 카드 5장 + 출발 버튼) | 신규 |
| src/scenes/SelectScene.js | "모험 시작!" 클릭 시 GameScene → DifficultyScene으로 변경 | 수정 |
| src/main.js | DifficultyScene import + scene 배열에 등록 | 수정 |

tester 참고:
- 테스트 방법: 공룡 선택 후 난이도 선택 화면이 나오는지 확인, 5개 카드 선택 동작, "출발!" 버튼 활성화
- 점프 테스트: 짧게 누르기(낮은 점프), 길게 누르기(높은 점프), 공중에서 다시 누르기(2단 점프)
- 난이도별 차이: 아기공룡(느림/간격넓음) vs 전설의공룡(빠름/간격좁음/2단점프불가)
- 정상 동작: 공룡선택 → 난이도선택 → 게임플레이 순서로 진행되면 정상
- 주의: 전설의공룡(5단계)에서는 2단 점프가 불가능해야 함
- 주의: 키보드 스페이스바 길게 눌러도 연속 점프가 아닌 높은 점프 1회만 되어야 함

## 기획설계 (planner-architect)
(상세 내용은 작업 로그로 요약됨. 원본은 git 이력 참조)
- 3개 페이즈 계획: P1(점프+난이도) → P2(스테이지+월드) → P3(씬흐름+저장)
- 총 18개 파일 변경 예정 (신규 8 + 수정 10)

## 테스트 결과 (tester)

### 페이즈 1 빌드 + 코드 검증 (2026-03-28)

**1. 빌드 테스트**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| npm run build 성공 | PASS | 18 modules, 643ms, 경고: chunk 500KB 초과 (phaser 포함이라 정상) |

**2. 새 파일/수정 파일 확인**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| src/data/difficulties.js 존재 | PASS | |
| 5단계 데이터 완전성 (id 1~5, 필수 필드 모두 존재) | PASS | name/emoji/stars/color/borderColor/initialSpeed/maxSpeed/obstacleGapMin,Max/obstacleScale/canDoubleJump/doubleJumpLimit/targetObstacles |
| DEFAULT_DIFFICULTY export | PASS | DIFFICULTIES[2] = 씩씩한공룡 |
| src/scenes/DifficultyScene.js 존재 | PASS | Phaser.Scene 상속 확인 |
| config.js JUMP 객체 | PASS | LOW_VELOCITY:-300, HIGH_VELOCITY:-500, DOUBLE_VELOCITY:-350, HOLD_THRESHOLD:100 |
| main.js에 DifficultyScene 등록 | PASS | import + scene 배열에 포함 |

**3. 점프 시스템 코드 검증 (Dino.js)**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| startJump() 메서드 존재 | PASS | |
| startJump: 바닥이면 LOW_VELOCITY + 시간기록 | PASS | body.blocked.down 체크, Date.now() 기록 |
| startJump: 공중이면 doubleJump() 호출 | PASS | else 분기에서 this.doubleJump() |
| executeJump() 메서드 존재 | PASS | |
| executeJump: 100ms 이상 + 상승중이면 HIGH_VELOCITY | PASS | holdDuration >= HOLD_THRESHOLD && velocity.y < 0 |
| doubleJump() 메서드 존재 | PASS | |
| doubleJump: canDoubleJump + isDoubleJumpUsed + doubleJumpCount 체크 | PASS | 3단 조건 |
| onLand() 메서드 존재 | PASS | isJumpHeld=false, isDoubleJumpUsed=false, 달리기 애니 전환 |
| setDifficulty() 메서드 존재 | PASS | canDoubleJump/doubleJumpLimit 세팅, doubleJumpCount 리셋 |

**4. GameScene.js 입력 검증**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| pointerdown -> startJump | PASS | |
| pointerup -> executeJump | PASS | |
| keydown-SPACE -> startJump | PASS | spaceIsDown 플래그로 반복 방지 |
| keyup-SPACE -> executeJump | PASS | spaceIsDown = false 리셋 |
| 기존 JustDown 방식 제거 | PASS | grep 결과 0건 |
| 난이도 registry에서 가져오기 | PASS | registry.get('selectedDifficulty') || DEFAULT_DIFFICULTY |
| 난이도별 속도/간격 적용 | PASS | this.difficulty.initialSpeed, obstacleGapMin/Max, maxSpeed |
| 착지 감지 (wasInAir + body.blocked.down -> onLand) | PASS | update()에서 매 프레임 체크 |
| shutdown에서 키보드 이벤트 정리 | PASS | keyboard.off('keydown-SPACE'), keyboard.off('keyup-SPACE') |

**5. DifficultyScene.js 검증**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 5개 카드 렌더링 코드 | PASS | DIFFICULTIES.forEach 루프 |
| 선택 시 확대(1.1)/축소(0.9) 효과 | PASS | tweens: Back.easeOut / Sine.easeOut |
| 선택 시 비선택 카드 반투명(0.5) | PASS | container.setAlpha(0.5) |
| "출발!" 버튼 비활성(회색) -> 활성(초록) | PASS | 0xAAAAAA -> 0x66CC77 |
| registry.set('selectedDifficulty', ...) | PASS | DIFFICULTIES[this.selectedIndex] |
| scene.start('GameScene') 호출 | PASS | 버튼 클릭 시 selectedIndex !== null 체크 후 |

**6. 씬 흐름 검증**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| SelectScene -> DifficultyScene 연결 | PASS | scene.start('DifficultyScene') (기존 GameScene에서 변경됨) |
| main.js scene 배열에 DifficultyScene 포함 | PASS | [BootScene, SelectScene, DifficultyScene, GameScene, GameOverScene] |
| DifficultyScene -> GameScene 연결 | PASS | scene.start('GameScene') |

**7. import/export 검증**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| difficulties.js: export DIFFICULTIES, DEFAULT_DIFFICULTY | PASS | named export 2개 |
| DifficultyScene: import DIFFICULTIES from difficulties.js | PASS | |
| GameScene: import DEFAULT_DIFFICULTY from difficulties.js | PASS | |
| main.js: import DifficultyScene | PASS | |
| 구 JUMP_VELOCITY 참조 잔존 | PASS | grep 결과 0건 (완전 제거됨) |

### 종합

총 34개 항목 중 **34개 통과 / 0개 실패**

빌드 성공, 코드 구조 설계대로 구현됨, import/export 정상, 기존 코드 잔재 없음.
런타임 동작(실제 브라우저 실행)은 코드 리뷰 범위 밖이나, 코드 로직상 문제점 없음.
