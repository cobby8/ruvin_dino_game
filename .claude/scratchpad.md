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
| 2026-03-28 | 페이즈3 구현: 씬흐름+저장 (3신규+5수정, 8파일) | 빌드 통과 |
| 2026-03-28 | 페이즈3 빌드+코드검증 (78항목 전수 테스트) | 전체 통과 |

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

### 페이즈 3: 씬 흐름 완성 + 진행 저장

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/scenes/StageClearScene.js | 별 1~3개 연출 + 축하 화면 + 진행도 localStorage 저장 + 다음/월드맵 버튼 | 신규 |
| src/scenes/WorldMapScene.js | 6월드x5스테이지 맵 + 잠금/해제 + 진행도 불러오기 + 공룡/난이도 변경 | 신규 |
| src/scenes/EndingScene.js | 전체 클리어 엔딩 + 4공룡 등장 + 반짝이 + 처음부터/자유모드 버튼 | 신규 |
| src/scenes/GameOverScene.js | 클리어 분기 제거, 실패 전용으로 변경 + "월드맵" 버튼 추가 | 수정(전면) |
| src/scenes/GameScene.js | StageClearScene 전환 + deathCount 추가 + 자유모드(스테이지0) 지원 | 수정 |
| src/scenes/DifficultyScene.js | "출발!" → 진행도 있으면 WorldMap, 없으면 스테이지1 + _loadProgress() | 수정 |
| src/main.js | StageClearScene/WorldMapScene/EndingScene 등록 (8씬) | 수정 |
| src/utils/SoundGenerator.js | playStageClear() 팡파레 + playEnding() 축하 멜로디 추가 | 수정 |

tester 참고:
- 전체 플로우: Boot → Select → Difficulty → (WorldMap 또는 Game) → Game → StageClear → Game → ... → Ending
- 첫 플레이(진행도 없음): 난이도 선택 후 스테이지 1로 바로 시작
- 이어하기(진행도 있음): 난이도 선택 후 월드맵으로 이동
- localStorage 키 'ruvin_dino_progress': clearedStages 배열 + bestStars 객체
- 별 기준: 1개=기본클리어, 2개=목표x1.2이상, 3개=deathCount===0
- 월드 마지막 스테이지(5,10,15,20,25,30) 클리어 시 "새로운 나라가 열렸어!" 메시지
- 스테이지 30 클리어 시 EndingScene 이동
- "자유 모드"(EndingScene에서 선택) = 스테이지 0으로 무한 러너
- GameOverScene은 실패만 처리 (클리어는 StageClearScene)
- 잠금 해제: 이전 스테이지 클리어 → 다음 열림, 스테이지 1은 항상 열림

reviewer 참고:
- GameScene.js의 isFreeMode: registry currentStage===0 일 때 활성화, targetScore=Infinity
- StageClearScene._saveProgress(): localStorage에 클리어 스테이지 + 최고별 누적 저장
- WorldMapScene._isStageUnlocked(): 스테이지1 항상 열림, 나머지 이전 클리어 체크

## 기획설계 (planner-architect)
(상세 내용은 작업 로그로 요약됨. 원본은 git 이력 참조)
- 3개 페이즈 계획: P1(점프+난이도) → P2(스테이지+월드) → P3(씬흐름+저장)
- 총 18개 파일 변경 예정 (신규 8 + 수정 10)

## 테스트 결과 (tester)

### 페이즈 3 빌드 + 코드 검증 (2026-03-28)

**1. 빌드 테스트**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| npm run build 성공 | PASS | 24 modules, 646ms, 경고: chunk 1257KB (phaser 포함이라 정상) |

