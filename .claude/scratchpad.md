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
| 2026-03-28 | 페이즈2 구현: 6월드+30스테이지+18종장애물+HUD (8파일) | 빌드 통과 |
| 2026-03-28 | 페이즈2 빌드+코드검증 (62항목 전수 테스트) | 전체 통과 |

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

### 페이즈 2: 스테이지 + 월드 테마

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/data/worlds.js | 6개 월드 데이터 (하늘/바닥/산/장애물/장식 색상) + getWorld() 헬퍼 | 신규 |
| src/data/stages.js | 30개 스테이지 데이터 (목표/속도보너스) + 난이도배율 + getStageTarget()/getStage() 헬퍼 | 신규 |
| src/objects/Background.js | createAllBackgroundTextures()로 6월드x4레이어=24개 텍스처 생성, Background.setWorld() 메서드 추가 | 수정 |
| src/objects/Obstacle.js | createAllObstacleTextures()로 18종 장애물 텍스처 생성(크기 1.5~2배 확대), ObstacleManager.setWorld() 메서드 추가 | 수정 |
| src/scenes/BootScene.js | 진행 바 + 단계별 텍스처 로딩 (공룡→장애물→배경 순서) | 수정 |
| src/objects/StageHUD.js | 월드이름+스테이지번호, 점수/목표, 난이도별, 프로그레스 바 표시 | 신규 |
| src/scenes/GameScene.js | 스테이지/월드 데이터 로드, 월드별 배경+장애물 적용, 목표달성시 클리어 전환 | 수정 |
| src/scenes/GameOverScene.js | 클리어/실패 분기 화면, "다음 스테이지" 버튼 추가 | 수정 |

tester 참고:
- 테스트 방법: 게임 시작 시 스테이지 1-1(풀밭 나라 "첫걸음")이 표시되는지 확인
- 정상 동작: 상단 HUD에 "풀밭 나라 1-1", "0 / N" (N=난이도별 목표), 프로그레스 바 표시
- 장애물 넘길 때마다 점수 올라가고, 목표 달성 시 "클리어!" → "다음 스테이지" 버튼 표시
- "다음 스테이지" 누르면 1-2로 넘어감
- 월드 5스테이지 클리어 시 다음 월드(배경/장애물 테마 변경)로 넘어가는지 확인
- 실패(장애물 충돌) 시 기존 게임오버 화면 + 스테이지 정보 표시
- 난이도별 목표 차이: 아기공룡은 목표가 절반(x0.5), 전설은 1.5배
- 주의: 로딩 화면에 진행 바가 나오는지 확인 (텍스처 24+18개로 많아짐)
- 주의: 월드 2(사막)~6(하늘) 배경/장애물이 각각 다른 테마인지 확인

reviewer 참고:
- Background.js의 하위호환: createBackgroundTextures()가 내부에서 createAllBackgroundTextures()를 호출
- Obstacle.js의 하위호환: createObstacleTextures()가 내부에서 createAllObstacleTextures()를 호출
- GameOverScene.js가 클리어/실패 분기를 모두 처리 (임시 - 나중에 StageClearScene으로 분리 예정)

## 기획설계 (planner-architect)
(상세 내용은 작업 로그로 요약됨. 원본은 git 이력 참조)
- 3개 페이즈 계획: P1(점프+난이도) → P2(스테이지+월드) → P3(씬흐름+저장)
- 총 18개 파일 변경 예정 (신규 8 + 수정 10)

## 테스트 결과 (tester)

### 페이즈 2 빌드 + 코드 검증 (2026-03-28)

**1. 빌드 테스트**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| npm run build 성공 | PASS | 21 modules, 641ms, 경고: chunk 1248KB (phaser 포함이라 정상) |

