# 작업 스크래치패드

## 현재 작업
- **요청**: 6살 루빈이를 위한 귀여운 공룡 점프 러너 게임 제작 (Phaser 3 + Vite + JS)
- **상태**: ✅ 완료 (커밋됨)
- **현재 담당**: pm

## 진행 현황
| 단계 | 상태 | 담당 |
|------|------|------|
| 1. 기획설계 | ✅ 완료 | planner-architect |
| 2. 프로젝트 세팅 + 코드 구현 | ✅ 완료 | developer |
| 3. 테스트 + 리뷰 | ✅ 완료 | tester + reviewer |
| 4. 커밋 | ✅ 완료 | pm |

## 기획설계 (planner-architect)

### 목표
6살 루빈이를 위한 귀여운 아기공룡 점프 러너 게임. Phaser 3 + Vite + JS로 만들고, 나중에 Capacitor로 APK 변환 가능한 구조.

---

### 프로젝트 구조 (건물 층별 안내도)

```
ruvin_dino_game/
├── index.html                ← 건물 정문 (게임이 시작되는 HTML)
├── package.json              ← 건물 자재 목록 (필요한 라이브러리)
├── vite.config.js            ← 건물 설계 도구 설정
├── capacitor.config.json     ← APK 변환용 설정 (나중에 추가)
├── src/
│   ├── main.js               ← 건물 관리실 (Phaser 엔진 초기화, 게임 설정)
│   ├── config.js             ← 게임 규칙집 (물리/밸런스 상수 모음)
│   ├── utils/
│   │   └── SoundGenerator.js ← 효과음 공장 (Web Audio로 소리 생성)
│   ├── objects/
│   │   ├── DinoGraphics.js   ← 공룡 그리기 공장 (4마리 공룡 스프라이트시트 생성)
│   │   ├── Dino.js           ← 공룡 레고블록 (플레이어 캐릭터 클래스)
│   │   ├── Obstacle.js       ← 장애물 레고블록 (선인장, 돌멩이 클래스)
│   │   └── Background.js     ← 배경 레고블록 (패럴랙스 스크롤링)
│   ├── scenes/
│   │   ├── BootScene.js      ← 1층: 로비 (에셋 로딩, 스프라이트시트 생성)
│   │   ├── SelectScene.js    ← 2층: 접수처 (공룡 선택 화면)
│   │   ├── GameScene.js      ← 3층: 메인홀 (실제 게임플레이)
│   │   └── GameOverScene.js  ← 4층: 휴게실 (게임오버, 재시작)
│   └── assets/               ← 창고 (이미지, 사운드 - 현재는 코드로 생성)
└── public/
    └── fonts/                ← 폰트 (Jua - Google Fonts CDN 사용)
```

---

### 파일별 구현 방향

#### 1. index.html
- Phaser 게임 캔버스를 담을 컨테이너 div
- Google Fonts Jua 로드 (CDN link)
- viewport meta 설정 (모바일 최적화)
- 전체화면 CSS (margin:0, overflow:hidden, 검정 배경)

#### 2. vite.config.js
- Phaser 3 번들링 최적화
- base: './' 설정 (Capacitor 빌드 시 상대경로 필요)
- build.outDir: 'dist' (Capacitor의 webDir과 일치)