**2. 신규 파일 3개 확인**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| StageClearScene.js 존재 + Phaser.Scene 상속 | PASS | super('StageClearScene') |
| StageClearScene: init()에서 7개 데이터 수신 | PASS | score, stageData, worldData, targetScore, deathCount, nextStageId, isLastStage |
| StageClearScene: 별 계산 _calculateStars() | PASS | 1=기본, 2=score>=target*1.2, 3=deathCount===0 |
| StageClearScene: 별 3개 연출 _showStars() | PASS | 순서대로 0.4초 간격, scale 0->1.2->1 바운스 |
| StageClearScene: 획득/미획득 별 구분 | PASS | 획득=alpha 1+scale 1.2, 미획득=alpha 0.3+scale 0.8 |
| StageClearScene: 공룡 기뻐하는 애니메이션 | PASS | selectedDino 프레임1 + 위아래 통통 tween |
| StageClearScene: 월드 마지막 스테이지 해금 메시지 | PASS | stageId%5===0 && !isLastStage 분기 + getWorld(id+1) |
| StageClearScene: "다음 스테이지" 버튼 (일반) | PASS | nextStageId registry 설정 + GameScene 전환 |
| StageClearScene: "엔딩 보기" 버튼 (isLastStage) | PASS | EndingScene 전환 |
| StageClearScene: "월드맵" 버튼 | PASS | WorldMapScene 전환 |
| StageClearScene: _saveProgress() localStorage 저장 | PASS | key='ruvin_dino_progress', clearedStages+bestStars |
| StageClearScene: 최고 별 수 갱신 로직 | PASS | starCount > currentBest 시에만 덮어쓰기 |
| WorldMapScene.js 존재 + Phaser.Scene 상속 | PASS | super('WorldMapScene') |
| WorldMapScene: _loadProgress() 불러오기 | PASS | localStorage 파싱 + 실패 시 빈 객체 반환 |
| WorldMapScene: 6월드 x 5스테이지 = 30개 버튼 배치 | PASS | 3행2열 그리드, STAGES.filter(s=>s.world===world.id) |
| WorldMapScene: 3가지 상태 (잠금/해제/클리어) | PASS | 잠금=회색원+자물쇠, 해제=흰원+숫자, 클리어=금원+별 |
| WorldMapScene: _isStageUnlocked() 잠금 해제 로직 | PASS | id===1 항상열림, 나머지 이전스테이지 클리어 체크 |
| WorldMapScene: 스테이지 버튼 -> GameScene 전환 | PASS | currentStage registry 설정 후 scene.start |
| WorldMapScene: 잠금 스테이지는 인터랙션 없음 | PASS | if(isUnlocked) 조건부 setInteractive |
| WorldMapScene: bestStars 별 표시 (원 아래 미니) | PASS | isCleared && bestStar>0 시 repeat(bestStar) |
| WorldMapScene: "공룡 바꾸기"+"난이도 변경" 하단 버튼 | PASS | SelectScene/DifficultyScene 전환 |
| WorldMapScene: resize 대응 | PASS | _onResize -> scene.restart + shutdown에서 off |
| EndingScene.js 존재 + Phaser.Scene 상속 | PASS | super('EndingScene') |
| EndingScene: 금->보라 그라디언트 배경 | PASS | fillGradientStyle(0xFFD700, ..., 0xD4A5FF) |
| EndingScene: playEnding() 호출 | PASS | soundGenerator.playEnding() |
| EndingScene: 12개 반짝이 이모지 랜덤 배치 | PASS | sparkleChars 4종, fade+rotate+scale tween |
| EndingScene: 4마리 공룡 나란히 달리기 | PASS | DINOS.forEach, sprite.play(key+'_run'), 통통 tween |
| EndingScene: "축하해요!" + "루빈이의 대모험 완료!" 텍스트 | PASS | Back.easeOut 바운스 + 페이드인 |
| EndingScene: "처음부터 다시" 버튼 | PASS | localStorage.removeItem + currentStage=1 + SelectScene |
| EndingScene: "자유 모드" 버튼 | PASS | currentStage=0 + GameScene 전환 |
| EndingScene: 버튼 1.5초 지연 등장 | PASS | time.delayedCall(1500) |

**3. 수정 파일 검증 (5개)**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| main.js: 8개 씬 import | PASS | Boot, Select, Difficulty, WorldMap, Game, StageClear, GameOver, Ending |
| main.js: scene 배열 8개 등록 | PASS | 순서: Boot->Select->Difficulty->WorldMap->Game->StageClear->GameOver->Ending |
| GameScene.js: isFreeMode 판별 | PASS | currentStage===0 이면 자유모드 |
| GameScene.js: 자유모드 targetScore=Infinity | PASS | 절대 클리어 안됨 (무한 러너) |
| GameScene.js: deathCount 초기화 | PASS | this.deathCount=0 (별 3개 조건에 사용) |
| GameScene.js: isStageClear 상태 추가 | PASS | 클리어 시 입력차단+update 조기반환 |
| GameScene.js: _onStageClear() StageClearScene 전환 | PASS | 1.5초 딜레이 후 scene.start('StageClearScene', data) |
| GameScene.js: 클리어 데이터 전달 7개 필드 | PASS | score, stageData, worldData, targetScore, deathCount, isLastStage, nextStageId |
| GameScene.js: _onHitObstacle에서 isFreeMode 전달 | PASS | GameOverScene에 isFreeMode 전달 |
| GameOverScene.js: 실패 전용 (클리어 분기 제거) | PASS | init()에 stageClear 없음, create()에 분기 없음 |
| GameOverScene.js: init()에서 isFreeMode 수신 | PASS | data.isFreeMode || false |
| GameOverScene.js: "재도전" 버튼 | PASS | 같은 스테이지로 GameScene 재시작 |
| GameOverScene.js: "월드맵" 버튼 (자유모드 아닐때만) | PASS | if(!isFreeMode) WorldMapScene |
| GameOverScene.js: "공룡 바꾸기" 버튼 위치 분기 | PASS | 자유모드면 0.80, 아니면 0.90 |
| GameOverScene.js: 스테이지 정보 표시 (자유모드 아닐때) | PASS | stageData && worldData && !isFreeMode |
| DifficultyScene.js: _loadProgress() 추가 | PASS | localStorage 'ruvin_dino_progress' 파싱 |
| DifficultyScene.js: 진행도 분기 (출발 버튼) | PASS | clearedStages.length>0 -> WorldMap, 아니면 스테이지1 |
| SoundGenerator.js: playStageClear() | PASS | 도-미-솔-높은도 4음계, 0.15초 간격 |
| SoundGenerator.js: playEnding() | PASS | 도-레-미-파-솔-라-시-도 8음계 + 트릴 |

