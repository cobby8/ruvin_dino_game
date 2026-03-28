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
