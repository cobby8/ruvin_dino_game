/**
 * PauseScene.js - 게임 일시정지 오버레이 씬
 * GameScene 위에 launch()로 실행되어 반투명 배경 + 메뉴 버튼을 표시
 *
 * 비유: 영화 보다가 일시정지 누르면 나오는 메뉴 화면
 * - GameScene은 pause 상태로 뒤에 살아있음 (화면 멈춤)
 * - 이 씬이 그 위에 반투명하게 덮임
 */

import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  /**
   * init: launch() 시 전달받은 데이터를 저장
   * - GameScene에서 "다시하기"에 필요한 정보를 넘겨줌
   */
  init(data) {
    this.gameData = data || {};
  }

  create() {
    const { width, height } = this.scale;

    // === 반투명 어두운 오버레이 (전체 화면을 덮는 검정 반투명 사각형) ===
    // alpha=0.6이면 뒤의 게임 화면이 어둡게 비침
    this.overlay = this.add.rectangle(
      width / 2, height / 2,  // 화면 정중앙
      width, height,           // 화면 전체 크기
      0x000000, 0.6            // 검정색, 60% 불투명
    );
    this.overlay.setOrigin(0.5);

    // === "일시정지" 제목 텍스트 ===
    this.titleText = this.add.text(width / 2, height * 0.28, '일시정지', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // === 일시정지 아이콘 (|| 세로선 2개) ===
    // 제목 위에 큰 일시정지 심볼을 그래픽으로 그림
    const iconY = height * 0.18;
    const iconGraphics = this.add.graphics();
    iconGraphics.fillStyle(0xffffff, 0.9);
    // 왼쪽 세로선
    iconGraphics.fillRoundedRect(width / 2 - 18, iconY - 20, 10, 40, 3);
    // 오른쪽 세로선
    iconGraphics.fillRoundedRect(width / 2 + 8, iconY - 20, 10, 40, 3);

    // === 버튼 3개 생성 ===
    // 각 버튼은 둥근 사각형 배경 + 텍스트로 구성
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonStartY = height * 0.42;  // 첫 버튼 Y 위치
    const buttonGap = 70;                // 버튼 간 간격

    // 버튼 데이터 배열: [라벨, 콜백함수]
    const buttons = [
      { label: '계속하기', action: () => this._resumeGame() },
      { label: '다시하기', action: () => this._restartGame() },
      { label: '나가기',   action: () => this._exitToWorldMap() },
    ];

    buttons.forEach((btn, index) => {
      const y = buttonStartY + index * buttonGap;
      this._createButton(width / 2, y, buttonWidth, buttonHeight, btn.label, btn.action);
    });

    // === ESC / P 키로도 "계속하기" 가능 ===
    // 일시정지 진입할 때와 동일한 키로 다시 재개
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // === 화면 크기 변경 대응 ===
    this.scale.on('resize', this._onResize, this);
  }

  update() {
    // ESC 또는 P 키를 눌렀을 때 게임 재개 (JustDown = 한 번만 감지)
    if (Phaser.Input.Keyboard.JustDown(this.escKey) || Phaser.Input.Keyboard.JustDown(this.pKey)) {
      this._resumeGame();
    }
  }

  /**
   * 버튼 생성 헬퍼: 둥근 사각형 배경 + 중앙 텍스트
   * - 터치/클릭 가능, 호버 시 밝아지는 효과
   */
  _createButton(x, y, w, h, label, callback) {
    // 버튼 배경 (둥근 사각형) - Graphics로 그려서 텍스처로 변환
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.85);  // 진한 회색, 약간 투명
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    // 테두리
    bg.lineStyle(2, 0xffffff, 0.5);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    // 버튼 텍스트
    const text = this.add.text(x, y, label, {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 투명한 히트 영역 (터치/클릭을 받는 영역)
    // Graphics 자체는 interactive가 까다로우므로, 별도 Rectangle을 히트 영역으로 사용
    const hitArea = this.add.rectangle(x, y, w, h, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    // 호버 효과: 마우스 올리면 배경 밝아짐
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x555555, 0.9);  // 더 밝은 회색
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
      bg.lineStyle(2, 0xffffff, 0.7);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    });

    // 호버 해제: 원래 색으로
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x333333, 0.85);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
      bg.lineStyle(2, 0xffffff, 0.5);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    });

    // 클릭/터치 시 콜백 실행
    hitArea.on('pointerdown', callback);

    return { bg, text, hitArea };
  }

  /**
   * 계속하기: GameScene을 resume하고 이 씬을 닫음
   */
  _resumeGame() {
    this.scene.resume('GameScene');  // GameScene의 update() 다시 시작
    this.scene.stop();               // PauseScene 자신을 종료
  }

  /**
   * 다시하기: GameScene을 완전히 껐다가 다시 시작
   * - registry에 이미 selectedDino, currentStage 등이 저장되어 있으므로
   *   별도 데이터 전달 없이 scene.start만 하면 됨
   */
  _restartGame() {
    this.scene.stop('GameScene');     // 기존 GameScene 종료
    this.scene.start('GameScene');    // 새로 시작 (registry에서 데이터 읽음)
  }

  /**
   * 나가기: WorldMapScene으로 이동 (진행 데이터 저장 안 함)
   */
  _exitToWorldMap() {
    this.scene.stop('GameScene');         // GameScene 종료
    this.scene.start('WorldMapScene');    // 월드맵으로 이동
  }

  /**
   * 화면 크기 변경 시 오버레이 크기 재조정
   */
  _onResize(gameSize) {
    const { width, height } = gameSize;
    if (this.overlay) {
      this.overlay.setPosition(width / 2, height / 2);
      this.overlay.setSize(width, height);
    }
  }

  /**
   * 씬 종료 시 정리
   */
  shutdown() {
    this.scale.off('resize', this._onResize, this);
    // 키보드 키 해제
    if (this.escKey) this.input.keyboard.removeKey(this.escKey);
    if (this.pKey) this.input.keyboard.removeKey(this.pKey);
  }
}
