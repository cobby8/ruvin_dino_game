# 에러 및 함정 모음
<!-- 담당: debugger, tester | 최대 30항목 -->
<!-- 이 프로젝트에서 반복되는 에러 패턴, 함정, 주의사항을 기록 -->

### [2026-03-28] Phaser origin(0.5,1) + body offset 불일치로 스프라이트 바닥 뚫기
- **분류**: error
- **발견자**: debugger
- **내용**: origin(0.5, 1)일 때 물리 바디 하단이 스프라이트 하단과 일치하려면 offsetY = displayHeight - bodyHeight여야 함. offsetY를 0.35로 설정하면 4.8px 차이로 스프라이트가 바닥 아래에 묻힘. 올바른 값은 0.4 (= 1.0 - 0.6). setCollideWorldBounds(true)도 ground collider와 간섭하므로 제거해야 함.
- **참조횟수**: 0

### [2026-03-28] forEach 안에서 씬 전환 호출 시 중복 실행 위험
- **분류**: error
- **발견자**: debugger
- **내용**: Phaser의 group.getChildren().forEach 안에서 _onStageClear() 같은 씬 전환 함수를 호출하면, forEach가 끝나지 않아 나머지 반복에서 점수 추가 + 중복 씬 전환이 발생할 수 있음. for + break로 교체하거나, 함수 시작에 중복 호출 방지 가드(if (this.isStageClear) return)를 추가해야 함.
- **참조횟수**: 0

### [2026-03-28] Phaser 스크롤 컨테이너 내 버튼 클릭과 드래그 스크롤 충돌
- **분류**: error
- **발견자**: debugger
- **내용**: scrollContainer 안의 interactive 오브젝트에 pointerdown으로 클릭 이벤트를 걸고, 동시에 씬 전체 input에 pointerdown으로 드래그 스크롤을 걸면 충돌 발생. 손가락이 조금만 움직여도 드래그로 인식되어 클릭이 작동하지 않음. 해결: 버튼 이벤트를 pointerup으로 변경하고, pointerdown 시작 위치와 pointerup 위치의 차이가 5px 미만이면 클릭으로 판정하는 _wasDragging 플래그를 사용.
- **참조횟수**: 0

### [2026-03-28] Phaser overlap 콜백에서 destroyed 오브젝트 접근 시 게임 멈춤
- **분류**: error
- **발견자**: debugger
- **내용**: Phaser의 physics.add.overlap() 콜백에서 충돌 대상의 body가 null(이미 destroy됨)인 상태로 body.velocity, body.blocked 등에 접근하면 TypeError 발생 → 게임 멈춤. 모든 overlap 콜백 시작에 `if (!obj.active || !obj.body) return;` 가드를 반드시 추가해야 함. 특히 동시에 여러 충돌이 같은 프레임에 발생할 때 위험.
- **참조횟수**: 0

### [2026-03-28] _gameOver/_onStageClear 중복 호출 시 씬 전환 에러
- **분류**: error
- **발견자**: debugger
- **내용**: 같은 프레임에 장애물+적이 동시에 공룡에 닿으면 _onHitObstacle과 _onHitEnemy가 모두 실행되어 _gameOver()가 두 번 호출될 수 있음. 두 번째 호출에서 이미 pause된 physics에 접근하거나 이미 시작된 씬 전환이 중복 발생하여 에러. _gameOver() 시작에 `if (this.isGameOver) return;` 가드 필수.
- **참조횟수**: 0

### [2026-03-28] 씬 종료 후 delayedCall/addEvent 타이머가 실행되어 에러
- **분류**: error
- **발견자**: debugger
- **내용**: Dino의 slideTimer, invincibleTimer, blinkTimer 등이 씬 전환(scene.start) 후에도 콜백이 실행될 수 있음. 이때 this.scene이나 this.body가 이미 null이라 TypeError 발생. shutdown()에서 모든 타이머를 명시적으로 destroy()해야 함.
- **참조횟수**: 0

### [2026-03-28] Phaser setCollideWorldBounds + ground collider 간섭
- **분류**: error
- **발견자**: debugger
- **내용**: body.setCollideWorldBounds(true)와 physics.add.collider(dino, ground)를 동시에 사용하면, 월드 하단 경계와 ground staticBody가 동시에 blocked.down = true를 유발하여 점프/착지 판정이 불안정해질 수 있음. ground collider가 있으면 setCollideWorldBounds는 제거하는 것이 안전.
- **참조횟수**: 0
