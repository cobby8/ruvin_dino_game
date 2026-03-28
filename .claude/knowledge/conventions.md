# 코딩 규칙 및 스타일
<!-- 담당: developer, reviewer | 최대 30항목 -->
<!-- 이 프로젝트만의 코드 스타일, 네이밍 규칙, 패턴을 기록 -->

### [2026-03-28] Phaser Graphics -> RenderTexture 스프라이트시트 패턴
- **분류**: convention
- **발견자**: reviewer
- **내용**: 외부 이미지 없이 Graphics로 그린 뒤 RenderTexture에 draw -> saveTexture -> texture.add(프레임번호, 소스, x, y, w, h) 순서로 스프라이트시트 등록. 반드시 Graphics와 RenderTexture는 사용 후 destroy() 호출.
- **참조횟수**: 0

### [2026-03-28] 오브젝트 풀링 패턴 (Phaser Arcade Group)
- **분류**: convention
- **발견자**: reviewer
- **내용**: physics.add.group() 생성 -> spawn 시 group.getFirstDead(false)로 재활용 시도 -> 없으면 group.create() -> 화면 밖 나가면 setActive(false).setVisible(false) + body.enable=false. 장애물 scored 등 커스텀 플래그는 spawn 시 초기화 필수.
- **참조횟수**: 0

### [2026-03-28] 씬 정리 패턴 (shutdown)
- **분류**: convention
- **발견자**: reviewer
- **내용**: 씬에서 scale.on('resize') 등록 시 반드시 shutdown()에서 scale.off('resize') 해제. BGM 등 전역 리소스도 shutdown()에서 정리. Phaser input 이벤트는 씬 종료 시 자동 정리됨.
- **참조횟수**: 0

### [2026-03-28] 6살 대상 게임 히트박스 관대화
- **분류**: convention
- **발견자**: reviewer
- **내용**: 어린이 대상 게임에서는 플레이어 히트박스를 실제 크기의 50~70%로 축소하고, 장애물 히트박스도 60~70%로 축소하여 "관대한 판정" 적용. body.setSize(width*비율, height*비율) + body.setOffset()으로 중앙 정렬.
- **참조횟수**: 0
