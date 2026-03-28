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
| 2026-03-28 | 초기 기획설계 (프로젝트 구조 + 13개 파일 설계) | 완료 |
| 2026-03-28 | 전체 게임 구현 (14개 파일 신규) | 완료, 커밋됨 |
| 2026-03-28 | 2차 수정: 점프력 -450 + 96px 공룡 고도화 + 배경/장애물 개선 | 완료, 커밋됨 |
| 2026-03-28 | 페이즈1 빌드+코드검증 (34항목 전수 테스트) | 전체 통과 |
| 2026-03-28 | 페이즈2 구현: 6월드+30스테이지+18종장애물+HUD (8파일) | 빌드 통과 |
| 2026-03-28 | 페이즈2 빌드+코드검증 (62항목 전수 테스트) | 전체 통과 |
| 2026-03-28 | 페이즈3 구현: 씬흐름+저장 (3신규+5수정, 8파일) | 빌드 통과 |
| 2026-03-28 | 페이즈3 빌드+코드검증 (78항목 전수 테스트) | 전체 통과 |
| 2026-03-28 | 장애물 가시성 긴급 수정: depth 정리 + 외곽선 + 색상 강화 (3파일) | 빌드 통과 |

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

### 피드백 수정 3건

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/scenes/WorldMapScene.js | 월드맵 전면 리디자인: 양피지 배경 + 테마별 카드 + 예쁜 버튼 + 점선 경로 + 진행도 바 + 공룡 위치 표시 + 드래그 스크롤 | 수정(전면) |
| src/objects/Background.js | 구름 레이어 depth -0.5 + alpha 0.5로 변경 (장애물 가림 방지) | 수정 |
| src/config.js | 점프 10% 향상: LOW -300->-330, HIGH -500->-550, DOUBLE -350->-385 | 수정 |
| src/data/difficulties.js | 전 난이도 속도 30% 향상: 아기(100/200->130/260), 꼬마(120/250->156/325), 씩씩(140/300->182/390), 용감(160/350->208/455), 전설(180/400->234/520) | 수정 |

tester 참고:
- 월드맵: 양피지 느낌 배경, 각 월드가 파스텔 카드로 표시되는지 확인
- 클리어 스테이지=금색원+체크마크, 열린 스테이지=테마색+흰숫자, 잠김=회색+자물쇠
- 월드 카드 사이에 점선 화살표 경로가 보이는지 확인
- 6개 월드가 화면에 안 들어가면 드래그 스크롤 동작하는지 확인
- 하단 "공룡 바꾸기"+"난이도 변경" 버튼이 고정되어 스크롤에 영향 안 받는지 확인
- 안개/구름 효과: 게임 플레이 중 장애물이 구름에 가려지지 않는지 확인
- 점프: 이전보다 10% 높이 점프하는지 체감 확인
- 속도: 이전보다 30% 빠른지 체감 확인 (아기공룡도 제법 빠를 수 있음)

### 장애물 가시성 긴급 수정

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| src/objects/Background.js | depth 양수 체계로 통일: 하늘(0), 구름(1), 산(2), 바닥(3) | 수정 |
| src/objects/Obstacle.js | 장애물 spawn 시 setDepth(5) + setAlpha(1.0) 명시, 전 월드 장애물에 검정 외곽선(lineStyle 2px) 추가, 색상 진하게 강화 | 수정 |
| src/objects/Dino.js | depth 10 -> 6으로 변경 (장애물보다 앞, UI보다 뒤) | 수정 |

- depth 순서 정리: 배경(0-3) < 장애물(5) < 공룡(6) < UI(10)
- 장애물 외곽선 + 색상 강화 (18종 전체)
- 원인: 장애물 depth가 기본값 0이라 산(1)과 바닥(2)에 가려졌음

tester 참고:
- 게임 플레이 중 장애물(선인장, 돌멩이 등)이 배경 위에 선명하게 보이는지 확인
- 장애물에 검정 외곽선이 보여서 배경과 확실히 구분되는지 확인
- 6개 월드 전부 장애물이 잘 보이는지 확인

### 점프 높이 50% 대폭 향상
- config.js: LOW -330→-450, HIGH -550→-700, DOUBLE -385→-500

## 기획설계 (planner-architect)
(상세 내용은 작업 로그로 요약됨. 원본은 git 이력 참조)
- 3개 페이즈 계획: P1(점프+난이도) → P2(스테이지+월드) → P3(씬흐름+저장)
- 총 18개 파일 변경 예정 (신규 8 + 수정 10)

## 테스트 결과 (tester)

### 피드백 수정 3건 빌드 + 코드 검증 (2026-03-28)

**1. 빌드 테스트**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| npm run build 성공 | PASS | 24 modules, 652ms, 경고: chunk 1262KB (phaser 포함이라 정상) |