**2. 신규 파일 확인**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| src/data/worlds.js 존재 | PASS | |
| 6개 월드 데이터 완전성 | PASS | id 1~6, name/emoji/skyTop/skyBottom/groundColor/groundDarkColor/mountainColors/cloudColor/obstacles/decorations 모두 존재 |
| WORLDS export + getWorld() 헬퍼 | PASS | named export + function export |
| src/data/stages.js 존재 | PASS | |
| 30개 스테이지 (id 1~30 빠짐없음) | PASS | id 순서대로 1~30 연속 |
| 월드별 5개씩 배분 | PASS | w1=1~5, w2=6~10, w3=11~15, w4=16~20, w5=21~25, w6=26~30 |
| DIFFICULTY_TARGET_MULTIPLIER (5단계) | PASS | 1:0.5, 2:0.7, 3:1.0, 4:1.3, 5:1.5 |
| getStageTarget() + getStage() 헬퍼 | PASS | Math.ceil 올림 처리 확인 |
| src/objects/StageHUD.js 존재 | PASS | |
| StageHUD.create: 월드이름+스테이지번호 | PASS | stageInWorld 계산: ((id-1)%5)+1 |
| StageHUD.create: 점수/목표 텍스트 | PASS | "0 / {targetScore}" 형식 |
| StageHUD.create: 난이도 별 표시 | PASS | difficulty.stars 만큼 반복 |
| StageHUD.create: 프로그레스 바 | PASS | barBg(반투명) + barFill(초록/금색) |
| StageHUD.updateScore() 메서드 | PASS | 텍스트+바 갱신 + 바운스 효과 |
| StageHUD.showClear() 메서드 | PASS | 금색 텍스트 + "클리어!" + 확대 효과 |

**3. 수정 파일 핵심 검증**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Background.js: createAllBackgroundTextures() | PASS | WORLDS.forEach로 6월드 x 4레이어 = 24텍스처 |
| Background.js: 월드별 하늘 그라디언트 | PASS | _createSkyTexture (20단계 보간) |
| Background.js: 월드별 구름/원경 특색 | PASS | wid 1~6 분기 각각 고유 디자인 |
| Background.js: 월드별 산 레이어 | PASS | 뒷산+앞산 + w4 용암빛/w5 파도 추가 디테일 |
| Background.js: 월드별 바닥 장식 | PASS | w1풀꽃/w2모래/w3낙엽/w4용암균열/w5파도/w6구름별 |
| Background.js: setWorld() 메서드 | PASS | 4개 tileSprite 텍스처 교체, 동일ID 조기반환 |
| Background.js: 하위호환 createBackgroundTextures() | PASS | createAllBackgroundTextures() 호출 |
| Obstacle.js: createAllObstacleTextures() | PASS | _createWorld1~6Obstacles() 6개 함수 호출 |
| Obstacle.js: 18종 텍스처 키 생성 | PASS | w1~w6 각 3개, generateTexture 확인 |
| Obstacle.js: ObstacleManager.setWorld() | PASS | world.obstacles 배열로 키 목록 교체 |
| Obstacle.js: OBSTACLE_Y_OFFSETS 18종 | PASS | 18개 키 모두 정의됨 |
| Obstacle.js: 하위호환 createObstacleTextures() | PASS | createAllObstacleTextures() 호출 |
| BootScene.js: 진행 바 표시 | PASS | barBg(회색) + barFill(초록) + 3단계 순차 로딩 |
| BootScene.js: 공룡->장애물->배경 순서 | PASS | steps 배열 3단계 + delayedCall(50) 프레임 쉬기 |
| BootScene.js: createAllObstacleTextures import | PASS | |
| BootScene.js: createAllBackgroundTextures import | PASS | |
| GameScene.js: 스테이지/월드 데이터 로드 | PASS | registry.get('currentStage')||1, getStage(), getWorld() |
| GameScene.js: 목표점수 계산 | PASS | getStageTarget(stageId, difficultyId) |
| GameScene.js: 월드별 배경 적용 | PASS | new Background(this, groundY, worldData.id) |
| GameScene.js: 월드별 장애물 적용 | PASS | new ObstacleManager(this, worldData.id) |
| GameScene.js: StageHUD 생성 | PASS | new StageHUD(this, stageData, worldData, difficulty, targetScore) |
| GameScene.js: 점수+1 시 HUD 업데이트 | PASS | stageHUD.updateScore(score) |
| GameScene.js: 목표달성 시 _onStageClear() | PASS | score >= targetScore 분기 |
| GameScene.js: 클리어 처리 (물리정지+플래시+registry) | PASS | isStageClear=true, physics.pause(), flash(금색) |
| GameScene.js: 다음스테이지 ID 계산 | PASS | stageData.id + 1, isLastStage = nextStageId > 30 |
| GameScene.js: GameOverScene에 클리어/실패 데이터 전달 | PASS | stageClear, stageData, worldData, isLastStage, nextStageId |
| GameScene.js: isStageClear로 입력 차단 | PASS | pointerdown/up + keydown/up 모두 isStageClear 체크 |
| GameScene.js: update()에서 isStageClear 조기반환 | PASS | if (isGameOver || isStageClear) return |
| GameScene.js: 시작속도 = 난이도 + 스테이지보너스 | PASS | difficulty.initialSpeed + stageData.speedBonus |
| GameOverScene.js: init()에서 클리어/실패 데이터 수신 | PASS | stageClear, stageData, worldData, isLastStage, nextStageId |
| GameOverScene.js: 클리어 화면 분기 | PASS | if(stageClear) _createClearScreen else _createGameOverScreen |
| GameOverScene.js: "스테이지 클리어!" 타이틀 + 효과 | PASS | 반짝임 tween 확인 |
| GameOverScene.js: 월드+스테이지명 표시 | PASS | stageInWorld 계산 + emoji + name |
| GameOverScene.js: "다음 스테이지" 버튼 | PASS | nextStageId registry 설정 + scene.start('GameScene') |
| GameOverScene.js: 마지막 스테이지 "모든 모험 완료" | PASS | isLastStage 분기 |
| GameOverScene.js: 실패 시 스테이지 정보 표시 | PASS | stageData && worldData 조건부 표시 |
| GameOverScene.js: 실패 시 "다시하기"+"공룡바꾸기" 버튼 | PASS | 기존과 동일 |

