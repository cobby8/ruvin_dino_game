# 프로젝트 구조 지식
<!-- 담당: planner-architect, developer | 최대 30항목 -->
<!-- 프로젝트의 폴더 구조, 파일 역할, 핵심 패턴을 기록 -->

### [2026-03-28] 프로젝트 전체 구조
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: Phaser 3 + Vite + JavaScript 기반 2D 러너 게임. 씬 기반 구조(Boot->Select->Game->GameOver). 모든 그래픽 에셋은 Phaser Graphics로 런타임에 생성 (외부 이미지 파일 없음). Capacitor APK 변환 대비 구조.
- **참조횟수**: 0

### [2026-03-28] 폴더 역할
- **분류**: architecture
- **발견자**: planner-architect
- **내용**:
  - `src/scenes/` - Phaser Scene 클래스들 (게임의 각 화면)
  - `src/objects/` - 재사용 가능한 게임 오브젝트 (공룡, 장애물, 배경)
  - `src/utils/` - 유틸리티 (사운드 생성기)
  - `src/config.js` - 게임 밸런스 상수 모음 (한 곳에서 관리)
- **참조횟수**: 0

### [2026-03-28] 핵심 패턴: Graphics -> RenderTexture -> 스프라이트시트
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 이 프로젝트는 외부 이미지를 사용하지 않고 Phaser Graphics API로 모든 그래픽을 코드로 그린다. Graphics로 그린 것을 RenderTexture에 찍고 generateTexture()로 텍스처 키를 등록하는 패턴을 사용. 공룡은 4프레임 스프라이트시트(달리기2+점프1+넘어짐1)로 생성.
- **참조횟수**: 0

### [2026-03-28] 씬 전환 흐름
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: BootScene(에셋생성) -> SelectScene(공룡선택, registry에 저장) -> GameScene(게임플레이) -> GameOverScene(점수표시) -> GameScene 또는 SelectScene으로 분기
- **참조횟수**: 0

### [2026-03-28] 확장 씬 전환 흐름 (v2 설계)
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: Boot -> Select(공룡) -> Difficulty(난이도5단계) -> WorldMap(월드맵) -> Game(스테이지플레이) -> StageClear(축하) 또는 GameOver(실패). 30스테이지 전체 클리어 시 Ending. 새 씬 4개: DifficultyScene, WorldMapScene, StageClearScene, EndingScene. 진행도는 localStorage('ruvin_dino_progress')에 저장.
- **참조횟수**: 0

### [2026-03-28] 데이터 파일 분리 구조
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: src/data/ 폴더 신규. stages.js(30개 스테이지 정의), worlds.js(6개 월드 정의), difficulties.js(5단계 난이도 파라미터). config.js에 모든 데이터를 넣지 않고, 역할별로 분리하여 관리 편의성 향상.
- **참조횟수**: 0

### [2026-03-28] 월드별 텍스처 네이밍 규칙
- **분류**: architecture
- **발견자**: planner-architect
- **내용**: 배경: bg_sky_{worldId}, bg_cloud_{worldId}, bg_mountain_{worldId}, bg_grass_{worldId}. 장애물: obstacle_w{worldId}_{종류} (예: obstacle_w2_skull). 6개 월드 x 4레이어 = 24개 배경 텍스처 + 6월드 x 3종 = 18개 장애물 텍스처. 모두 BootScene에서 일괄 생성.
- **참조횟수**: 0