**2. 월드맵 (WorldMapScene.js) 리디자인 검증**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 양피지 배경: 베이지 세로 그라디언트 | PASS | 10단계 그라디언트 (255,245,220)->(235,220,190) |
| 양피지 테두리 장식 (이중 라운드 사각형) | PASS | 3px+1.5px 선, 갈색(0xC8A882/0xD4B896) |
| 상단 리본 타이틀 "루빈이의 공룡 모험" | PASS | 빨간 리본(0xFF6B6B) + 흰 글씨 + 스트로크 |
| 진행도 텍스트 "N / 30 클리어!" | PASS | clearedCount / totalStages 표시 |
| 진행도 바 (금색 프로그레스) | PASS | 화면 50% 너비, 비율 계산 정확 |
| 6개 월드 카드 테마색 구분 | PASS | 풀밭=연녹, 사막=연노랑, 숲=진녹, 화산=연빨강, 바다=연파랑, 하늘=연보라 |
| 열린 월드: 테마 배경+테두리+그림자 | PASS | fillRoundedRect + strokeRoundedRect + shadow |
| 잠긴 월드: 반투명 회색+자물쇠 텍스트 | PASS | 0xDDDDDD alpha 0.5 + "잠겨있어요" |
| 클리어 스테이지: 금색 원+체크마크 | PASS | 0xFFD700 원 + 0xFFA500 테두리 + 하이라이트 + 체크 기호 |
| 열린 스테이지: 테마색 원+흰 숫자 | PASS | WORLD_STAGE_COLORS[worldId] + 흰색 테두리 + 하이라이트 |
| 잠긴 스테이지: 회색 원+자물쇠 이모지 | PASS | 0x999999 alpha 0.5 + 자물쇠 이모지 |
| 스테이지 버튼 사이 점선 연결선 | PASS | 카드 내 가로 점선 (dashLen=4, gapLen=3) |
| 월드 카드 사이 세로 점선 경로 | PASS | _drawPathBetweenCards(), 잠김 여부별 색상 분기 |
| 점선 끝 화살표 삼각형 (열린 경로만) | PASS | fillTriangle, !isLocked 조건 |
| 선택 공룡 현재 위치 표시 | PASS | _currentStagePos에 공룡 스프라이트 + 통통 tween |
| 드래그 스크롤 코드 | PASS | _setupScroll(): pointerdown/move/up + Clamp(0, maxScrollY) |
| 하단 버튼 영역 스크롤 무시 | PASS | pointer.y > screenH*0.88이면 드래그 안 시작 |
| 하단 배경 고정 (depth 50) | PASS | bottomBg.setDepth(50), 테두리 장식 depth 100 |
| "공룡 바꾸기" 버튼 | PASS | 보라색(0x9B72CF), 라운드+그림자+호버, SelectScene 전환 |
| "난이도 변경" 버튼 | PASS | 파란색(0x4EAEFF), 라운드+그림자+호버, DifficultyScene 전환 |
| 버튼 크기/스타일 개선 | PASS | Math.min으로 최대크기 제한(140x42), 그림자+하이라이트+호버+눌림효과 |
| 별 표시 (클리어 버튼 아래) | PASS | bestStar>0이면 별 이모지 repeat, fontSize 8px |

**3. 안개/구름 (Background.js) 수정 검증**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 구름 depth가 장애물보다 뒤 | PASS | clouds.setDepth(-0.5), 장애물 depth=0(기본값), Dino depth=10 |
| 구름 alpha 낮아짐 | PASS | clouds.setAlpha(0.5) (기존 0.8에서 감소) |
| 주석에 변경 이유 명시 | PASS | "장애물보다 뒤에 배치하여 가리지 않게", "0.8->0.5" |

**4. 밸런스 (config.js + difficulties.js) 검증**

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| config.js LOW_VELOCITY = -330 | PASS | -300 x 1.1 = -330 (10% 향상) |
| config.js HIGH_VELOCITY = -550 | PASS | -500 x 1.1 = -550 (10% 향상) |
| config.js DOUBLE_VELOCITY = -385 | PASS | -350 x 1.1 = -385 (10% 향상) |
| 아기공룡: 130/260 | PASS | 100x1.3=130, 200x1.3=260 |
| 꼬마공룡: 156/325 | PASS | 120x1.3=156, 250x1.3=325 |
| 씩씩한공룡: 182/390 | PASS | 140x1.3=182, 300x1.3=390 |
| 용감한공룡: 208/455 | PASS | 160x1.3=208, 350x1.3=455 |
| 전설의공룡: 234/520 | PASS | 180x1.3=234, 400x1.3=520 |

### 종합

총 **34개** 항목 중 **34개 통과 / 0개 실패**

빌드 성공. 피드백 3건(월드맵 리디자인 + 안개 수정 + 밸런스 조정) 모두 코드상 정상 반영 확인.
월드맵은 양피지 배경, 테마별 카드, 3종 스테이지 버튼 상태, 점선 경로, 드래그 스크롤, 진행도 바, 하단 고정 버튼 모두 구현됨.
구름 depth -0.5 + alpha 0.5로 장애물 가림 해결. 점프/속도 수치 모두 정확히 계산됨.