**4. 씬 흐름 검증 (코드 추적)**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| Boot -> Select (기존) | PASS | BootScene 로딩 완료 후 SelectScene 전환 |
| Select -> Difficulty (기존) | PASS | 공룡 선택 후 DifficultyScene 전환 |
| Difficulty -> Game (첫 플레이) | PASS | clearedStages.length===0 -> currentStage=1 -> GameScene |
| Difficulty -> WorldMap (이어하기) | PASS | clearedStages.length>0 -> WorldMapScene |
| Game -> StageClear (클리어) | PASS | score>=targetScore -> _onStageClear -> StageClearScene |
| Game -> GameOver (실패) | PASS | _onHitObstacle -> GameOverScene |
| StageClear -> Game (다음 스테이지) | PASS | currentStage=nextStageId -> GameScene |
| StageClear -> WorldMap | PASS | "월드맵" 버튼 -> WorldMapScene |
| StageClear -> Ending (스테이지 30) | PASS | isLastStage -> EndingScene |
| GameOver -> Game (재도전) | PASS | 같은 currentStage로 GameScene |
| GameOver -> WorldMap | PASS | "월드맵" 버튼 -> WorldMapScene |
| GameOver -> Select (공룡 바꾸기) | PASS | SelectScene 전환 |
| WorldMap -> Game (스테이지 선택) | PASS | currentStage=stageId -> GameScene |
| WorldMap -> Select (공룡 바꾸기) | PASS | SelectScene 전환 |
| WorldMap -> Difficulty (난이도 변경) | PASS | DifficultyScene 전환 |
| Ending -> Select (처음부터) | PASS | localStorage 초기화 + currentStage=1 + SelectScene |
| Ending -> Game (자유 모드) | PASS | currentStage=0 -> GameScene (isFreeMode=true) |

**5. localStorage 진행도 검증**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 저장 키: 'ruvin_dino_progress' | PASS | StageClearScene, WorldMapScene, DifficultyScene 모두 동일 키 |
| clearedStages 배열 구조 | PASS | 중복 방지: includes() 체크 후 push |
| bestStars 객체 구조 | PASS | { [stageId]: starCount } 형식 |
| 최고 별만 저장 (하향 방지) | PASS | starCount > currentBest 시에만 갱신 |
| JSON.parse 에러 처리 | PASS | try-catch + 빈 객체 반환 (3개 파일 모두) |
| "처음부터 다시" 시 초기화 | PASS | localStorage.removeItem('ruvin_dino_progress') |
| 자유모드에서 진행도 저장 안됨 | PASS | 자유모드는 StageClearScene을 거치지 않음 (targetScore=Infinity) |

**6. import/export 검증 (신규 3개 + 수정 5개)**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| StageClearScene: export class | PASS | named export |
| StageClearScene: import soundGenerator | PASS | ../utils/SoundGenerator.js |
| StageClearScene: import getWorld | PASS | ../data/worlds.js |
| WorldMapScene: export class | PASS | named export |
| WorldMapScene: import WORLDS | PASS | ../data/worlds.js |
| WorldMapScene: import STAGES | PASS | ../data/stages.js |
| WorldMapScene: import soundGenerator | PASS | ../utils/SoundGenerator.js |
| EndingScene: export class | PASS | named export |
| EndingScene: import DINOS | PASS | ../config.js |
| EndingScene: import soundGenerator | PASS | ../utils/SoundGenerator.js |
| main.js: 3개 신규 씬 import 경로 | PASS | ./scenes/StageClearScene.js, WorldMapScene.js, EndingScene.js |

### 종합

총 **78개** 항목 중 **78개 통과 / 0개 실패**

빌드 성공, 신규 3개 씬(StageClear/WorldMap/Ending) 구현 완전, 수정 5개 파일 정상 통합.
씬 흐름 17개 경로 모두 코드상 연결 확인, localStorage 저장/불러오기/초기화 로직 정상.
별 계산(1~3개), 잠금 해제, 자유 모드, 첫플레이/이어하기 분기 모두 논리적 오류 없음.