#### 3. src/main.js (건물 관리실)
- Phaser.Game 인스턴스 생성
- Arcade Physics 활성화
- 게임 크기: 부모 컨테이너 100% (Phaser Scale Manager RESIZE 모드)
- portrait 모드 최적화: 기본 360x640, 자동 스케일링
- 씬 등록 순서: Boot -> Select -> Game -> GameOver
- 배경색: 하늘색 (#87CEEB)

#### 4. src/config.js (게임 규칙집) -- 핵심 밸런스 파라미터
```
GAME = {
  // 물리
  GRAVITY: 800,              // 중력 (px/s^2) - 부드러운 낙하
  JUMP_VELOCITY: -350,       // 점프력 (음수 = 위로) - 6살 기준 넉넉한 점프
  GROUND_Y_RATIO: 0.82,      // 바닥 위치 (화면 높이의 82%)

  // 속도 (6살 맞춤 - 매우 느리게 시작)
  INITIAL_SPEED: 120,        // 시작 속도 (px/s)
  MAX_SPEED: 280,            // 최대 속도
  SPEED_INCREMENT: 2,        // 10점마다 속도 증가량

  // 장애물
  OBSTACLE_GAP_MIN: 1800,    // 장애물 간 최소 간격(ms) - 넉넉하게
  OBSTACLE_GAP_MAX: 3000,    // 장애물 간 최대 간격(ms)
  OBSTACLE_GAP_DECREASE: 50, // 난이도에 따른 간격 감소

  // 캐릭터
  DINO_SIZE: 48,             // 공룡 기본 크기 (px)
  DINO_SCALE: 1.5,           // 게임 내 공룡 확대

  // 칭찬 메시지
  PRAISE_INTERVAL: 10,       // 10점마다 칭찬
  PRAISE_MESSAGES: ["대단해!", "멋지다!", "최고야!", "루빈이 짱!", "와우!"]
}
```

#### 5. src/objects/DinoGraphics.js (공룡 그리기 공장) -- 핵심 설계

**접근 방식: Phaser Graphics -> RenderTexture -> 스프라이트시트**

각 공룡을 Phaser.GameObjects.Graphics로 그린 뒤, RenderTexture에 찍어서 텍스처로 등록.
프레임 4장 (달리기 2프레임 + 점프 1프레임 + 넘어짐 1프레임)을 가로로 이어붙인 스프라이트시트 생성.

**4마리 공룡 디자인 규격:**
- 공통: 48x48px 프레임, 크고 반짝이는 눈(흰+검정 원), 핑크 볼터치(분홍 원), 통통한 몸(둥근 사각형)
- 프레임 구성: [달리기1, 달리기2, 점프, 넘어짐] = 192x48 스프라이트시트

| 공룡 | 메인색상 | 특징 그리기 |
|------|---------|-----------|
| 브라키오 | #6BCB77 (초록) | 위로 긴 목+작은 머리, 긴 꼬리, 큰 몸통 |
| 티라노 | #FF8C42 (주황) | 큰 머리+작은 이빨 2개, 짧은 팔, 짧은 꼬리 |
| 트리케라 | #9B72CF (보라) | 머리 위 뿔 1개+프릴(반원), 넓은 몸 |
| 프테라노 | #4EAEFF (파랑) | 양쪽 작은 날개(삼각형), 머리 뒤 볏, 날씬한 몸 |

**달리기 애니메이션:**
- 프레임1: 왼발 앞 / 프레임2: 오른발 앞 (다리 위치만 교대)

**점프 표정 변화:**
- 달리기: 동그란 눈 / 점프: 눈 더 크게 + 입 벌림(놀란 표정)

#### 6. src/objects/Dino.js (공룡 캐릭터)
- Phaser.Physics.Arcade.Sprite 상속
- 선택된 공룡 타입에 따라 텍스처 키 설정
- play('run') 애니메이션 자동 재생 (framerate: 8fps)
- jump() 메서드: 바닥에 있을 때만 점프, 속도 JUMP_VELOCITY 적용, 'jump' 프레임 전환
- 착지 감지: body.touching.down이면 다시 'run' 애니메이션

#### 7. src/objects/Obstacle.js (장애물)
- Phaser Graphics로 직접 그린 장애물 텍스처:
  - 작은 선인장: 20x30px 녹색 기둥 + 가시
  - 큰 선인장: 30x45px 녹색 기둥 + 가시 + 팔
  - 돌멩이: 25x20px 회색 둥근 사각형
- Phaser.Physics.Arcade.Group으로 오브젝트 풀링 (재활용)
- 화면 왼쪽 밖으로 나가면 비활성화 -> 재활용

#### 8. src/objects/Background.js (패럴랙스 배경)
- 4개 레이어 (뒤에서 앞으로):
  1. 하늘: 연한 파랑 그라디언트 (고정 또는 매우 느린 스크롤)
  2. 구름: 흰색 둥근 뭉게구름 2~3개 (속도 x0.2)
  3. 산: 연보라/연녹 삼각형 산맥 (속도 x0.4)
  4. 풀밭: 연두색 바닥 + 작은 꽃, 풀 (속도 x1.0, 게임 속도와 동일)
- 각 레이어를 tileSprite로 만들어 tilePositionX로 스크롤

#### 9. src/utils/SoundGenerator.js (효과음 공장)
- Phaser Sound + Web Audio API 조합
- OscillatorNode + GainNode로 간단한 효과음 생성:
  - 점프음: 짧은 상승 주파수 (300Hz->600Hz, 0.1초)
  - 점수음: 높은 띵 (800Hz, 0.08초)
  - 게임오버: 하강 주파수 (500Hz->200Hz, 0.3초)
  - BGM: 단순 멜로디 루프 (도레미 시퀀스, 작은 볼륨)

#### 10. src/scenes/BootScene.js (1층: 로비)
- "루빈이의 공룡 모험" 로딩 텍스트 표시
- DinoGraphics를 호출하여 4종 공룡 스프라이트시트 텍스처 생성
- Obstacle 텍스처 생성 (선인장, 돌멩이)
- Background 텍스처 생성 (구름, 산, 풀밭)
- SoundGenerator로 효과음 생성 및 캐싱
- 완료 후 SelectScene으로 전환

#### 11. src/scenes/SelectScene.js (2층: 접수처)
- 상단: "루빈이의 공룡 모험" 타이틀 (Jua 폰트, 큰 크기, 그림자)
- 중앙: 4장의 공룡 카드 가로 배치 (모바일에서는 2x2 그리드)
  - 각 카드: 공룡 스프라이트 + 이름(한글) + 배경색 원
  - 터치/클릭 시: 선택 카드 확대(scale 1.2) + 트윈 반짝이 + 다른 카드 축소
- 하단: "모험 시작!" 버튼 (선택 전 회색/비활성, 선택 후 노란색/활성)
- 선택된 공룡 키를 registry에 저장하여 GameScene에서 사용

#### 12. src/scenes/GameScene.js (3층: 메인홀) -- 가장 복잡
- **create():**
  - Background 생성 (4레이어 패럴랙스)
  - 바닥 물리 오브젝트 (보이지 않는 static body)
  - Dino 생성 (선택된 공룡, 화면 왼쪽 1/4 위치)
  - 장애물 그룹 초기화
  - 점수 텍스트 (상단 중앙, 큰 Jua 폰트)
  - 입력 설정: 스페이스바 + 화면 터치(pointerdown)
  - BGM 시작

- **update():**
  - 배경 스크롤 업데이트
  - 장애물 생성 타이머 (랜덤 간격)
  - 장애물 이동 (오른쪽->왼쪽)
  - 충돌 체크: Dino vs 장애물 -> 게임오버
  - 점수 체크: 장애물이 공룡 뒤를 지나면 +1
  - 10점마다 칭찬 메시지 트윈
  - 난이도 증가 (점수 기반 속도 증가)
  - Dino 착지 감지 -> 애니메이션 전환

- **장애물 스폰 로직:**
  - 타이머 이벤트로 랜덤 간격(GAP_MIN~GAP_MAX)마다 생성
  - 3종 중 랜덤 선택 (작은선인장 50%, 큰선인장 30%, 돌멩이 20%)
  - 오브젝트 풀에서 꺼내 화면 오른쪽 밖에 배치
  - 속도는 현재 게임 속도에 맞춤

#### 13. src/scenes/GameOverScene.js (4층: 휴게실)
- 반투명 검정 오버레이
- "앗! 다시 해볼까?" 텍스트 (Jua 폰트)
- 이번 점수 + 최고 점수 표시 (localStorage 'ruvin_dino_highscore')
- 넘어진 공룡 스프라이트 (넘어짐 프레임)
- "다시하기" 버튼 -> GameScene 재시작
- "공룡 바꾸기" 버튼 -> SelectScene으로 이동
- 최고 점수 갱신 시 "신기록!" 효과

---

### 기존 코드 연결
- 새 프로젝트이므로 기존 코드 연결 없음
- Capacitor 추가 시: dist/ 폴더를 webDir로 지정, capacitor.config.json 추가

---

### 실행 계획

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 |
|------|------|------|----------|----------|
| 1 | 프로젝트 초기화 (npm init, Phaser/Vite 설치, index.html, vite.config.js, main.js) | developer | 5분 | 없음 |
| 2 | config.js + SoundGenerator.js 작성 | developer | 5분 | 1단계 |
| 3 | DinoGraphics.js 작성 (4마리 공룡 스프라이트시트 생성) | developer | 10분 | 1단계 |
| 4 | Obstacle.js + Background.js 작성 | developer | 8분 | 1단계 |
| 5 | BootScene.js + SelectScene.js 작성 | developer | 8분 | 2,3,4단계 |
| 6 | GameScene.js 작성 (메인 게임플레이) | developer | 10분 | 5단계 |
| 7 | GameOverScene.js 작성 + 전체 연결 및 테스트 | developer | 5분 | 6단계 |

* 2,3,4단계는 모두 1단계만 선행이므로 병렬 가능 (developer가 순차 진행하되, 서로 독립적)
* 테스트(tester)는 7단계 완료 후 전체 플레이테스트

---

### developer 주의사항

1. **Phaser Graphics로 공룡 그리기가 이 프로젝트의 핵심 난이도.** DinoGraphics.js에서 각 공룡의 특징을 살리면서도 48x48px에 맞춰야 한다. 너무 복잡하게 그리지 말고, 원+사각형+삼각형 조합으로 단순화할 것.

2. **RenderTexture로 스프라이트시트 만드는 패턴:**
   - Graphics에 그린다 -> RenderTexture에 draw한다 -> generateTexture()로 텍스처 키 등록
   - 프레임별로 x 오프셋을 달리하여 4프레임 가로 배열
   - spritesheet으로 등록 시 frameWidth/frameHeight 명시

3. **모바일 입력:** pointerdown 이벤트는 Phaser input으로 처리. 게임 영역 전체를 터치 존으로.

4. **Jua 폰트:** index.html에서 Google Fonts CDN으로 로드. Phaser에서 사용 시 WebFont Loader 없이도 CSS에 선언 후 텍스트에 fontFamily: 'Jua' 적용 가능. 단, 폰트 로딩 완료를 보장하려면 BootScene에서 약간의 딜레이 또는 document.fonts.ready 활용.

5. **Capacitor 대비:** vite.config.js에서 base: './' 필수. 절대경로 사용 금지. 모든 에셋은 코드로 생성하므로 파일 경로 문제 없음.

6. **6살 난이도:** INITIAL_SPEED가 120으로 매우 느리게 시작. 장애물 간격도 1.8~3초로 넉넉. 이 값은 테스트 후 미세 조정할 수 있지만, 처음에는 쉽게 설정할 것.

7. **오브젝트 풀링:** 장애물은 매번 new 하지 말고 Group의 getFirstDead()로 재활용. 메모리 효율 + 모바일 성능 중요.

## 구현 기록 (developer)

구현한 기능: 6살 루빈이를 위한 귀여운 공룡 점프 러너 게임 전체 구현

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| index.html | 게임 HTML 진입점, Jua 폰트 CDN, 모바일 viewport 설정 | 신규 |
| vite.config.js | Vite 설정, base './' (Capacitor 대비) | 신규 |
| package.json | scripts(dev/build/preview), phaser + vite 의존성 | 수정 |
| src/main.js | Phaser.Game 초기화, 4개 씬 등록, Scale RESIZE 모드 | 신규 |
| src/config.js | 게임 밸런스 상수 (속도/중력/간격), 공룡 4종 정보 | 신규 |
| src/utils/SoundGenerator.js | Web Audio API로 효과음 생성 (점프/점수/게임오버/칭찬/BGM) | 신규 |
| src/objects/DinoGraphics.js | 4마리 공룡 스프라이트시트 코드 생성 (48x48 x 4프레임) | 신규 |
| src/objects/Dino.js | 공룡 캐릭터 클래스 (점프/착지/넘어짐) | 신규 |
| src/objects/Obstacle.js | 장애물 텍스처 생성 + 오브젝트 풀링 관리 | 신규 |
| src/objects/Background.js | 패럴랙스 배경 3레이어 (구름/산/풀밭) | 신규 |
| src/scenes/BootScene.js | 텍스처 일괄 생성 + 폰트 로딩 대기 | 신규 |
| src/scenes/SelectScene.js | 공룡 선택 UI (2x2 그리드 카드 + 시작 버튼) | 신규 |
| src/scenes/GameScene.js | 메인 게임 루프 (달리기/장애물/점수/칭찬/난이도) | 신규 |
| src/scenes/GameOverScene.js | 게임오버 화면 (점수/최고기록/다시하기/공룡바꾸기) | 신규 |

설치한 npm 패키지: phaser, vite (devDependency)

tester 참고:
- 실행: npm run dev -> 브라우저에서 http://localhost:5173
- 정상 동작: 로딩 -> 공룡 선택 -> 점프 러너 게임 -> 게임오버 -> 다시하기
- 테스트 포인트: 모바일 터치 점프, 스페이스바 점프, 장애물 충돌, 점수 증가, 칭찬 메시지, 최고기록 저장
- 주의: 첫 터치 전 효과음 미작동 가능 (브라우저 정책 정상)

reviewer 참고:
- DinoGraphics.js가 핵심: 48px에 4마리 특징 살리기 위해 단순 도형 조합 사용
- 오브젝트 풀링 패턴 적용 (Obstacle.js)
- staticBody로 바닥 구현 (GameScene.js)

---
### 2차 수정: 점프력 + 그래픽 고도화

구현한 기능: 점프력 강화, 공룡 96px 고해상도 리디자인, 배경/장애물 그래픽 개선

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/config.js | JUMP_VELOCITY -350 -> -450, DINO_SIZE 48 -> 96, DINO_SCALE 1.5 -> 1.0 | 수정 |
| src/objects/DinoGraphics.js | 96x96px 전면 재작성: 입체감(2색 이상), 큰눈+하이라이트, 볼터치, 공룡별 디테일(목줄무늬/이빨/프릴뿔/날개막), 넘어짐 혀내밈+X눈, 다리간격 12px | 수정(전면) |
| src/objects/Background.js | 하늘 그라디언트 레이어 추가, 구름 원 4개 겹침, 산 2겹 곡선, 풀밭 다양한 높이 풀+분홍/노랑 꽃 | 수정 |
| src/objects/Obstacle.js | 선인장 하이라이트줄+가시 추가+꼭대기 분홍꽃, 돌멩이 그라디언트+갈색 금무늬 | 수정 |
| src/objects/Dino.js | 히트박스 비율 조정 (높이 0.7 -> 0.6, 오프셋 0.3 -> 0.35) 96px 대응 | 수정 |
| src/scenes/SelectScene.js | 공룡 스프라이트 스케일 조정 (cardW/60 -> cardW/110) | 수정 |
| src/scenes/GameOverScene.js | 넘어진 공룡 스케일 2.5 -> 1.5 (96px 대응) | 수정 |

tester 참고:
- npm run build 에러 없음 확인 완료
- 실행: npm run dev -> 브라우저에서 확인
- 점프가 이전보다 더 높아짐 (JUMP_VELOCITY -350 -> -450)
- 공룡이 96px로 커지면서 디테일이 보임 (DINO_SCALE 1.0이므로 실제 화면 크기는 이전과 비슷)
- 배경에 하늘 그라디언트 레이어 추가됨
- 선인장 꼭대기에 분홍 꽃, 돌에 금무늬 확인

reviewer 참고:
- DinoGraphics.js가 핵심 변경: 공통 얼굴 함수 3개(normal/surprised/fallen)로 분리
- Background.js에 sky 레이어 추가 (총 4레이어)

## 테스트 결과 (tester)

### 1. 빌드 테스트

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| npm install 정상 완료 | ✅ 통과 | node_modules 존재, phaser + vite 설치됨 |
| npm run build 에러 없음 | ✅ 통과 | vite v8.0.3, 660ms 빌드 완료 |
| dist/ 폴더 정상 생성 | ✅ 통과 | dist/index.html + dist/assets/index-*.js 생성됨 |

### 2. 코드 구조 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| 14개 파일 존재 확인 | ✅ 통과 | index.html, vite.config.js, package.json, main.js, config.js, SoundGenerator.js, DinoGraphics.js, Dino.js, Obstacle.js, Background.js, BootScene.js, SelectScene.js, GameScene.js, GameOverScene.js |
| import/export 관계 올바름 | ✅ 통과 | 모든 모듈 간 import 경로가 정확하고, export된 함수/클래스 이름이 일치함 |
| 씬 등록 순서 Boot->Select->Game->GameOver | ✅ 통과 | main.js line 37: scene: [BootScene, SelectScene, GameScene, GameOverScene] |
| main.js에서 4개 씬 모두 등록 | ✅ 통과 | 4개 씬 모두 import + scene 배열에 등록됨 |

### 3. 핵심 기능 코드 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| DinoGraphics: 4마리 공룡 스프라이트시트 생성 | ✅ 통과 | brachio(초록), trex(주황), tricera(보라), ptera(파랑) 각각 192x48 (4프레임) RenderTexture 생성, 애니메이션 등록(run/jump/fall) |
| config.js: 밸런스 상수 존재 | ✅ 통과 | GRAVITY:800, JUMP_VELOCITY:-350, INITIAL_SPEED:120, MAX_SPEED:280, SPEED_INCREMENT:2 등 모두 존재 |
| GameScene: 스페이스바 점프 | ✅ 통과 | line 69: addKey(SPACE) + line 101: JustDown(spaceKey) -> dino.jump() |
| GameScene: 터치 입력 점프 | ✅ 통과 | line 72: input.on('pointerdown') -> dino.jump() |
| GameScene: 장애물 충돌 -> 게임오버 | ✅ 통과 | line 50: physics.add.overlap(dino, obstacleManager.group) -> _onHitObstacle |
| GameScene: 점수 카운트 로직 | ✅ 통과 | line 124-154: 장애물이 공룡 뒤를 지나면 +1, 10점마다 속도 증가 + 칭찬 메시지 |
| GameOverScene: localStorage 최고점수 | ✅ 통과 | line 31: localStorage.getItem('ruvin_dino_highscore'), 신기록 시 setItem |
| GameOverScene: 다시하기/공룡바꾸기 버튼 | ✅ 통과 | line 108-127: '다시하기' -> GameScene, '공룡 바꾸기' -> SelectScene |
| SelectScene: 공룡 선택 + registry 저장 | ✅ 통과 | line 190: registry.set('selectedDino', DINOS[i].key) |
| SelectScene: 시작 버튼 (선택 전 회색/후 노랑) | ✅ 통과 | 초기 0xAAAAAA(회색), _activateButton()에서 0xFFCC00(노랑)으로 변경 |
| SoundGenerator: Web Audio API 효과음 | ✅ 통과 | playJump, playScore, playGameOver, playPraise, playSelect, startBGM/stopBGM 모두 구현 |

### 4. 모바일 대응 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| index.html viewport meta 설정 | ✅ 통과 | width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no |
| touch-action: none 설정 | ✅ 통과 | body에 touch-action: none (더블탭 줌 방지) |
| main.js Scale RESIZE 모드 | ✅ 통과 | Phaser.Scale.RESIZE + CENTER_BOTH |
| 터치 입력 이벤트 바인딩 | ✅ 통과 | GameScene: input.on('pointerdown'), SelectScene: 카드별 hitArea.on('pointerdown') |

### 5. Capacitor 대비 검증

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| vite.config.js base: './' 설정 | ✅ 통과 | line 5: base: './' |
| 외부 파일 의존 없이 코드 생성 | ⚠️ 주의 | 이미지/오디오는 모두 코드 생성으로 OK. 단, Jua 폰트는 Google Fonts CDN 의존 (오프라인 시 기본 폰트 폴백) |

### 6. 추가 발견사항

| 항목 | 상태 | 비고 |
|------|------|------|
| 빌드 청크 크기 경고 | ⚠️ 참고 | Phaser 포함 1,219KB (500KB 초과). Phaser 자체가 큰 라이브러리라 정상적인 경고. 기능에 영향 없음 |
| dist/fonts/ 폴더 비어있음 | ⚠️ 참고 | public/fonts/ 가 복사되었으나 내용 없음 (CDN 폰트 사용이라 문제 없음) |
| Dino.js 점프 시 효과음 | ✅ 통과 | body.blocked.down 체크 후 점프 + playJump() 호출 |
| 오브젝트 풀링 패턴 | ✅ 통과 | Obstacle.js: getFirstDead(false) -> 재활용, cleanup()으로 화면 밖 비활성화 |
| 히트박스 관대한 설정 (6살 배려) | ✅ 통과 | Dino: 50%x70% 축소, Obstacle: 60%x70% 축소 |

---

📊 **종합: 22개 중 22개 통과 / 0개 실패 (주의사항 2건)**

**최종 판정: ✅ 통과**

주의사항 요약:
1. Jua 폰트가 Google Fonts CDN 의존 -> Capacitor 오프라인 빌드 시 폰트 번들링 별도 필요할 수 있음 (현재 단계에서는 문제 아님)
2. 빌드 청크 1.2MB 경고는 Phaser 라이브러리 특성상 정상

## 리뷰 결과 (reviewer)

📊 종합 판정: **승인**

---

### 1. 설계서 준수 여부 - 양호

- 공룡 4종 스프라이트시트: 설계서대로 48x48px, 4프레임, 192x48 구현됨
- 게임 밸런스 파라미터: config.js에 설계서 수치 그대로 반영됨
- 씬 전환 흐름: Boot -> Select -> Game -> GameOver 정상
- 패럴랙스 배경: 3레이어(구름/산/풀밭)로 구현. 설계서 4레이어 중 하늘은 backgroundColor로 처리. 실질적으로 동일.

### 2. 코드 품질 - 양호

잘된 점:
- 모든 파일에 한글 주석 풍부. 바이브 코더 유지보수에 최적
- 파일 상단 JSDoc + 건물 비유("1층: 로비" 등) 직관적
- config.js에 밸런스 상수 분리 - 나중에 조정 매우 편리
- 네이밍 일관성 좋음: _privateMethod, camelCase 통일
- 관심사 분리 깔끔 (Graphics/Logic/Scene)

### 3. 게임 로직 검증

- 점프 물리: GRAVITY 800 + JUMP_VELOCITY -350, 체공시간 약 0.875초. 6살에게 적절
- 장애물 스폰: 확률 분배 적절 (50/30/20%), GAP 1800~3000ms로 넉넉
- 점수 카운트: scored 플래그로 중복 방지, obstacle.x < dino.x - 20 조건 정확
- 난이도 증가: 10점마다 10px/s씩, MAX_SPEED 280 제한. 급격한 점프 없음
- 오브젝트 풀링: getFirstDead(false) + cleanup() 패턴 정상

### 4. 성능/메모리 - 양호

- 오브젝트 풀링 올바르게 적용 (getFirstDead -> 재활용)
- BootScene에서 텍스처 1회 생성, 이후 재사용
- Graphics 객체 생성 후 즉시 destroy() - 메모리 누수 방지
- 씬 shutdown()에서 resize 리스너 + BGM 정리 정상

### 5. 6살 사용자 경험 - 양호

잘된 점:
- 초기 속도 120px/s = 매우 느려서 6살도 반응 가능
- 충돌 박스 50~70% 축소 = "관대한 판정" (훌륭한 배려)
- 칭찬 메시지 10점마다 + 금색 텍스트 + 트윈 = 동기부여 좋음
- "앗! 다시 해볼까?" - 부정적이지 않은 게임오버 메시지

---

### 권장 수정 (선택사항)

| 심각도 | 파일 | 내용 |
|--------|------|------|
| 권장 | GameOverScene.js:142 | 버튼 크기 180x44 -> 200x55로 키우면 6살 터치 편의 향상 |
| 권장 | SelectScene.js:174 | 시작 버튼 크기 160x50 -> 180x55로 키우면 더 좋음 |
| 참고 | SoundGenerator.js:94 | BGM setInterval + setTimeout 조합에서 stopBGM 시 잔여음 미세하게 남을 수 있음. 볼륨 0.05라 거의 안 들림 |

**최종: 치명적 이슈 없음. 설계서 대비 충실하게 구현됨. 한글 주석 풍부, 6살 배려(관대한 히트박스, 느린 시작 속도) 인상적. 승인.**

--- 피드백 대응 분석 (2차) ---

### Part 1: 점프 밸런스 분석

**현재 설정값:**
| 항목 | 값 | 위치 |
|------|-----|------|
| GRAVITY (중력) | 800 px/s^2 | config.js:9 |
| JUMP_VELOCITY (점프힘) | -350 px/s | config.js:10 |
| GROUND_Y_RATIO (바닥) | 0.82 (화면 82%) | config.js:11 |
| DINO_SIZE (공룡 크기) | 48px | config.js:24 |
| DINO_SCALE (공룡 확대) | 1.5배 | config.js:25 |
| 공룡 히트박스 | 50%W x 70%H | Dino.js:39 |
| 장애물 히트박스 | 60%W x 70%H | Obstacle.js:142-143 |

**물리 계산:**
- 최대 점프 높이 = V^2 / (2 x G) = 350^2 / (2 x 800) = **76.56px**
- 체공시간 = 2 x V / G = 2 x 350 / 800 = **0.875초**

**장애물 vs 점프 비교:**
| 장애물 | 텍스처 크기 | 히트박스 높이 (70%) | 바닥에서 상단까지 | 넘으려면 필요한 점프 |
|--------|-----------|-------------------|-----------------|-------------------|
| 작은 선인장 | 20x30 | 21px | ~45px | ~65px (여유 있음) |
| 큰 선인장 | 30x45 | 31.5px | ~67px | ~87px (부족!) |
| 돌멩이 | 25x20 | 14px | ~30px | ~50px (여유 있음) |

**문제 원인:**
큰 선인장(30% 확률)의 상단이 바닥에서 약 67px인데, 공룡의 최대 점프 높이는 76.56px입니다. 공룡 히트박스 하단(발에서 위로 약 21.6px)을 고려하면, 실제로 장애물을 "넘는" 높이는 76.56 - 21.6 = 약 55px뿐입니다. 큰 선인장 상단 67px을 넘기에 **12px 부족**합니다.

쉽게 말하면: 공룡이 아무리 높이 뛰어도 큰 선인장의 꼭대기에 머리(히트박스)가 걸립니다.

**해결 방안 3가지:**

| 방안 | 변경 내용 | 새 점프높이 | 장단점 |
|------|----------|-----------|-------|
| A. 점프력 증가 | JUMP_VELOCITY: -350 -> **-450** | 126.6px | 가장 직관적. 다른 장애물은 더 쉬워짐 |
| B. 중력 감소 | GRAVITY: 800 -> **600** | 102.1px | 점프가 둥실둥실 느낌. 체공시간 1.17초로 길어짐 |
| C. 큰 선인장 축소 | 30x45 -> **30x35** | 76.56px (그대로) | 점프 자체는 안 바꿈. 장애물만 낮아짐 |

**추천: A안 (JUMP_VELOCITY: -450) + 미세 조정**
- JUMP_VELOCITY를 -350에서 **-450**으로 변경
- GRAVITY는 800 그대로 유지 (현재 느낌이 자연스러우므로)
- 체공시간: 0.875초 -> 1.125초 (약간 더 오래 떠있음)
- 새 최대 점프높이: 126.6px -> 모든 장애물을 넉넉하게 넘을 수 있음
- 6살 아이에게 "높이 뛰는 느낌"이 더 재미있을 수 있음

**수정 대상 파일:**
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/config.js (10행) | JUMP_VELOCITY: -350 -> -450 | 수정 |

---

### Part 2: 그래픽 고도화 방안 비교

**현재 상태:** 모든 그래픽을 Phaser Graphics API (원, 사각형, 삼각형)로 48x48px에 그리고 있음. 귀엽지만 단순한 도형 조합.

**방안 A: SVG 파일 사용**
| 항목 | 평가 |
|------|------|
| 구현 난이도 | 보통 |
| 품질 향상도 | 크게 (벡터 그래픽이라 어떤 크기에서든 선명) |
| 작업량 | SVG 파일 제작 + BootScene.js에서 SVG 로드 로직 추가 + DinoGraphics.js 대체 |
| Capacitor 호환 | 문제 없음 (SVG를 assets/에 넣으면 됨) |
| 장점 | 확대/축소해도 깨지지 않음, AI 도구(Claude Artifacts 등)로 SVG 생성 가능, 파일 크기 작음 |
| 단점 | Phaser에서 SVG를 직접 스프라이트시트로 쓰려면 변환 과정 필요, 애니메이션 프레임별 SVG 파일 필요(공룡당 4개 = 16개 파일), SVG 렌더링 성능이 Canvas보다 약간 느릴 수 있음 |
| 추천 여부 | 보통 - 파일 수가 많아지고 현재 "외부 에셋 없음" 원칙에 어긋남 |

**방안 B: 현재 Phaser Graphics 코드 고도화**
| 항목 | 평가 |
|------|------|
| 구현 난이도 | 보통 |
| 품질 향상도 | 보통 (더 디테일한 도형 조합 가능하지만 한계 있음) |
| 작업량 | DinoGraphics.js + Obstacle.js + Background.js 수정 |
| Capacitor 호환 | 완벽 (기존과 동일한 구조) |
| 장점 | 현재 구조 유지 (외부 파일 없음), 기존 코드 기반으로 점진적 개선, Capacitor 경로 문제 없음 |
| 단점 | Phaser Graphics API의 한계가 있음 (그라디언트 fill 미지원, 복잡한 곡선 어려움), 48px 캔버스에서 디테일 추가에 물리적 한계, 코드가 길어지고 복잡해짐 |
| 가능한 개선 | 캔버스 크기 48px -> 64px 또는 96px, 더 많은 레이어(그림자, 하이라이트), 곡선(bezier) 사용, 색상 변화 추가 |
| 추천 여부 | 추천 - 리스크 적고, 현재 구조 유지하면서 점진적 개선 |

**방안 C: PNG 스프라이트시트 이미지 파일**
| 항목 | 평가 |
|------|------|
| 구현 난이도 | 쉬움 (이미지만 교체하면 됨) |
| 품질 향상도 | 크게 (전문 픽셀아트 or AI 생성 이미지 사용 가능) |
| 작업량 | PNG 파일 제작 + assets/에 배치 + BootScene.js에서 preload로 로드 + DinoGraphics.js 불필요해짐 |
| Capacitor 호환 | 주의 필요 - 빌드 시 assets 경로가 올바르게 복사되는지 확인 필요. vite에서 public/ 또는 import로 처리하면 문제 없음 |
| 장점 | 품질 상한선이 가장 높음, AI 이미지 생성 도구로 고품질 캐릭터 제작 가능, 코드가 훨씬 단순해짐 (그리기 코드 삭제) |
| 단점 | 외부 파일 의존성 생김 (현재 원칙 위반), 이미지 제작 필요 (누가 만들 것인가?), 색상/크기 변경이 코드로 즉시 안 됨 |
| 추천 여부 | 강력 추천 - 품질 대비 구현 난이도가 가장 좋음. 특히 AI 생성 이미지 활용 시 |

**방안 D: Canvas 2D API 직접 사용 (OffscreenCanvas)**
| 항목 | 평가 |
|------|------|
| 구현 난이도 | 어려움 |
| 품질 향상도 | 크게 (그라디언트, 복잡한 곡선, 그림자 모두 가능) |
| 작업량 | DinoGraphics.js 전면 재작성, Canvas 2D로 그린 뒤 Phaser 텍스처로 변환하는 브릿지 코드 필요 |
| Capacitor 호환 | 문제 없음 (순수 JS 코드) |
| 장점 | 그라디언트, 그림자, 복잡한 곡선 등 Phaser Graphics보다 훨씬 풍부한 API, 외부 파일 없이 고품질 가능, createLinearGradient, shadowBlur 등 사용 가능 |
| 단점 | 코드 복잡도 크게 증가, OffscreenCanvas 호환성 (대부분 브라우저 OK지만 구형 WebView 주의), Phaser Graphics와 다른 API라 학습 필요, 디버깅 어려움 |
| 추천 여부 | 비추천 - 복잡도 대비 효과가 방안 C보다 낮음 |

---

### 최종 추천

**1순위: 방안 C (PNG 스프라이트시트)** - 가장 추천
- 이유: AI 이미지 생성 도구로 고품질 캐릭터/장애물 PNG를 만들면 코드 변경 최소, 품질 향상 최대
- "외부 에셋 없음" 원칙을 깨지만, 품질 향상이 크고 Capacitor에서도 public/ 폴더에 넣으면 문제 없음
- DinoGraphics.js의 복잡한 그리기 코드를 단순한 preload + spritesheet 로드로 대체
- 바이브 코더가 이미지만 교체하면 캐릭터를 바꿀 수 있어서 유지보수도 쉬움

**2순위: 방안 B (Phaser Graphics 고도화)** - 안전한 선택
- 이유: 현재 구조를 유지하면서 점진적으로 개선. 리스크 최소
- 캔버스 크기를 48 -> 64px로 키우고, 더 많은 도형 레이어 추가
- "외부 에셋 없음" 원칙 유지

**실행 계획 (C안 기준):**
| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|----------|
| 1 | config.js JUMP_VELOCITY 수정 (-350 -> -450) | developer | 없음 |
| 2 | 공룡 4종 + 장애물 3종 PNG 스프라이트시트 제작 | 별도 (AI 도구 or 디자인) | 없음 |
| 3 | public/assets/에 PNG 파일 배치 + BootScene.js에서 preload 추가 | developer | 2단계 |
| 4 | DinoGraphics.js를 preload 방식으로 교체 (또는 삭제) | developer | 3단계 |
| 5 | Obstacle.js 텍스처 생성을 preload 방식으로 교체 | developer | 3단계 |
| 6 | 테스트 (점프 밸런스 + 그래픽 확인) | tester | 1,4,5단계 |

**developer 주의사항:**
- 점프 밸런스(1단계)는 config.js 숫자 하나만 바꾸면 되는 간단한 작업
- 그래픽 고도화는 PNG 이미지가 준비된 후에 진행
- PNG 사용 시 public/assets/ 폴더에 넣고, Phaser의 this.load.spritesheet()로 로드
- 기존 generateTexture() 방식 대신 preload()에서 이미지를 미리 로드하는 방식으로 변경

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| reviewer | GameOverScene.js | 버튼 크기 180x44 -> 200x55 (6살 터치 편의, 권장) | 대기 |
| reviewer | SelectScene.js | 시작 버튼 160x50 -> 180x55 (6살 터치 편의, 권장) | 대기 |

## 작업 로그 (최근 10건만 유지)
| 날짜 | 에이전트 | 작업 내용 | 결과 |
|------|---------|----------|------|
| 2026-03-28 | planner-architect | 공룡 점프 러너 게임 전체 구현 설계서 작성 | 완료 - 13개 파일, 7단계 계획 |
| 2026-03-28 | developer | 전체 게임 구현 (14개 파일, 7단계 완료) | 완료 - npm run dev로 실행 가능 |
| 2026-03-28 | tester | 빌드 테스트 + 코드 레벨 기능 검증 (22항목) | 전체 통과, 주의사항 2건 |
| 2026-03-28 | reviewer | 코드 품질 리뷰 (5개 관점) | 승인 - 권장 수정 2건 |
| 2026-03-28 | planner-architect | 피드백 대응 분석: 점프 밸런스 + 그래픽 고도화 방안 | 완료 - JUMP_VELOCITY -450 제안, 그래픽은 PNG 스프라이트시트 추천 |