**4. 데이터 무결성**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| stages.js: id 1~30 연속 | PASS | 빠진 id 없음 |
| stages.js: 월드 1 = id 1~5 | PASS | world:1 x 5개 |
| stages.js: 월드 2 = id 6~10 | PASS | world:2 x 5개 |
| stages.js: 월드 3 = id 11~15 | PASS | world:3 x 5개 |
| stages.js: 월드 4 = id 16~20 | PASS | world:4 x 5개 |
| stages.js: 월드 5 = id 21~25 | PASS | world:5 x 5개 |
| stages.js: 월드 6 = id 26~30 | PASS | world:6 x 5개 |
| stages.js: speedBonus 패턴 (0/5/10/15/20) | PASS | 모든 월드 동일 패턴 |
| stages.js: target 점진적 증가 | PASS | w1:5~9, w2:7~11, w3:8~12, w4:9~13, w5:10~14, w6:11~15 |
| worlds.js: 6개 월드 모두 obstacles 3개씩 | PASS | 각 배열 length=3 |
| 텍스처 키 일치 (worlds.js <-> Obstacle.js) | PASS | 18개 키 모두 generateTexture + obstacles 배열 일치 |
| 텍스처 키 일치 (Background.js 키 패턴) | PASS | bg_sky_w{1~6}, bg_cloud_w{1~6}, bg_mountain_w{1~6}, bg_grass_w{1~6} |

**5. import/export 검증**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| worlds.js: export WORLDS + getWorld | PASS | named export |
| stages.js: export STAGES + DIFFICULTY_TARGET_MULTIPLIER + getStageTarget + getStage | PASS | named export 4개 |
| StageHUD.js: export class StageHUD | PASS | named export |
| GameScene.js: import getStage, getStageTarget from stages | PASS | |
| GameScene.js: import getWorld from worlds | PASS | |
| GameScene.js: import StageHUD from StageHUD | PASS | |
| BootScene.js: import createAllObstacleTextures from Obstacle | PASS | |
| BootScene.js: import createAllBackgroundTextures from Background | PASS | |
| Background.js: import WORLDS from worlds | PASS | |
| Obstacle.js: import WORLDS from worlds | PASS | |

**6. 장애물 크기 확대 확인**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| w1: 작은선인장 30x45 | PASS | 기존 20x30 대비 1.5배 |
| w1: 큰선인장 45x68 | PASS | 기존 30x45 대비 1.5배 |
| w1: 돌멩이 38x30 | PASS | 신규 (넓적한 형태) |
| w2: 사막선인장 35x55 | PASS | 1.5~2배 범위 |
| w2: 해골 40x40 | PASS | 신규 |
| w2: 모래언덕 50x30 | PASS | 신규 (넓적한 형태) |
| w3~w6: 12종 모두 크기 확인 | PASS | 25x60 ~ 50x35 범위, 모두 기존 대비 1.5~2배 |

### 종합

총 **62개** 항목 중 **62개 통과 / 0개 실패**

빌드 성공, 6개 월드 + 30개 스테이지 + 18종 장애물 데이터 완전, import/export 정상, 클리어/실패 분기 정상, HUD 구현 완전.
코드 로직상 문제점 없음.
